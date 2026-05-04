
// Local API configuration
// Uses VITE_API_URL from environment, falls back to localhost for local development
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";