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
  const { category, deptCode, secretCode, email, password } = req.body || {};
  const code = deptCode || secretCode;

  console.log(`[AuthorityLogin] Attempt for ${category} by ${email}`);

  if (!email || !password) return res.status(400).json({ message: "Error: Email and Password are required" });
  if (!category) return res.status(400).json({ message: "Error: Category is required" });
  if (!code) return res.status(400).json({ message: "Error: Department Secret Code is required" });

  try {
    // 1. Verify User Credentials
    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: "Authentication Failed: User not found" });

    const isMatch = await bcrypt.compare(String(password), user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: "Authentication Failed: Incorrect password" });

    // 2. Verify Department Category
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ message: "Error: Invalid department category" });
    }

    // 3. Verify Department Secret Code
    const codes = parseCodes();
    const expected = codes[category];

    if (!expected) {
      return res.status(401).json({ message: "Error: No secret code configured for this department" });
    }

    if (String(code) !== String(expected)) {
      return res.status(401).json({ message: "Authentication Failed: Incorrect Department Secret Code" });
    }

    // 4. Issue Authority Token
    const token = jwt.sign(
      { role: "authority", category, userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.json({ 
      token, 
      authority: { category, name: user.name },
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
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
