const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendWelcomeEmail, sendOTPEmail } = require("../utils/email");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { role: "citizen", userId: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: "Missing fields" });
    if (String(password).length < 6) return res.status(400).json({ message: "Password too short" });

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await User.create({ name: String(name).trim(), email: normalizedEmail, passwordHash });

    // Trigger Welcome Email (Async)
    sendWelcomeEmail(user.email, user.name).catch(console.error);

    return res.json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Missing fields" });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    return res.json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    return res.status(400).json({ message: "Bad Request", error: err.message });
  }
});

// FORGOT PASSWORD - Step 1: Send OTP
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: "User with this email not found" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send Email
    await sendOTPEmail(user.email, otp);

    return res.json({ message: "OTP sent to your email" });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// RESET PASSWORD - Step 2: Verify OTP and update password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ 
      email: String(email).toLowerCase().trim(),
      otp,
      otpExpires: { $gt: new Date() }
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired OTP" });

    if (String(newPassword).length < 6) return res.status(400).json({ message: "Password too short" });

    // Update password
    user.passwordHash = await bcrypt.hash(String(newPassword), 10);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return res.json({ message: "Password updated successfully. You can now login." });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
