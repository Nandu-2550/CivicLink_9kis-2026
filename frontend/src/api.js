import { API_BASE_URL } from './api/config';

const EFFECTIVE_BASE = API_BASE_URL;

async function apiFetch(path, { token, method, body, isForm } = {}) {
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${EFFECTIVE_BASE}${path}`, {
    method: method || (body ? "POST" : "GET"),
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
}

export const api = {
  register: (payload) => apiFetch("/api/auth/register", { body: payload }),
  login: (payload) => apiFetch("/api/auth/login", { body: payload }),
  authorityLogin: (payload) => apiFetch("/api/authority/login", { body: payload }),
  fileComplaint: ({ token, title, description, lat, lng, file }) => {
    const form = new FormData();
    form.append("title", title);
    form.append("description", description);
    if (lat !== null && lat !== undefined) form.append("lat", String(lat));
    if (lng !== null && lng !== undefined) form.append("lng", String(lng));
    if (file) form.append("file", file);
    return apiFetch("/api/complaints", { token, method: "POST", body: form, isForm: true });
  },
  myComplaints: (token) => apiFetch("/api/complaints/mine", { token }),
  authorityComplaints: (token) => apiFetch("/api/authority/complaints", { token }),
  updateStage: (token, id, stage, note) =>
    apiFetch(`/api/authority/complaints/${id}/stage`, { token, method: "PATCH", body: { stage, note } }),
  // Status update for authorities
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
