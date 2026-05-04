const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();

const User = require("../models/User");
const Complaint = require("../models/Complaint");
const { sendStatusUpdateEmail } = require("../utils/email");

async function runDiagnostic() {
  console.log("=== CIVICLINK EMAIL DIAGNOSTIC START ===");
  
  // 1. Check Env Variables
  console.log("\n[1/4] Checking Environment Variables...");
  const vars = ["MONGO_URI", "EMAIL_USER", "EMAIL_PASS", "JWT_SECRET"];
  vars.forEach(v => {
    console.log(` - ${v}: ${process.env[v] ? "✅ PRESENT" : "❌ MISSING"}`);
  });

  if (!process.env.MONGO_URI) return console.error("Missing MONGO_URI");

  try {
    // 2. Database Connection
    console.log("\n[2/4] Connecting to Database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log(" ✅ Database Connected Successfully.");

    // 3. Finding a Test Complaint
    console.log("\n[3/4] Searching for a recent complaint to test...");
    const complaint = await Complaint.findOne().sort({ createdAt: -1 });
    
    if (!complaint) {
      console.log(" ❌ No complaints found in the database. Please file a complaint as a citizen first.");
      process.exit(0);
    }
    console.log(` ✅ Found Complaint: "${complaint.title}" (ID: ${complaint._id})`);
    console.log(`    Linked Citizen ID: ${complaint.citizen}`);

    const citizen = await User.findById(complaint.citizen);
    if (!citizen || !citizen.email) {
      console.log(" ❌ The citizen linked to this complaint has NO EMAIL address in the DB.");
      console.log("    Fix: Register a new citizen and file a fresh complaint.");
      process.exit(0);
    }
    console.log(` ✅ Found Citizen Email: ${citizen.email}`);

    // 4. Testing SMTP Dispatch
    console.log(`\n[4/4] Attempting to send a REAL test email to ${citizen.email}...`);
    const info = await sendStatusUpdateEmail(citizen.email, complaint, "Diagnostic Test");
    
    if (info) {
      console.log("\n🎉 SUCCESS! The email was sent to the mail server.");
      console.log("   Message ID:", info.messageId);
      console.log("\nIf you still don't see it:");
      console.log("1. Check the SPAM folder of " + citizen.email);
      console.log("2. Verify that " + citizen.email + " is a real, working email address.");
    } else {
      console.log("\n❌ FAILED. The email function returned null. Check your Gmail App Password.");
    }

  } catch (err) {
    console.error("\n❌ CRITICAL ERROR DURING DIAGNOSTIC:");
    console.error(err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runDiagnostic();
