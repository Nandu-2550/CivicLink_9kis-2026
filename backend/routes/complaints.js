const express = require("express");
const multer = require("multer");
const path = require("path");
const Complaint = require("../models/Complaint");
const Notification = require("../models/Notification");
const { routeCategory } = require("../utils/aiRouter");
const { requireAuth, requireRole } = require("../middleware/auth");
const { createCloudinaryStorage } = require("../config/cloudinary");

const router = express.Router();

const cloudinaryStorage = createCloudinaryStorage("civiclink/citizen-proofs");
const upload = multer({ storage: cloudinaryStorage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/", requireAuth, requireRole("citizen"), upload.single("file"), async (req, res) => {
  try {
    const { title, description, lat, lng, location: rawLocation } = req.body || {};
    if (!title || !description) return res.status(400).json({ message: "Missing fields" });

    const category = await routeCategory(description);
    const citizenImage = req.file ? (req.file.path || req.file.secure_url || req.file.url || "") : "";

    const parsedLocation = { lat: null, lng: null, formattedAddress: "" };
    if (rawLocation) {
      try {
        const parsed = JSON.parse(String(rawLocation));
        if (typeof parsed === "object" && parsed !== null) {
          parsedLocation.lat = parsed.lat !== undefined && parsed.lat !== null && parsed.lat !== "" ? Number(parsed.lat) : null;
          parsedLocation.lng = parsed.lng !== undefined && parsed.lng !== null && parsed.lng !== "" ? Number(parsed.lng) : null;
          parsedLocation.formattedAddress = String(parsed.formattedAddress || "").trim();
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
      citizenImage: c.citizenImage || "",
      authorityImage: c.authorityImage || "",
      resolutionProof: c.authorityImage || c.resolutionProof || "",
      location: c.location || { lat: null, lng: null, formattedAddress: "" },
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      attachmentUrl: c.citizenImage || ""
    }));
    
    return res.json({ complaints: mappedComplaints });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Get complaints error:", errorMessage, err);
    return res.status(500).json({ message: "Server error", error: errorMessage });
  }
});

// Cloudinary storage for resolution proof images
const resolutionCloudinaryStorage = createCloudinaryStorage("civiclink/resolution-proofs");
const cloudinaryUpload = multer({ storage: resolutionCloudinaryStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// PUT /api/complaints/:id/status - Authority updates complaint status
router.put("/:id/status", requireAuth, requireRole("authority"), (req, res, next) => {
  cloudinaryUpload.single("resolutionProof")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      console.error("Multer error during resolutionProof upload:", err.message, err);
      return res.status(400).json({ message: `File upload error: ${err.message}` });
    } else if (err) {
      // An unknown error occurred when uploading (e.g., from Cloudinary storage engine).
      console.error("Unknown error during resolutionProof upload:", err.message, err);
      return res.status(500).json({ message: "Server error during file upload", error: err.message });
    }
    // If no error from Multer, proceed to the route handler logic
    next();
  });
}, async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ["Pending", "Under Review", "In Progress", "Resolved"];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be one of: " + validStatuses.join(", ") });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Update status
    complaint.status = status;
    
    // Ensure the history array exists before pushing
    if (!Array.isArray(complaint.statusHistory)) {
      complaint.statusHistory = [];
    }
    complaint.statusHistory.push({ step: status, date: new Date() });

    // Handle authority resolution proof image (Cloudinary URL only)
    const authorityImageUrl = req.file?.path || req.file?.secure_url || req.file?.url;
    if (authorityImageUrl) {
      complaint.authorityImage = authorityImageUrl;
      complaint.resolutionProof = authorityImageUrl;
    }

    await complaint.save();

    // Auto-generate notification for the citizen
    const notificationMessage = `Update: Your complaint regarding "${complaint.title}" is now ${status}.`;
    await Notification.create({
      userId: complaint.citizen,
      message: notificationMessage,
      complaintId: complaint._id,
      isRead: false
    });

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
    console.error("Status update error:", errorMessage, err); // Log the error message and full error object
    return res.status(500).json({ message: "Server error", error: errorMessage });
  }
});

// GET /api/complaints/:id - Get single complaint details
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("citizen", "name email")
      .lean();
    
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Check if user is authorized to view
    const isCitizen = complaint.citizen._id.toString() === req.user.userId;
    const isAuthority = req.user.role === "authority";
    
    if (!isCitizen && !isAuthority) {
      return res.status(403).json({ message: "Not authorized to view this complaint" });
    }

    return res.json({ complaint });
  } catch (err) { // Added 'err' parameter
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Get single complaint error:", errorMessage, err);
    return res.status(500).json({ message: "Server error", error: errorMessage });
  }
});

module.exports = router;
