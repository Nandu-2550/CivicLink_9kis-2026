const express = require("express");
const multer = require("multer");
const path = require("path");
const Complaint = require("../models/Complaint");
const Notification = require("../models/Notification");
const { routeCategory } = require("../utils/aiRouter");
const { requireAuth, requireRole } = require("../middleware/auth");
const { createCloudinaryStorage } = require("../config/cloudinary");
const { sendNotification } = require("../utils/notificationService");
const User = require("../models/User");

const router = express.Router();

const cloudinaryStorage = createCloudinaryStorage("civiclink/citizen-proofs");
const upload = multer({ storage: cloudinaryStorage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/", requireAuth, requireRole("citizen"), upload.single("file"), async (req, res) => {
  try {
    const { title, description, lat, lng, location: rawLocation } = req.body || {};
    if (!title || !description) return res.status(400).json({ message: "Missing fields" });

    const category = await routeCategory(description);
    const citizenImage = req.file ? (req.file.path || req.file.secure_url || req.file.url || "") : "";

    const parsedLocation = { lat: null, lng: null, address: "" };
    if (rawLocation) {
      try {
        const parsed = JSON.parse(String(rawLocation));
        if (typeof parsed === "object" && parsed !== null) {
          parsedLocation.lat = parsed.lat !== undefined && parsed.lat !== null && parsed.lat !== "" ? Number(parsed.lat) : null;
          parsedLocation.lng = parsed.lng !== undefined && parsed.lng !== null && parsed.lng !== "" ? Number(parsed.lng) : null;
          parsedLocation.address = String(parsed.address || parsed.formattedAddress || "").trim();
        }
      } catch {
        // ignore invalid JSON and fall back to individual fields
      }
    }
    if (lat !== undefined && lat !== null && lat !== "") parsedLocation.lat = Number(lat);
    if (lng !== undefined && lng !== null && lng !== "") parsedLocation.lng = Number(lng);

    const complaint = await Complaint.create({
      citizen: req.user.userId,
      title: String(title).trim(),
      description: String(description).trim(),
      category,
      location: parsedLocation,
      citizenImage,
      attachmentUrl: citizenImage
    });

    // Notify the citizen that their complaint was received (Non-blocking)
    User.findById(req.user.userId).then(citizenUser => {
      if (citizenUser) {
        sendNotification(citizenUser, 'COMPLAINT_FILED', { title: complaint.title, id: complaint._id }).catch(err => {
          console.error("[ComplaintCreation] Async notification dispatch failed:", err.message);
        });
      }
    }).catch(err => {
      console.error("[ComplaintCreation] User lookup for notification failed:", err.message);
    });

    return res.status(201).json({ complaint });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Complaint creation error:", errorMessage, err);
    return res.status(500).json({ message: "Server error", error: errorMessage });
  }
});

router.get("/mine", requireAuth, requireRole("citizen"), async (req, res) => {
  try {
    const complaints = await Complaint.find({ citizen: req.user.userId })
      .select("title description category status statusHistory authorityImage citizenImage location createdAt updatedAt")
      .sort({ createdAt: -1 });

    const mappedComplaints = complaints.map(c => ({
      _id: c._id,
      title: c.title,
      description: c.description,
      category: c.category,
      status: c.status,
      statusHistory: c.statusHistory,
      citizenImage: c.citizenImage || c.attachmentUrl || "",
      authorityImage: c.authorityImage || "",
      resolutionProof: c.authorityImage || c.resolutionProof || "",
      location: c.location || { lat: null, lng: null, address: "" },
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      attachmentUrl: c.attachmentUrl || c.citizenImage || ""
    }));

    return res.json({ complaints: mappedComplaints });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Get complaints error:", errorMessage, err);
    return res.status(500).json({ message: "Server error", error: errorMessage });
  }
});

const resolutionCloudinaryStorage = createCloudinaryStorage("civiclink/resolution-proofs");
const cloudinaryUpload = multer({ storage: resolutionCloudinaryStorage, limits: { fileSize: 10 * 1024 * 1024 } });

router.put("/:id/status", requireAuth, requireRole("authority"), (req, res, next) => {
  cloudinaryUpload.single("resolutionProof")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer error during resolutionProof upload:", err.message, err);
      return res.status(400).json({ message: `File upload error: ${err.message}` });
    } else if (err) {
      console.error("Unknown error during resolutionProof upload:", err.message, err);
      return res.status(500).json({ message: "Server error during file upload", error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ["Pending", "Under Review", "In Progress", "Resolved"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be one of: " + validStatuses.join(", ") });
    }

    console.log(`[StatusUpdate] Received update for ID: ${req.params.id} to Status: ${status}`);

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      console.error(`[StatusUpdate] Complaint not found: ${req.params.id}`);
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (req.user.role === "authority" && req.user.category && complaint.category !== req.user.category) {
      console.warn(`[StatusUpdate] Security Alert: Authority ${req.user.category} tried to access ${complaint.category}`);
      return res.status(403).json({ message: `Forbidden...` });
    }

    const isStatusChanging = complaint.status !== status;
    const isCustomNote = note && String(note).trim() !== "" && !String(note).includes(`Status changed to ${status}`);

    if (isStatusChanging || isCustomNote) {
      if (!Array.isArray(complaint.statusHistory)) complaint.statusHistory = [];
      complaint.statusHistory.push({ 
        step: status, 
        note: String(note || `Status changed to ${status}`).trim(), 
        date: new Date() 
      });
    }

    complaint.status = status;
    complaint.currentStage = status;
    await complaint.save();
    console.log(`[StatusUpdate] DB Save Successful for: ${req.params.id}`);

    try {
      const citizenUser = await User.findById(complaint.citizen);
      if (citizenUser) {
        console.log(`[StatusUpdate] Dispatching notification to citizen: ${citizenUser.email || citizenUser.phone}`);
        await sendNotification(citizenUser, 'STATUS_UPDATE', { title: complaint.title, newStatus: status });
        console.log(`[StatusUpdate] Notification dispatch successful for: ${req.params.id}`);
      }
    } catch (notifErr) {
      console.error("[StatusUpdate] Notification dispatch failed:", notifErr.message);
    }

    return res.json({
      message: "Status updated successfully",
      complaint: {
        _id: complaint._id,
        status: complaint.status,
        statusHistory: complaint.statusHistory,
        authorityImage: complaint.authorityImage,
        resolutionProof: complaint.resolutionProof
      }
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Status update error:", errorMessage, err);
    return res.status(500).json({ message: "Server error", error: errorMessage });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("citizen", "name email phone")
      .lean();

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const isCitizen = complaint.citizen._id.toString() === req.user.userId;
    const isAuthority = req.user.role === "authority";

    if (!isCitizen && !isAuthority) {
      return res.status(403).json({ message: "Not authorized to view this complaint" });
    }

    return res.json({ complaint });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Get single complaint error:", errorMessage, err);
    return res.status(500).json({ message: "Server error", error: errorMessage });
  }
});

router.delete("/:id", requireAuth, requireRole("citizen"), async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    if (complaint.citizen.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized to delete this complaint" });
    }

    await Complaint.findByIdAndDelete(req.params.id);
    return res.json({ message: "Complaint deleted successfully" });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Delete complaint error:", errorMessage);
    return res.status(500).json({ message: "Server error", error: errorMessage });
  }
});

module.exports = router;
