const express = require("express");
const jwt = require("jsonwebtoken");
const Complaint = require("../models/Complaint");
const { requireAuth, requireRole } = require("../middleware/auth");
const { CATEGORIES } = require("../utils/aiRouter");
const User = require("../models/User");
const { sendStatusUpdateEmail } = require("../utils/email");
const Notification = require("../models/Notification");

const router = express.Router();

function parseCodes() {
  try {
    return JSON.parse(process.env.AUTHORITY_CODES_JSON || "{}");
  } catch {
    return {};
  }
}

router.post("/login", async (req, res) => {
  const { category, secretCode } = req.body || {};
  if (!category || !secretCode) return res.status(400).json({ message: "Missing fields" });
  if (!CATEGORIES.includes(String(category))) return res.status(400).json({ message: "Invalid category" });

  const expected = parseCodes()[String(category)];
  if (!expected || String(secretCode) !== String(expected)) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ role: "authority", category: String(category) }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
  return res.json({ token, authority: { category: String(category) } });
});

router.get("/complaints", requireAuth, requireRole("authority"), async (req, res) => {
  try {
    const complaints = await Complaint.find({ category: req.user.category })
      .populate("citizen", "name email")
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
      location: c.location || { lat: null, lng: null, formattedAddress: "" },
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      citizen: c.citizen,
      currentStage: c.currentStage,
      attachmentUrl: c.attachmentUrl || c.citizenImage || ""
    }));

    return res.json({ complaints: mappedComplaints });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

router.patch("/complaints/:id/stage", requireAuth, requireRole("authority"), async (req, res) => {
  try {
    const { stage, note } = req.body || {};
    if (!stage) return res.status(400).json({ message: "Missing stage" });

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Not found" });
    if (complaint.category !== req.user.category) return res.status(403).json({ message: "Forbidden" });

    complaint.currentStage = String(stage);
    complaint.timeline.push({ stage: String(stage), note: String(note || "") });
    await complaint.save();

    // Create an in-app notification so the citizen sees it in their dashboard bell icon
    try {
      await Notification.create({
        userId: complaint.citizen,
        message: `Update: Your complaint regarding "${complaint.title}" has progressed to: ${stage}`,
        complaintId: complaint._id,
        isRead: false
      });
    } catch (err) {
      console.error("Error creating stage notification:", err.message);
    }

    // Send email notification for stage/progress updates
    try {
      const citizenUser = await User.findById(complaint.citizen);
      if (citizenUser && citizenUser.email) {
        // Await directly so Vercel does not freeze the function before it finishes sending!
        await sendStatusUpdateEmail(citizenUser.email, complaint, String(stage));
      }
    } catch (err) {
      console.error("Error fetching citizen for email:", err.message);
    }

    return res.json({ complaint });
  } catch (err) {
    console.error("Stage update error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
