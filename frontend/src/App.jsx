import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";
import { API_BASE_URL } from './api/config';
import { 
  Zap, 
  Eye, 
  Shield, 
  TrendingUp, 
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

const CATEGORIES = [
  "Police",
  "School/University",
  "Municipality",
  "Consumer/Cyber",
  "Human Rights",
  "Govt Dept",
  "Traffic",
  "Pollution"
];

const STAGES = ["Submitted", "In Review", "Assigned", "In Progress", "Resolved"];

// New status stepper for multi-step complaint progress
const STATUS_STEPS = ["Pending", "Under Review", "In Progress", "Resolved"];

function StatusStepper({ currentStatus }) {
  const statusPercentages = {
    "Pending": 20,
    "Under Review": 40,
    "In Progress": 70,
    "Resolved": 100
  };
  
  const activeIdx = Math.max(0, STATUS_STEPS.indexOf(currentStatus));
  const progressPercent = statusPercentages[currentStatus] || 20;
  
  const getStatusColor = (step, idx) => {
    if (idx <= activeIdx) {
      if (step === "Resolved") return "bg-emerald-400/15 border-emerald-300/30 text-emerald-100";
      if (step === "In Progress") return "bg-orange-400/15 border-orange-300/30 text-orange-100";
      return "bg-cyan-400/15 border-cyan-300/30 text-cyan-100";
    }
    return "bg-white/5 border-white/10 text-slate-300";
  };
  
  return (
    <div className="mt-3">
      {/* Progress Bar */}
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-3">
        <div 
          className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      
      {/* Step Indicators */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_STEPS.map((s, idx) => {
          const done = idx <= activeIdx;
          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className={[
                  "h-8 w-8 rounded-full grid place-items-center text-xs border",
                  getStatusColor(s, idx)
                ].join(" ")}
                title={s}
              >
                {idx + 1}
              </div>
              {idx !== STATUS_STEPS.length - 1 && (
                <div className={done ? "h-px w-8 bg-cyan-300/30" : "h-px w-8 bg-white/10"} />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-xs text-slate-400">
        Status: <span className="text-slate-100">{currentStatus || "Pending"}</span>
        <span className="ml-2 text-cyan-300">({progressPercent}%)</span>
      </div>
    </div>
  );
}

// Generic image panel component
function ImagePanel({ title, imageUrl, altText }) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!imageUrl) return null;

  const isAbsoluteUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');
  const finalUrl = isAbsoluteUrl ? imageUrl : `${API_BASE_URL}${imageUrl}`;
  
  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-100">{title}</div>
        <button 
          className="btn text-xs" 
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "Hide Photo" : "View Photo"}
        </button>
      </div>
      {isOpen && (
        <div className="mt-3 animate-fade-in">
          <img 
            src={finalUrl} 
            alt={altText || title} 
            className="w-full max-w-full h-auto rounded-xl border border-white/10 object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      )}
    </div>
  );
}

function CameraModal({ open, onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | starting | ready | denied | error
  const [err, setErr] = useState("");

  async function stop() {
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop();
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  async function start() {
    setErr("");
    setStatus("starting");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("error");
        setErr("Camera not supported in this browser.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("ready");
    } catch (e) {
      const msg = String(e?.message || e || "");
      const denied =
        e?.name === "NotAllowedError" ||
        e?.name === "PermissionDeniedError" ||
        msg.toLowerCase().includes("permission") ||
        msg.toLowerCase().includes("denied");
      setStatus(denied ? "denied" : "error");
      setErr(denied ? "Camera permission denied. Allow camera access and try again." : "Failed to start camera.");
      await stop();
    }
  }

  async function snap() {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const w = v.videoWidth || 1280;
    const h = v.videoHeight || 720;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) return;
    const file = new File([blob], `civiclink-photo-${Date.now()}.jpg`, { type: "image/jpeg" });
    onCapture(file);
    await stop();
    onClose();
  }

  useEffect(() => {
    if (!open) return;
    start();
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="glass w-full max-w-2xl rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Take picture</div>
            <div className="text-xs text-slate-400">We’ll ask for camera permission in your browser.</div>
          </div>
          <button className="btn" type="button" onClick={async () => { await stop(); onClose(); }}>
            Close
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
          <video ref={videoRef} className="w-full h-[360px] object-cover" playsInline muted />
        </div>

        {err ? <div className="mt-3 text-sm text-amber-200">{err}</div> : null}

        <div className="mt-4 flex flex-wrap gap-3 justify-end">
          <button className="btn" type="button" onClick={start} disabled={status === "starting"}>
            Retry
          </button>
          <button className="btn btn-primary" type="button" onClick={snap} disabled={status !== "ready"}>
            Capture photo
          </button>
        </div>
      </div>
    </div>
  );
}



function TopBar({ mode, setMode, who, onLogout }) {
  // Only show TopBar when user is logged in
  if (!who) return null;
  
  return (
    <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/50 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="CivicLink Logo" 
            className="h-11 w-11 object-contain animate-logo-pulse drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]" 
          />
          <div>
            <div className="text-xl font-black leading-tight gradient-text tracking-tighter">CivicLink</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-xs text-slate-200 glass rounded-xl px-3 py-2">{who}</div>
          <button className="btn" onClick={onLogout} type="button">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

function CitizenAuth({ onAuthed }) {
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const data =
        tab === "login"
          ? await api.login({ email: form.email, password: form.password })
          : await api.register({ name: form.name, email: form.email, password: form.password });
      onAuthed({ token: data.token, user: data.user });
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card rounded-2xl p-8 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold gradient-text mb-2">
          {tab === "login" ? "Welcome back, Citizen" : "Join CivicLink"}
        </h2>
        <p className="text-white/70 text-sm">
          {tab === "login" 
            ? "Sign in to track and manage your complaints" 
            : "Create your account to start making a difference"}
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6 p-1 rounded-xl bg-white/5">
        <button 
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-300 ${
            tab === "login" 
              ? "bg-gradient-to-r from-[#b0c4de]/20 to-[#d8bfd8]/20 text-white shadow-lg" 
              : "text-white/50 hover:text-white/70"
          }`}
          onClick={() => setTab("login")} 
          type="button"
        >
          Login
        </button>
        <button 
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-300 ${
            tab === "signup" 
              ? "bg-gradient-to-r from-[#b0c4de]/20 to-[#d8bfd8]/20 text-white shadow-lg" 
              : "text-white/50 hover:text-white/70"
          }`}
          onClick={() => setTab("signup")} 
          type="button"
        >
          Sign Up
        </button>
      </div>

      {/* Form */}
      <form className="space-y-4" onSubmit={submit}>
        {tab === "signup" && (
          <div className="animate-fade-in">
            <label className="text-xs text-white/50 mb-2 block">Full Name</label>
            <input 
              className="input" 
              placeholder="Enter your full name"
              value={form.name} 
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} 
            />
          </div>
        )}
        
        <div>
          <label className="text-xs text-white/50 mb-2 block">Email Address</label>
          <input 
            className="input" 
            type="email"
            placeholder="your.email@example.com"
            value={form.email} 
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} 
          />
        </div>
        
        <div>
          <label className="text-xs text-white/50 mb-2 block">Password</label>
          <input 
            className="input" 
            type="password"
            placeholder="Minimum 6 characters"
            value={form.password} 
            onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} 
          />
        </div>

        {err && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3 animate-fade-in">
            {err}
          </div>
        )}
        
        <button 
          className="btn btn-primary w-full mt-6 glow-effect" 
          disabled={loading} 
          type="submit"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : (
            tab === "login" ? "Sign In" : "Create Account"
          )}
        </button>
      </form>

      {/* Footer Note */}
      <div className="mt-6 text-center text-xs text-white/40">
        <p>Secure authentication powered by JWT</p>
      </div>
    </div>
  );
}

function CitizenApp({ token, user }) {
  const [gps, setGps] = useState({ lat: null, lng: null, accuracyM: null, updatedAt: null, status: "idle" });
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ title: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [gpsErrorHint, setGpsErrorHint] = useState("");
  const cameraInputRef = useRef(null);
  const gpsWatchIdRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState({});
  const [authFile, setAuthFile] = useState({}); // mapped by complaint id

  const predicted = useMemo(() => {
    const d = (form.description || "").toLowerCase();
    if (!d.trim()) return "Auto";
    if (d.includes("traffic") || d.includes("signal") || d.includes("parking")) return "Traffic";
    if (d.includes("fraud") || d.includes("scam") || d.includes("otp") || d.includes("cyber")) return "Consumer/Cyber";
    if (d.includes("garbage") || d.includes("pothole") || d.includes("sewage")) return "Municipality";
    if (d.includes("pollution") || d.includes("smoke") || d.includes("noise")) return "Pollution";
    if (d.includes("school") || d.includes("college") || d.includes("university")) return "School/University";
    if (d.includes("rights") || d.includes("discrimination")) return "Human Rights";
    if (d.includes("theft") || d.includes("assault") || d.includes("police")) return "Police";
    if (d.includes("pension") || d.includes("ration") || d.includes("aadhar") || d.includes("corruption")) return "Govt Dept";
    return "Auto";
  }, [form.description]);

  async function loadMine() {
    const data = await api.myComplaints(token);
    setComplaints(data.complaints || []);
  }

  useEffect(() => {
    loadMine().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopWatchingLocation() {
    if (gpsWatchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      gpsWatchIdRef.current = null;
    }
  }

  function startWatchingLocation() {
    setGpsErrorHint("");
    setGps((s) => ({ ...s, status: "detecting" }));
    if (!navigator.geolocation) return setGps({ lat: null, lng: null, accuracyM: null, updatedAt: null, status: "unsupported" });

    // Use watchPosition to get the freshest/highest-accuracy fix available.
    // Many devices return a coarse cached fix first, then refine after a few seconds.
    stopWatchingLocation();
    gpsWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: pos.coords.accuracy ?? null,
          updatedAt: Date.now(),
          status: "ok"
        });
      },
      (e) => {
        const denied = e && (e.code === 1 || String(e.message || "").toLowerCase().includes("permission"));
        setGps({ lat: null, lng: null, accuracyM: null, updatedAt: null, status: denied ? "denied" : "error" });
        setGpsErrorHint(
          denied
            ? "Location permission is blocked. Allow location for this site/browser and try again."
            : "Unable to read a precise location. If you’re on desktop, enable Windows Location and use a Wi‑Fi network/GPS-enabled device."
        );
        stopWatchingLocation();
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }

  useEffect(() => {
    // Auto-detect the complaint system's current location on load
    startWatchingLocation();
    return () => stopWatchingLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitComplaint(e) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    setMsg("");
    try {
      const locationObj = { lat: gps.lat, lng: gps.lng, formattedAddress: gps.formattedAddress || "" };
      await api.fileComplaint({ token, title: form.title, description: form.description, location: locationObj, file });
      setMsg("Complaint filed successfully.");
      setForm({ title: "", description: "" });
      setFile(null);
      await loadMine();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(complaintId, newStatus) {
    setStatusUpdating((prev) => ({ ...prev, [complaintId]: true }));
    // Optimistic UI update for instant feedback before email dispatch
    setComplaints((prev) =>
      prev.map((c) =>
        c._id === complaintId ? { ...c, status: newStatus } : c
      )
    );
    try {
      const fileToUpload = authFile[complaintId] || null;
      const note = noteDraft[complaintId] || "";
      await api.updateStatus(token, complaintId, newStatus, note, fileToUpload);
      setMsg(`Status updated to ${newStatus}`);
      setAuthFile((prev) => ({ ...prev, [complaintId]: null }));
      setNoteDraft((prev) => ({ ...prev, [complaintId]: "" }));
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [complaintId]: false }));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <CameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(f) => setFile(f)}
      />
      <div className="glass rounded-2xl p-6 lg:col-span-2">
        <div className="text-xl font-semibold">File Complaint</div>

        <form className="mt-5 space-y-3" onSubmit={submitComplaint}>
          <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
          <textarea className="input min-h-[120px]" placeholder="Description (used for AI keyword routing)" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
          <div className="flex items-center justify-between gap-3 text-sm text-slate-300">
            <div>
              Predicted: <span className="text-slate-100">{predicted}</span>
            </div>
            <button className="btn" onClick={startWatchingLocation} type="button">
              Select location
            </button>
          </div>
          <div className="text-xs text-slate-400">
            GPS:{" "}
            {gps.status === "ok"
              ? `${gps.lat?.toFixed(6)}, ${gps.lng?.toFixed(6)}`
              : gps.status === "detecting"
                ? "Detecting..."
                : gps.status === "denied"
                  ? "Permission denied"
                  : gps.status === "error"
                    ? "Error"
                  : gps.status === "unsupported"
                    ? "Not supported"
                    : "Not set"}
          </div>
          {gps.status === "ok" ? (
            <div className="text-xs text-slate-500">
              Accuracy: {gps.accuracyM ? `${Math.round(gps.accuracyM)}m` : "n/a"} • Updated{" "}
              {gps.updatedAt ? new Date(gps.updatedAt).toLocaleTimeString() : ""}
            </div>
          ) : null}
          {gpsErrorHint ? <div className="text-xs text-amber-200">{gpsErrorHint}</div> : null}

          <div className="text-xs text-slate-300">Upload media</div>
          <div className="flex items-center gap-3">
            <label className="btn btn-primary cursor-pointer select-none">
              Choose file
              <input
                className="hidden"
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>

            <button
              className="btn btn-primary"
              type="button"
              onClick={() => setCameraOpen(true)}
            >
              Take picture
            </button>
            <input
              ref={cameraInputRef}
              className="hidden"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            <button className="btn" type="button" onClick={() => setFile(null)} disabled={!file}>
              Clear
            </button>
          </div>
          <div className="text-xs text-slate-400">{file?.name ? file.name : "No file chosen"}</div>
          {err && <div className="text-sm text-red-300">{err}</div>}
          {msg && <div className="text-sm text-emerald-200">{msg}</div>}
          <button className="btn btn-primary w-full" disabled={loading} type="submit">
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>

      <div className="glass rounded-2xl p-6 lg:col-span-3">
        <div className="flex items-end justify-between gap-3 mb-6">
          <div>
            <div className="text-xl font-semibold">My Complaints</div>
            <div className="text-sm text-slate-400">Track and manage your submissions</div>
          </div>
          <button className="btn" onClick={() => loadMine().catch(() => {})} type="button">
            Refresh
          </button>
        </div>

        {/* Statistics Cards */}
        {complaints.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="stat-card text-center">
              <div className="text-3xl font-bold text-[#b0c4de] mb-1">{complaints.length}</div>
              <div className="text-xs text-white/50">Total</div>
            </div>
            <div className="stat-card text-center">
              <div className="text-3xl font-bold text-orange-400 mb-1">
                {complaints.filter(c => c.status === "Pending" || c.status === "Under Review" || c.status === "In Progress").length}
              </div>
              <div className="text-xs text-white/50">Pending</div>
            </div>
            <div className="stat-card text-center">
              <div className="text-3xl font-bold text-emerald-400 mb-1">
                {complaints.filter(c => c.status === "Resolved").length}
              </div>
              <div className="text-xs text-white/50">Resolved</div>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {complaints.length === 0 ? (
            <div className="text-sm text-slate-400">No pending issues</div>
          ) : (
            complaints.map((c) => (
              <div key={c._id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold">{c.title}</div>
                  <div className="text-xs rounded-full border border-white/10 bg-white/5 px-3 py-1">{c.category || "General/Uncategorized"}</div>
                </div>
                <div className="mt-2 text-sm text-slate-300">{c.description}</div>
                {c.location?.formattedAddress || (c.location?.lat != null && c.location?.lng != null) ? (
                  <div className="mt-2 text-xs text-slate-400">
                    Location: {c.location?.formattedAddress ? (
                      c.location.formattedAddress
                    ) : (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${c.location.lat},${c.location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:underline"
                      >
                        {Number(c.location.lat).toFixed(6)}, {Number(c.location.lng).toFixed(6)}
                      </a>
                    )}
                  </div>
                ) : null}

                <ImagePanel
                  title="📎 Citizen Evidence Photo"
                  imageUrl={c.citizenImage || c.attachmentUrl}
                  altText="Citizen evidence"
                />
                <ImagePanel
                  title="✅ Authority Resolution Proof"
                  imageUrl={c.authorityImage || c.resolutionProof}
                  altText="Authority resolution proof"
                />

                <StatusStepper currentStatus={c.status} />

                {/* Activity History for Citizen */}
                {c.statusHistory && c.statusHistory.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-white/5 animate-reveal">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-3 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Activity Log
                    </div>
                    <div className="space-y-4">
                      {c.statusHistory.slice().reverse().map((h, i) => (
                        <div key={i} className="flex gap-4 group">
                          <div className="relative flex flex-col items-center shrink-0">
                            <div className="w-2 h-2 rounded-full bg-slate-700 group-hover:bg-blue-400 transition-colors" />
                            {i !== c.statusHistory.length - 1 && <div className="w-[1px] h-full bg-slate-800" />}
                          </div>
                          <div className="pb-2">
                            <div className="text-xs font-semibold text-slate-200">{h.step}</div>
                            {h.note && <div className="text-xs text-slate-400 mt-1 italic">"{h.note}"</div>}
                            <div className="text-[10px] text-slate-500 mt-1 font-mono">
                              {new Date(h.date || h.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Authority-only Status Update Panel */}
                {user?.role === 'authority' && (
                  <div className="mt-4 p-4 rounded-xl border border-cyan-500/30 bg-cyan-400/5">
                    <div className="text-sm font-semibold text-cyan-100 mb-3">Authority Status Controls</div>
                    <div className="mb-3">
                      <label className="text-xs text-slate-300 block mb-1">Resolution Proof (Optional)</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-cyan-500/20 file:text-cyan-200 cursor-pointer"
                        onChange={(e) => setAuthFile(prev => ({ ...prev, [c._id]: e.target.files?.[0] || null }))}
                      />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-4">
                      <button
                        className="btn text-xs"
                        disabled={c.status === "Under Review" || statusUpdating[c._id]}
                        onClick={() => handleStatusUpdate(c._id, "Under Review")}
                      >
                        {statusUpdating[c._id] ? "Updating..." : "Mark as Under Review"}
                      </button>
                      <button
                        className="btn text-xs"
                        disabled={c.status === "In Progress" || statusUpdating[c._id]}
                        onClick={() => handleStatusUpdate(c._id, "In Progress")}
                      >
                        {statusUpdating[c._id] ? "Updating..." : "Mark as In Progress"}
                      </button>
                      <button
                        className="btn btn-primary text-xs"
                        disabled={c.status === "Resolved" || statusUpdating[c._id]}
                        onClick={() => handleStatusUpdate(c._id, "Resolved")}
                      >
                        {statusUpdating[c._id] ? "Updating..." : "Mark as Resolved"}
                      </button>
                    </div>
                  </div>
                )}
                

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AuthorityAuth({ onAuthed }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ category: "Police", secretCode: "" });

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const data = await api.authorityLogin(form);
      onAuthed({ token: data.token, authority: data.authority });
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setLoading(false);
    }
  }

  const categoryIcons = {
    "Police": "🚔",
    "School/University": "🎓",
    "Municipality": "🏛️",
    "Consumer/Cyber": "🔒",
    "Human Rights": "⚖️",
    "Govt Dept": "📋",
    "Traffic": "🚦",
    "Pollution": "🌿"
  };

  return (
    <div className="glass-card rounded-2xl p-8 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold gradient-text mb-2">
          Authority Access Portal
        </h2>
        <p className="text-white/70 text-sm">
          Secure access for government officials
        </p>
      </div>
      
      <form className="space-y-5" onSubmit={submit}>
        {/* Category Selection */}
        <div>
          <label className="text-xs text-white/50 mb-3 block">Department Category</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => {
              const isSelected = form.category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((s) => ({ ...s, category: c }))}
                  className={`
                    flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-medium transition-all duration-300
                    ${isSelected 
                      ? 'bg-gradient-to-r from-[#b0c4de]/20 to-[#d8bfd8]/20 border-[#b0c4de]/40 text-white shadow-lg scale-105' 
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20 hover:text-white/80'
                    }
                  `}
                >
                  <span className="text-lg">{categoryIcons[c]}</span>
                  <span className="text-xs">{c}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Secret Code Input */}
        <div>
          <label className="text-xs text-white/50 mb-2 block">Secret Code</label>
          <input 
            className="input" 
            placeholder="Enter your authority secret code"
            type="password"
            value={form.secretCode} 
            onChange={(e) => setForm((s) => ({ ...s, secretCode: e.target.value }))} 
          />
        </div>

        {err && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3 animate-fade-in">
            {err}
          </div>
        )}
        
        <button 
          className="btn btn-primary w-full glow-effect" 
          disabled={loading} 
          type="submit"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Authenticating...
            </span>
          ) : (
            "Access Dashboard"
          )}
        </button>
      </form>

      {/* Security Note */}
      <div className="mt-6 text-center text-xs text-white/40">
        <p>🔒 Authorized personnel only • All access is logged</p>
      </div>
    </div>
  );
}

function AuthorityApp({ token, authority }) {
  const [complaints, setComplaints] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [stageDraft, setStageDraft] = useState({});
  const [noteDraft, setNoteDraft] = useState({});
  const [statusDraft, setStatusDraft] = useState({});
  const [proofFile, setProofFile] = useState({});
  const [showResolutionProofUploadForId, setShowResolutionProofUploadForId] = useState(null); // New state to control visibility of proof upload section
  const [statusUpdating, setStatusUpdating] = useState({});
  const [proofUpdated, setProofUpdated] = useState({});

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const data = await api.authorityComplaints(token);
      setComplaints(data.complaints || []);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function update(id) {
    const note = noteDraft[id] || "";
    const status = statusDraft[id] || "Pending";
    const file = proofFile[id] || null;
    await api.updateStatus(token, id, status, note, file);
    setProofFile((s) => ({ ...s, [id]: null }));
    setNoteDraft((s) => ({ ...s, [id]: "" }));
    await load();
  }

  async function updateStatus(id) {
    const file = proofFile[id];
    await api.updateStatus(token, id, statusDraft[id] || "Pending", noteDraft[id] || "", file);
    setProofFile((s) => ({ ...s, [id]: null }));
    await load();
  }

  async function quickStatusUpdate(id, newStatus) {
    setStatusUpdating((prev) => ({ ...prev, [id]: true }));
    // Optimistic UI update
    setComplaints((prev) =>
      prev.map((c) =>
        c._id === id ? { ...c, status: newStatus } : c
      )
    );
    try {
      const file = proofFile[id] || null;
      const note = noteDraft[id] || `Status changed to ${newStatus} by authority.`;
      await api.updateStatus(token, id, newStatus, note, file);
      setProofFile((s) => ({ ...s, [id]: null }));
      setNoteDraft((s) => ({ ...s, [id]: "" }));
      
      setShowResolutionProofUploadForId(null);
      if (file) {
        setProofUpdated((s) => ({ ...s, [id]: true }));
        setTimeout(() => setProofUpdated((s) => ({ ...s, [id]: false })), 3000);
      }
      // Refresh all data to sync history and new fields
      await load();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [id]: false }));
    }
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xl font-semibold">Authority Dashboard</div>
          <div className="text-sm text-slate-400">
            Showing category: <span className="text-slate-100">{authority?.category}</span>
          </div>
        </div>
        <button className="btn" onClick={() => load()} type="button">
          Refresh
        </button>
      </div>

      {err && <div className="mt-4 text-sm text-red-300">{err}</div>}
      {loading ? (
        <div className="mt-6 text-sm text-slate-400">Loading...</div>
      ) : complaints.length === 0 ? (
        <div className="mt-6 text-sm text-slate-400">No pending issues</div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-3 gap-4 mt-6 mb-6">
            <div className="stat-card text-center">
              <div className="text-3xl font-bold text-[#b0c4de] mb-1">{complaints.length}</div>
              <div className="text-xs text-white/50">Total Received</div>
            </div>
            <div className="stat-card text-center">
              <div className="text-3xl font-bold text-orange-400 mb-1">
                {complaints.filter(c => c.status !== "Resolved").length}
              </div>
              <div className="text-xs text-white/50">Pending Action</div>
            </div>
            <div className="stat-card text-center">
              <div className="text-3xl font-bold text-emerald-400 mb-1">
                {complaints.filter(c => c.status === "Resolved").length}
              </div>
              <div className="text-xs text-white/50">Resolved</div>
            </div>
          </div>

          <div className="grid gap-4">
          {complaints.map((c) => (
            <div key={c._id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold">{c.title}</div>
                <div className="text-xs rounded-full border border-white/10 bg-white/5 px-3 py-1">{c.category || "General/Uncategorized"}</div>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Citizen: <span className="text-slate-100">{c.citizen?.name || "Unknown"}</span>
                <div className="text-slate-500">{c.citizen?.email || "no email"}</div>
              </div>
              <div className="mt-2 text-sm text-slate-300">{c.description}</div>
              {c.location?.formattedAddress || (c.location?.lat != null && c.location?.lng != null) ? (
                <div className="mt-2 text-xs text-slate-400">
                  Location: {c.location?.formattedAddress ? (
                    c.location.formattedAddress
                  ) : (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${c.location.lat},${c.location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline"
                    >
                      {Number(c.location.lat).toFixed(6)}, {Number(c.location.lng).toFixed(6)}
                    </a>
                  )}
                </div>
              ) : null}

              <ImagePanel
                title="📎 Citizen Evidence Photo"
                imageUrl={c.citizenImage || c.attachmentUrl}
                altText="Citizen evidence"
              />
              <ImagePanel
                title="✅ Authority Resolution Proof"
                imageUrl={c.authorityImage || c.resolutionProof}
                altText="Authority resolution proof"
              />

              <StatusStepper currentStatus={c.status} />

              {/* Authority Status Update Panel */}
              {c.status !== "Resolved" && ( // Only show controls if not already resolved
                <div className="mt-4 p-4 rounded-xl border border-cyan-500/30 bg-cyan-400/5 animate-fade-in">
                  <div className="text-sm font-semibold text-cyan-100 mb-3">Status Update</div>
                  
                  {/* Resolution proof upload - conditionally rendered */}
                  {showResolutionProofUploadForId === c._id ? (
                    <div className="mb-4 pb-4 border-b border-white/10 animate-fade-in">
                      <div className="text-xs text-slate-400 mb-2">📸 Resolution Proof (optional)</div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <label className="btn cursor-pointer select-none text-sm">
                          Choose Photo
                          <input
                            className="hidden"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setProofFile((s) => ({ ...s, [c._id]: e.target.files?.[0] || null }))}
                          />
                        </label>
                        <span className="text-xs text-slate-400">
                          {proofFile[c._id]?.name ? proofFile[c._id].name : "No file chosen"}
                        </span>
                        {proofFile[c._id] && (
                          <button 
                            className="btn text-xs" 
                            onClick={() => setProofFile((s) => ({ ...s, [c._id]: null }))}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          className="btn btn-primary text-xs flex-1"
                          disabled={statusUpdating[c._id]}
                          onClick={() => quickStatusUpdate(c._id, "Resolved")}
                        >
                          {statusUpdating[c._id] ? "Resolving..." : "Confirm Resolution"}
                        </button>
                        <button
                          className="btn text-xs flex-1"
                          onClick={() => {
                            setShowResolutionProofUploadForId(null);
                            setProofFile((s) => ({ ...s, [c._id]: null }));
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-3">
                      <button
                        className="btn text-xs"
                        disabled={c.status === "Under Review" || statusUpdating[c._id]}
                        onClick={() => quickStatusUpdate(c._id, "Under Review")}
                      >
                        {statusUpdating[c._id] ? "Updating..." : "Mark as Under Review"}
                      </button>
                      <button
                        className="btn text-xs"
                        disabled={c.status === "In Progress" || statusUpdating[c._id]}
                        onClick={() => quickStatusUpdate(c._id, "In Progress")}
                      >
                        {statusUpdating[c._id] ? "Updating..." : "Mark as In Progress"}
                      </button>
                      <button
                        className="btn btn-primary text-xs"
                        disabled={statusUpdating[c._id]}
                        onClick={() => setShowResolutionProofUploadForId(c._id)} // First click to show upload
                      >
                        Mark as Resolved
                      </button>
                    </div>
                  )}

                  {/* Authority Note Input */}
                  <div className="mt-4">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-2 font-bold">Progress Note</label>
                    <textarea 
                      className="input text-xs min-h-[60px]" 
                      placeholder="Add an internal or public note for this update..."
                      value={noteDraft[c._id] || ""}
                      onChange={(e) => setNoteDraft(prev => ({ ...prev, [c._id]: e.target.value }))}
                    />
                  </div>
                </div>
              )}
                
                {/* Activity History for Authority */}
                {c.statusHistory && c.statusHistory.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-3">Case History</div>
                    <div className="space-y-4">
                      {c.statusHistory.slice().reverse().map((h, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="shrink-0 pt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-300">{h.step}</div>
                            {h.note && <div className="text-xs text-slate-400 mt-1 italic">"{h.note}"</div>}
                            <div className="text-[10px] text-slate-500 mt-1">
                              {new Date(h.date || h.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Success message when proof is updated */}
                {proofUpdated[c._id] && (
                  <div className="mt-3 text-xs text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-2 text-center animate-pulse">
                    ✓ Proof updated successfully!
                  </div>
                )}
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("citizen");
  const [activeView, setActiveView] = useState("landing"); // 'landing', 'citizen_login', 'authority_login'
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [citizen, setCitizen] = useState(() => {
    const raw = localStorage.getItem("civiclink_citizen");
    return raw ? JSON.parse(raw) : null;
  });
  const [authority, setAuthority] = useState(() => {
    const raw = localStorage.getItem("civiclink_authority");
    return raw ? JSON.parse(raw) : null;
  });

  const who = citizen ? `Citizen: ${citizen.user?.name || "Citizen"}` : authority ? `Authority: ${authority.authority?.category}` : null;

  function logout() {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    setTimeout(() => {
      localStorage.removeItem("civiclink_citizen");
      localStorage.removeItem("civiclink_authority");
      setCitizen(null);
      setAuthority(null);
      setActiveView("landing");
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }, 300);
  }

  function handleModeSelect(selectedMode) {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setMode(selectedMode);
    
    // Wait for fade out animation, then switch view
    setTimeout(() => {
      setActiveView(selectedMode === "citizen" ? "citizen_login" : "authority_login");
      
      // Reset transition flag after animation completes
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }, 300);
  }

  function handleBackToLanding() {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    
    setTimeout(() => {
      setActiveView("landing");
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }, 300);
  }

  return (
    <div className="min-h-full bg-aurora relative">
      {/* Background Decorative Blobs */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>
      
      <TopBar mode={mode} setMode={setMode} who={who} onLogout={logout} />
      <div className="mx-auto max-w-6xl px-4 py-10 relative z-10">
        {!citizen && !authority ? (
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Hero Section - Always visible but adapts */}
            <div className={`text-center transition-all duration-700 animate-fade-in ${
              activeView !== "landing" ? "mb-8 opacity-60 scale-90" : "mb-12"
            }`}>
              <img 
                src="/logo.png" 
                alt="CivicLink" 
                className={`mx-auto mb-6 object-contain animate-logo-pulse transition-all duration-1000 ${
                  activeView !== "landing" ? "h-16" : "h-32"
                }`}
              />
              <h1 className={`font-bold mb-4 gradient-text transition-all duration-1000 animate-reveal ${
                activeView !== "landing" 
                  ? "text-4xl md:text-5xl" 
                  : "text-6xl md:text-8xl"
              }`}>
                CivicLink
              </h1>
              {activeView === "landing" && (
                <div className="animate-slide-up-in">
                  <p className="text-3xl md:text-4xl font-light text-white/90 mb-6 tracking-tight">
                    Your Voice, <span className="font-bold text-blue-400">Your City</span>
                  </p>
                  <p className="text-xl text-white/50 max-w-2xl mx-auto leading-relaxed stagger-2">
                    A next-generation platform for transparent community engagement. 
                    Report issues, track progress, and build a better future together.
                  </p>
                </div>
              )}
            </div>

            {/* Landing View - Cards and Features */}
            {activeView === "landing" && (
              <div className="animate-fade-in stagger-3">
                {/* Selection Cards */}
                <div className="grid md:grid-cols-2 gap-8 mb-20 max-w-5xl mx-auto">
                  {/* Citizen Box */}
                  <div 
                    className="glass-card rounded-3xl p-10 cursor-pointer group"
                    onClick={() => handleModeSelect("citizen")}
                  >
                    <div className="text-center">
                      <div className="text-8xl mb-8 animate-float">👤</div>
                      <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors">For Citizens</h3>
                      <p className="text-white/40 mb-10 leading-relaxed text-lg">
                        Raise complaints, upload evidence, and track reports in real-time with Institutional-grade transparency.
                      </p>
                      <button className="btn btn-primary w-full text-lg py-5 group-hover:scale-105 transition-transform">
                        Launch Dashboard
                      </button>
                    </div>
                  </div>

                  {/* Authority Box */}
                  <div 
                    className="glass-card rounded-3xl p-10 cursor-pointer group"
                    onClick={() => handleModeSelect("authority")}
                  >
                    <div className="text-center">
                      <div className="text-8xl mb-8 animate-float [animation-delay:0.5s]">🏛️</div>
                      <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors">For Authorities</h3>
                      <p className="text-white/40 mb-10 leading-relaxed text-lg">
                        Secure governance portal for managing civic issues with advanced analytics and resolution tracking.
                      </p>
                      <button className="btn btn-primary w-full text-lg py-5 group-hover:scale-105 transition-transform">
                        Access Portal
                      </button>
                    </div>
                  </div>
                </div>

                {/* Features Grid - Premium Design */}
                <div className="mt-32 max-w-7xl mx-auto mb-20">
                  <div className="text-center mb-16 animate-reveal">
                    <h2 className="text-4xl font-bold text-white mb-4">Precision Features</h2>
                    <p className="text-lg text-white/40 max-w-2xl mx-auto">
                      Engineered for efficiency, built for the community.
                    </p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Instant Reporting */}
                    <div className="glass-card rounded-2xl p-8 hover:-translate-y-3 transition-all duration-500">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                        <Zap className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">Rapid File</h3>
                      <p className="text-white/40 leading-relaxed text-sm">
                        Submit grievances in seconds with our optimized mobile-first edge submission.
                      </p>
                    </div>

                    {/* Live Tracking */}
                    <div className="glass-card rounded-2xl p-8 hover:-translate-y-3 transition-all duration-500 [animation-delay:0.1s]">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
                        <Eye className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">Live Ledger</h3>
                      <p className="text-white/40 leading-relaxed text-sm">
                        Immutable tracking of your complaint from submission to verified resolution.
                      </p>
                    </div>

                    {/* Secure & Private */}
                    <div className="glass-card rounded-2xl p-8 hover:-translate-y-3 transition-all duration-500 [animation-delay:0.2s]">
                      <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                        <Shield className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">Vault Security</h3>
                      <p className="text-white/40 leading-relaxed text-sm">
                        Your data is protected by institutional-grade encryption and privacy protocols.
                      </p>
                    </div>

                    {/* Data Insights */}
                    <div className="glass-card rounded-2xl p-8 hover:-translate-y-3 transition-all duration-500 [animation-delay:0.3s]">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20">
                        <TrendingUp className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">Civic Insights</h3>
                      <p className="text-white/40 leading-relaxed text-sm">
                        AI-powered analytics identifying recurring patterns to solve issues before they scale.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer - Professional Design */}
                <footer className="mt-24" style={{ background: '#050a18' }}>
                  <div className="max-w-7xl mx-auto px-4 py-16">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                      {/* Brand Column */}
                      <div className="lg:col-span-1">
                        <h3 className="text-2xl font-bold text-white mb-4 tracking-wider">CIVICLINK</h3>
                        <p className="text-slate-400 leading-relaxed mb-6">
                          Redefining the relationship between citizens and government through innovation and transparency.
                        </p>
                        <div className="flex gap-4">
                          <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all duration-300 text-white font-bold text-sm">
                            𝕏
                          </a>
                          <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all duration-300 text-white font-bold text-sm">
                            in
                          </a>
                          <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all duration-300 text-white font-bold text-sm">
                            f
                          </a>
                        </div>
                      </div>

                      {/* Quick Links */}
                      <div>
                        <h4 className="text-lg font-bold text-white mb-6">Quick Links</h4>
                        <ul className="space-y-3">
                          <li><a href="#" className="text-slate-400 hover:text-white transition-colors duration-200">About Us</a></li>
                          <li><a href="#" className="text-slate-400 hover:text-white transition-colors duration-200">Portals</a></li>
                          <li><a href="#" className="text-slate-400 hover:text-white transition-colors duration-200">Features</a></li>
                          <li><a href="#" className="text-slate-400 hover:text-white transition-colors duration-200">Privacy Policy</a></li>
                        </ul>
                      </div>

                      {/* Contact */}
                      <div>
                        <h4 className="text-lg font-bold text-white mb-6">Contact</h4>
                        <ul className="space-y-3">
                          <li><a href="#" className="text-slate-400 hover:text-white transition-colors duration-200">Support Center</a></li>
                          <li><a href="#" className="text-slate-400 hover:text-white transition-colors duration-200">Press Kit</a></li>
                          <li><a href="#" className="text-slate-400 hover:text-white transition-colors duration-200">Partnerships</a></li>
                          <li><a href="#" className="text-slate-400 hover:text-white transition-colors duration-200">Contact Support</a></li>
                        </ul>
                      </div>

                      {/* Get in Touch */}
                      <div>
                        <h4 className="text-lg font-bold text-white mb-6">Get in Touch</h4>
                        <ul className="space-y-4">
                          <li className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-400">support@civiclink.com</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <Phone className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-400">1-800-CIVIC-LINK</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-400">Government Plaza, City Center</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                      <p className="text-slate-500 text-sm">
                        © 2026 CivicLink. All rights reserved.
                      </p>
                      <p className="text-slate-500 text-sm">
                        Built for transparency and citizen empowerment.
                      </p>
                    </div>
                  </div>
                </footer>
              </div>
            )}

            {/* Citizen Login - Only show when selected */}
            {activeView === "citizen_login" && (
              <div className="animate-slide-up-in max-w-lg mx-auto">
                <div className="mb-6">
                  <button 
                    className="btn btn-ghost text-sm"
                    onClick={handleBackToLanding}
                    disabled={isTransitioning}
                  >
                    ← Back to options
                  </button>
                </div>
                
                <CitizenAuth
                  onAuthed={(data) => {
                    localStorage.setItem("civiclink_citizen", JSON.stringify(data));
                    setCitizen(data);
                  }}
                />
                
                <div className="mt-6 text-center">
                  <p className="text-xs text-white/40">
                    🔒 Secure authentication • Your data is protected
                  </p>
                </div>
              </div>
            )}

            {/* Authority Login - Only show when selected */}
            {activeView === "authority_login" && (
              <div className="animate-slide-up-in max-w-lg mx-auto">
                <div className="mb-6">
                  <button 
                    className="btn btn-ghost text-sm"
                    onClick={handleBackToLanding}
                    disabled={isTransitioning}
                  >
                    ← Back to options
                  </button>
                </div>
                
                <AuthorityAuth
                  onAuthed={(data) => {
                    localStorage.setItem("civiclink_authority", JSON.stringify(data));
                    setAuthority(data);
                  }}
                />
                
                <div className="mt-6 text-center">
                  <p className="text-xs text-white/40">
                    🔐 Authorized personnel only • All access is monitored
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : citizen ? (
          <CitizenApp token={citizen.token} />
        ) : (
          <AuthorityApp token={authority.token} authority={authority.authority} />
        )}
      </div>
    </div>
  );
}
