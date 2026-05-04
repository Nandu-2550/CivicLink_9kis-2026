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
app.use(express.json({ limit: "1mb" }));
app.use(helmet()); // Professional security headers
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://civic-link-9kis-2026.vercel.app", 
  "https://civic-link-9kis-2026-peeh.vercel.app",
  "https://civic-link-9kis-2026-1j2y-o5jg8pn96.vercel.app",
  "http://localhost:5173", 
  "http://localhost:3000"
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Check if origin is in whitelist or is a Vercel preview deployment
    const isAllowed = allowedOrigins.includes(origin);
    const isVercelPreview = origin.startsWith("https://civic-link-9kis-2026");
    
    if (isAllowed || isVercelPreview || allowedOrigins.includes("*")) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  credentials: true,
  maxAge: 86400 // Cache preflight response for 24 hours
}));

// Handle preflight requests for all routes
app.options('*', cors());
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
