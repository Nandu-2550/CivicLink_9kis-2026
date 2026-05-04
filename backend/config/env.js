/**
 * Environment Variable Validator
 * Ensures the application has all required configurations before starting.
 */
function validateEnv() {
  const REQUIRED = [
    "MONGO_URI",
    "JWT_SECRET",
    "EMAIL_USER",
    "EMAIL_PASS",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "AUTHORITY_CODES_JSON"
  ];

  const missing = [];
  for (const key of REQUIRED) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error("FATAL ERROR: Missing required environment variables:");
    for (const m of missing) {
      console.error(` - ${m}`);
    }
    console.error("\nPlease check your .env file (local) or Render Dashboard (production).");
    process.exit(1); // Exit with failure
  }

  console.log("[EnvGuard] All required environment variables are present.");
}

module.exports = { validateEnv };
