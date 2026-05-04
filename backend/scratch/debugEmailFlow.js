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
  const vars = ["MONGO_URI", "EMAIL_USER", "EMAIL_PASS", "JWT_SECRET", "FRONTEND_URL"];
  vars.forEach(v => {
    const val = process.env[v];
    console.log(` - ${v}: ${val ? "✅ PRESENT" : "❌ MISSING"}`);
    if (v === "FRONTEND_URL" && !val) {
      console.warn("   ⚠️  Warning: FRONTEND_URL is missing. Emails will use fallback URL.");
    }
  });

  if (!process.env.MONGO_URI) return console.error("❌ Missing MONGO_URI. Diagnostic aborted.");

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
    } else {
      console.log(` ✅ Found Complaint: "${complaint.title}" (ID: ${complaint._id})`);
      
      const citizen = await User.findById(complaint.citizen);
      if (!citizen || !citizen.email) {
        console.log(" ❌ The citizen linked to this complaint has NO EMAIL address in the DB.");
      } else {
        console.log(` ✅ Found Citizen Email: ${citizen.email}`);

        // 4. Testing SMTP Dispatch
        console.log(`\n[4/4] Testing SMTP Connectivity & Dispatch to ${citizen.email}...`);
        
        // Use the utility to send
        const info = await sendStatusUpdateEmail(citizen.email, complaint, "Diagnostic Test");
        
        if (info) {
          console.log("\n🎉 SUCCESS! The email was sent to the mail server.");
          console.log("   Message ID:", info.messageId);
        } else {
          console.log("\n❌ FAILED. The email function returned null. Check the console logs above for the specific error.");
        }
      }
    }

  } catch (err) {
    console.error("\n❌ CRITICAL ERROR DURING DIAGNOSTIC:");
    console.error(err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    console.log("\n=== DIAGNOSTIC COMPLETE ===");
    await mongoose.disconnect();
    process.exit(0);
  }
}

runDiagnostic();
