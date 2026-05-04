const jwt = require("jsonwebtoken");
require("dotenv").config();

// Use the secret from .env or a fallback
const secret = process.env.JWT_SECRET || "change_me_super_secret";

// 1. Generate an Authority Token (e.g., for Police)
const authorityToken = jwt.sign(
  { role: "authority", category: "Police" },
  secret,
  { expiresIn: "7d" }
);

// 2. Generate a Citizen Token (Mocking a User ID)
const citizenToken = jwt.sign(
  { role: "citizen", userId: "65f1a2b3c4d5e6f7a8b9c0d1", email: "test@example.com" },
  secret,
  { expiresIn: "7d" }
);

console.log("--- AUTHORITY TOKEN (Police) ---");
console.log(authorityToken);
console.log("\n--- CITIZEN TOKEN ---");
console.log(citizenToken);
console.log("\n--- VERIFICATION ---");
console.log("Using Secret:", secret);
console.log("Generated tokens are valid for 7 days.");
