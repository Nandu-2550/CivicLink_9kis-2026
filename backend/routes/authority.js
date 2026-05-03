const express = require("express");
const jwt = require("jsonwebtoken");
const Complaint = require("../models/Complaint");
const { requireAuth, requireRole } = require("../middleware/auth");
const { CATEGORIES } = require("../utils/aiRouter");
const User = require("../models/User");

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

module.exports = router;
