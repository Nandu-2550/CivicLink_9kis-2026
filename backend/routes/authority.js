const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
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
  console.log("[HandshakeAudit] Payload arriving on Render:", req.body);
  const { category, deptCode, email, password } = req.body || {};
  
  if (!email || !password) return res.status(400).json({ message: "Error: Email and Password are required" });
  if (!deptCode) return res.status(400).json({ message: "Error: Department Secret Code is required" });

  try {
    // 1. Verify User Credentials
    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: "Authentication Failed: User not found" });

    const isMatch = await bcrypt.compare(String(password), user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: "Authentication Failed: Incorrect password" });

    // 2. Verify Department Secret Code (Case-Insensitive)
    const codes = parseCodes();
    
    // Check if the provided code exists as a value in our configuration
    const normalizedInput = String(deptCode).toUpperCase().trim();
    
    // Find if any category has this code
    const matchingCategory = Object.keys(codes).find(key => 
      String(codes[key]).toUpperCase().trim() === normalizedInput
    );

    if (!matchingCategory) {
      return res.status(401).json({ message: "Authentication Failed: Invalid Department Secret Code" });
    }

    // Optional: If a category was provided in the frontend, we can verify it matches
    // but the instruction says to check if it exists as a value in the object.
    // We will trust the code's associated category.
    const effectiveCategory = matchingCategory;

    // 3. Issue Authority Token
    const token = jwt.sign(
      { role: "authority", category: effectiveCategory, userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.json({ 
      token, 
      authority: { category: effectiveCategory, name: user.name },
      message: "Authority authentication successful"
    });
  } catch (err) {
    console.error("Authority login error:", err);
    return res.status(500).json({ message: "Internal server error during authentication" });
  }
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
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
