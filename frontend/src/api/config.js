// Production API configuration
// Uses VITE_API_URL from environment, falls back to production Render URL
const rawUrl = import.meta.env.VITE_API_URL || "https://civiclink-9kis-2026.onrender.com";
// Ensure no trailing slash to avoid double-slash issues (e.g. //api/...)
export const API_BASE_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;