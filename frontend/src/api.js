import { API_BASE_URL } from './api/config';

const EFFECTIVE_BASE = API_BASE_URL;

async function apiFetch(path, { token, method, body, isForm } = {}) {
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${EFFECTIVE_BASE}${path}`, {
      method: method || (body ? "POST" : "GET"),
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Create a more descriptive error from the server response
      const error = new Error(data?.message || `Request failed with status ${res.status}`);
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return data;
  } catch (err) {
    // If it's already an error with a message from the server, rethrow it
    if (err.message && err.status) throw err;
    // Otherwise, it might be a network error
    throw new Error(err.message || "Network error. Please check your connection.");
  }
}

export const api = {
  register: (payload) => apiFetch("/api/auth/register", { body: payload }),
  login: (payload) => apiFetch("/api/auth/login", { body: payload }),
  authorityLogin: (payload) => apiFetch("/api/authority/login", { body: payload }),
  fileComplaint: ({ token, title, description, location, file }) => {
    const form = new FormData();
    form.append("title", title);
    form.append("description", description);
    if (location) form.append("location", JSON.stringify(location));
    if (file) form.append("file", file);
    return apiFetch("/api/complaints", { token, method: "POST", body: form, isForm: true });
  },
  myComplaints: (token) => apiFetch("/api/complaints/mine", { token }),
  authorityComplaints: (token) => apiFetch("/api/authority/complaints", { token }),
  // Status update for authorities (Unifies all status/stage updates)
  updateStatus: (token, id, status, note, file) => {
    const form = new FormData();
    form.append("status", status);
    if (note) form.append("note", note);
    if (file) form.append("resolutionProof", file);
    return apiFetch(`/api/complaints/${id}/status`, { token, method: "PUT", body: form, isForm: true });
  },
  // Get single complaint details
  getComplaint: (token, id) => apiFetch(`/api/complaints/${id}`, { token })
};
