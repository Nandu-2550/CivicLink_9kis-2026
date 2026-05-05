const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendNotification } = require("../utils/notificationService");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { 
      role: "citizen", 
      userId: user._id.toString(), 
      email: user.email || "", 
      phone: user.phone || "" 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// REGISTER - Unified (Email or Phone)
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body || {};
    if (!name || (!email && !phone) || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password too short" });
    }

    const query = [];
    if (email) query.push({ email: email.toLowerCase().trim() });
    if (phone) query.push({ phone: phone.trim() });

    const existing = await User.findOne({ $or: query });
    if (existing) {
      return res.status(409).json({ message: "Account already exists with this email or phone" });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const userData = { 
      name: name.trim(), 
      passwordHash 
    };
    if (email) userData.email = email.toLowerCase().trim();
    if (phone) userData.phone = phone.trim();

    const user = await User.create(userData);

    // Send Welcome Notification
    sendNotification(user, 'WELCOME').catch(console.error);

    return res.json({ 
      token: signToken(user), 
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone } 
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// LOGIN - Unified (Email or Phone)
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body || {}; // identifier can be email or phone
    if (!identifier || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const cleanId = identifier.trim();
    const user = await User.findOne({ 
      $or: [
        { email: cleanId.toLowerCase() },
        { phone: cleanId }
      ]
    });

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    return res.json({ 
      token: signToken(user), 
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone } 
    });
  } catch (err) {
    return res.status(400).json({ message: "Bad Request", error: err.message });
  }
});

// FORGOT PASSWORD - Step 1: Send OTP (Unified)
router.post("/forgot-password", async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ message: "Email or Phone is required" });

    const cleanId = identifier.trim();
    const user = await User.findOne({ 
      $or: [
        { email: cleanId.toLowerCase() },
        { phone: cleanId }
      ]
    });

    if (!user) return res.status(404).json({ message: "Account not found" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send Notification (Will detect if email or phone is present)
    await sendNotification(user, 'OTP', { otp });

    return res.json({ message: `OTP sent to your ${user.phone && cleanId === user.phone ? 'phone' : 'email'}` });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// RESET PASSWORD - Step 2: Verify OTP
router.post("/reset-password", async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const cleanId = identifier.trim();
    const user = await User.findOne({ 
      $or: [
        { email: cleanId.toLowerCase() },
        { phone: cleanId }
      ],
      otp,
      otpExpires: { $gt: new Date() }
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired OTP" });

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "Password too short" });
    }

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
