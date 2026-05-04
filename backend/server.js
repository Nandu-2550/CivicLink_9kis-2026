const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const dotenv = require("dotenv");
const { validateEnv } = require("./config/env");

dotenv.config();
validateEnv(); // Ensure all required keys exist before starting

const { connectDb } = require("./config/db");
const authRoutes = require("./routes/auth");
const complaintRoutes = require("./routes/complaints");
const authorityRoutes = require("./routes/authority");
const notificationRoutes = require("./routes/notifications");

const app = express();

app.use(helmet()); // Professional security headers
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

const uploadsDir = process.env.VERCEL 
  ? path.join("/tmp", process.env.UPLOAD_DIR || "uploads") 
  : path.join(process.cwd(), process.env.UPLOAD_DIR || "uploads");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (req, res) => res.json({ ok: true, name: "CivicLink" }));
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/authority", authorityRoutes);
app.use("/api/notifications", notificationRoutes);

// Automated Escalation Cron Job
const cron = require('node-cron');
const Complaint = require('./models/Complaint');

// Run every hour (0 * * * *)
cron.schedule('0 * * * *', async () => {
  console.log('[Cron] Checking for stale complaints...');
  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const staleComplaints = await Complaint.find({
      status: 'Pending',
      createdAt: { $lt: fortyEightHoursAgo }
    });

    if (staleComplaints.length === 0) {
      console.log('[Cron] No stale complaints found.');
      return;
    }

    console.log(`[Cron] Found ${staleComplaints.length} stale complaints to escalate.`);

    for (const complaint of staleComplaints) {
      await Complaint.findByIdAndUpdate(complaint._id, {
        escalationLevel: complaint.escalationLevel + 1,
        priority: 'CRITICAL',
        $push: {
          timeline: {
            stage: 'Escalated',
            note: `Auto-escalated due to staleness (Level ${complaint.escalationLevel + 1})`,
            at: new Date()
          }
        }
      });

      // Trigger escalation email (implement in email.js)
      const { sendEscalationEmail } = require('./utils/email');
      await sendEscalationEmail(complaint);
    }

    console.log('[Cron] Escalation process completed.');
  } catch (error) {
    console.error('[Cron] Escalation error:', error);
  }
});

console.log('[Cron] Escalation cron job scheduled (every hour).');

// Global Error Handler (Professional centralized logging)
app.use((err, req, res, next) => {
  console.error(`[GlobalError] ${req.method} ${req.url} >>`, err.message);
  if (err.stack) console.error(err.stack);
  res.status(err.status || 500).json({ 
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

// Connect to MongoDB
connectDb(process.env.MONGO_URI).catch((err) => console.error("Database connection failed:", err.message));

// Only run app.listen if NOT deployed on Vercel
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT || 5000);
  app.listen(port, () => console.log(`CivicLink API running on http://localhost:${port}`));
}

// Export the Express app for Vercel Serverless Functions
module.exports = app;
