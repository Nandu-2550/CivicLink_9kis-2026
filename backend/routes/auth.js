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
      return res.status(400).json({ message: "Name, Password, and at least one contact method (Email or Phone) are required" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const query = [];
    let cleanEmail = email ? email.toLowerCase().trim() : null;
    let cleanPhone = phone ? phone.replace(/\D/g, "") : null;

    if (cleanEmail) query.push({ email: cleanEmail });
    if (cleanPhone) {
      if (cleanPhone.length !== 10) {
        return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
      }
      query.push({ phone: cleanPhone });
    }

    const existing = await User.findOne({ $or: query });
    if (existing) {
      return res.status(409).json({ message: "An account already exists with this email or phone number" });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const userData = { 
      name: name.trim(), 
      passwordHash 
    };
    if (cleanEmail) userData.email = cleanEmail;
    if (cleanPhone) userData.phone = cleanPhone;

    const user = await User.create(userData);

    // Send Welcome Notification
    sendNotification(user, 'WELCOME').catch(err => console.error("[Auth] Welcome Notification Error:", err.message));

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
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
      return res.status(400).json({ message: "Identifier and password are required" });
    }

    const cleanId = identifier.trim();
    let user;

    if (cleanId.includes("@")) {
      // Treat as email
      user = await User.findOne({ email: cleanId.toLowerCase() });
    } else {
      // Treat as phone if it's 10 digits
      const phoneOnly = cleanId.replace(/\D/g, "");
      if (phoneOnly.length === 10) {
        user = await User.findOne({ phone: phoneOnly });
      } else {
        return res.status(400).json({ message: "Please enter a valid email or 10-digit phone number" });
      }
    }

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    return res.json({ 
      token: signToken(user), 
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone } 
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// FORGOT PASSWORD - Step 1: Send OTP (Unified)
router.post("/forgot-password", async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ message: "Email or Phone is required" });

    const cleanId = identifier.trim();
    let user;

    if (cleanId.includes("@")) {
      user = await User.findOne({ email: cleanId.toLowerCase() });
    } else {
      const phoneOnly = cleanId.replace(/\D/g, "");
      if (phoneOnly.length === 10) {
        user = await User.findOne({ phone: phoneOnly });
      }
    }

    if (!user) return res.status(404).json({ message: "No account found with that identifier" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send Notification (Dual delivery handled by service)
    await sendNotification(user, 'OTP', { otp });

    return res.json({ message: "Verification code sent successfully" });
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
    let query = { otp, otpExpires: { $gt: new Date() } };

    if (cleanId.includes("@")) {
      query.email = cleanId.toLowerCase();
    } else {
      const phoneOnly = cleanId.replace(/\D/g, "");
      if (phoneOnly.length === 10) {
        query.phone = phoneOnly;
      } else {
        return res.status(400).json({ message: "Invalid identifier" });
      }
    }

    const user = await User.findOne(query);
    if (!user) return res.status(400).json({ message: "Invalid or expired OTP" });

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
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
