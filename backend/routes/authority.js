const express = require("express");
const jwt = require("jsonwebtoken");
const Complaint = require("../models/Complaint");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

function parseCodes() {
  try {
    // Expected format: {"Police": "CODE1", "Traffic": "CODE2", ...}
    return JSON.parse(process.env.AUTHORITY_CODES_JSON || "{}");
  } catch {
    console.error("Failed to parse AUTHORITY_CODES_JSON");
    return {};
  }
}

router.post("/login", async (req, res) => {
  const { deptCode } = req.body || {};
  
  if (!deptCode) {
    return res.status(400).json({ message: "Department Secret Code is required" });
  }

  try {
    const codes = parseCodes();
    const normalizedInput = String(deptCode).trim();
    
    // Find matching category by value
    const matchingCategory = Object.keys(codes).find(key => 
      String(codes[key]).trim() === normalizedInput
    );

    if (!matchingCategory) {
      return res.status(401).json({ message: "Invalid Department Secret Code" });
    }

    // Issue Authority Token
    // We keep role: "authority" for middleware compatibility
    // but the instruction mentioned using dept name as role, 
    // so we'll ensure category is set to the dept name.
    const token = jwt.sign(
      { 
        role: "authority", 
        category: matchingCategory, 
        userId: "authority-" + matchingCategory // Shared ID for the team
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.json({ 
      token, 
      authority: { category: matchingCategory, name: matchingCategory + " Department" },
      message: "Authority access granted"
    });
  } catch (err) {
    console.error("Authority login error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/complaints", requireAuth, requireRole("authority"), async (req, res) => {
  try {
    // Authorities see complaints matching their category
    const complaints = await Complaint.find({ category: req.user.category })
      .populate("citizen", "name email phone")
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
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
