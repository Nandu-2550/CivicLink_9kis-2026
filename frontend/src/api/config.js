
// Production API configuration
// Uses VITE_API_URL from environment, falls back to production Render URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || "https://civiclink-9kis-2026.onrender.com";