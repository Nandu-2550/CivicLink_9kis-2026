const express = require("express");
const multer = require("multer");
const path = require("path");
const Complaint = require("../models/Complaint");
const Notification = require("../models/Notification");
const { routeCategory } = require("../utils/aiRouter");
const { requireAuth, requireRole } = require("../middleware/auth");
const { createCloudinaryStorage } = require("../config/cloudinary");

const router = express.Router();

function uploadsDir() {
  const base = process.env.UPLOAD_DIR || "uploads";
  return path.join(process.cwd(), base);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir()),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/", requireAuth, requireRole("citizen"), upload.single("file"), async (req, res) => {
  try {
    const { title, description, lat, lng } = req.body || {};
    if (!title || !description) return res.status(400).json({ message: "Missing fields" });

    const category = routeCategory(description);
    const attachmentUrl = req.file ? `/uploads/${req.file.filename}` : "";

    const complaint = await Complaint.create({
      citizen: req.user.userId,
      title: String(title).trim(),
      description: String(description).trim(),
      category,
      location: {
        lat: lat === undefined || lat === null || lat === "" ? null : Number(lat),
        lng: lng === undefined || lng === null || lng === "" ? null : Number(lng)
      },
      attachmentUrl
    });

    return res.status(201).json({ complaint });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/mine", requireAuth, requireRole("citizen"), async (req, res) => {
  try {
    const complaints = await Complaint.find({ citizen: req.user.userId })
      .select("title description category status statusHistory resolutionProof attachmentUrl location createdAt updatedAt")
      .sort({ createdAt: -1 });
    
    // Explicitly map to ensure all fields including resolutionProof are always included
    const mappedComplaints = complaints.map(c => ({
      _id: c._id,
      title: c.title,
      description: c.description,
      category: c.category,
      status: c.status,
      statusHistory: c.statusHistory,
      resolutionProof: c.resolutionProof || "",
      attachmentUrl: c.attachmentUrl,
      location: c.location,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }));
    
    return res.json({ complaints: mappedComplaints });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

// Cloudinary storage for resolution proof images
const cloudinaryStorage = createCloudinaryStorage("civiclink/resolution-proofs");
const cloudinaryUpload = multer({ storage: cloudinaryStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// PUT /api/complaints/:id/status - Authority updates complaint status
router.put("/:id/status", requireAuth, requireRole("authority"), cloudinaryUpload.single("resolutionProof"), async (req, res) => {
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
    
    // Add to status history
    complaint.statusHistory.push({ step: status, date: new Date() });
    
    // Handle resolution proof image (Cloudinary URL) - save whenever file is uploaded
    if (req.file) {
      complaint.resolutionProof = req.file.path; // Cloudinary returns the URL in req.file.path
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
        resolutionProof: complaint.resolutionProof
      }
    });
  } catch (err) {
    console.error("Status update error:", err);
    return res.status(500).json({ message: "Server error" });
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
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
