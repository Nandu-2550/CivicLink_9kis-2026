import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";
import { API_BASE_URL } from './api/config';

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

// Resolution proof display component
function ResolutionProof({ proofUrl }) {
  if (!proofUrl) return null;
  
  return (
    <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-400/5 p-4">
      <div className="text-sm font-semibold text-emerald-100 mb-2">Authority Resolution Proof</div>
      <img 
        src={proofUrl} 
        alt="Resolution proof" 
        className="max-h-48 rounded-lg border border-white/10"
      />
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
          <div className="h-10 w-10 rounded-2xl bg-cyan-400/15 border border-cyan-300/20 grid place-items-center font-semibold">
            CL
          </div>
          <div>
            <div className="text-lg font-semibold leading-tight">CivicLink</div>
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
      await api.fileComplaint({ token, title: form.title, description: form.description, lat: gps.lat, lng: gps.lng, file });
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
    try {
      await api.updateStatus(token, complaintId, newStatus, "");
      // Update local state immediately for instant UI feedback
      setComplaints((prev) =>
        prev.map((c) =>
          c._id === complaintId ? { ...c, status: newStatus } : c
        )
      );
      setMsg(`Status updated to ${newStatus}`);
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
            <div className="text-sm text-slate-400">No complaints yet.</div>
          ) : (
            complaints.map((c) => (
              <div key={c._id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold">{c.title}</div>
                  <div className="text-xs rounded-full border border-white/10 bg-white/5 px-3 py-1">{c.category}</div>
                </div>
                <div className="mt-2 text-sm text-slate-300">{c.description}</div>
                <StatusStepper currentStatus={c.status} />
                
                {/* Authority-only Status Update Panel */}
                {user?.role === 'authority' && (
                  <div className="mt-4 p-4 rounded-xl border border-cyan-500/30 bg-cyan-400/5">
                    <div className="text-sm font-semibold text-cyan-100 mb-3">Authority Status Controls</div>
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
                
                <ResolutionProof proofUrl={c.resolutionProof} />
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
  const [statusUpdating, setStatusUpdating] = useState({});

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
    await api.updateStage(token, id, stageDraft[id] || "In Review", noteDraft[id] || "");
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
    try {
      await api.updateStatus(token, id, newStatus, "");
      // Update local state immediately for instant UI feedback
      setComplaints((prev) =>
        prev.map((c) =>
          c._id === id ? { ...c, status: newStatus } : c
        )
      );
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
        <div className="mt-6 text-sm text-slate-400">No complaints for this category.</div>
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
                <div className="text-xs rounded-full border border-white/10 bg-white/5 px-3 py-1">{c.currentStage}</div>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Citizen: <span className="text-slate-100">{c.citizen?.name || "Unknown"}</span>
                <div className="text-slate-500">{c.citizen?.email || "no email"}</div>
              </div>
              <div className="mt-2 text-sm text-slate-300">{c.description}</div>
              <StatusStepper currentStatus={c.status} />

              {/* Authority Status Update Panel */}
              <div className="mt-4 p-4 rounded-xl border border-cyan-500/30 bg-cyan-400/5">
                <div className="text-sm font-semibold text-cyan-100 mb-3">Status Update</div>
                <div className="grid gap-2 sm:grid-cols-4">
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
                    disabled={c.status === "Resolved" || statusUpdating[c._id]}
                    onClick={() => quickStatusUpdate(c._id, "Resolved")}
                  >
                    {statusUpdating[c._id] ? "Updating..." : "Mark as Resolved"}
                  </button>
                </div>
                
                {/* Resolution proof upload - show when marking as Resolved */}
                {c.status === "In Progress" && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="text-xs text-slate-400 mb-2">Upload Resolution Proof (optional)</div>
                    <div className="flex items-center gap-3">
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
                        {proofFile[c._id]?.name || "No file chosen"}
                      </span>
                      <button 
                        className="btn btn-primary text-xs" 
                        onClick={() => updateStatus(c._id).catch(() => {})}
                        disabled={!proofFile[c._id]}
                      >
                        Upload & Update
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Show existing resolution proof */}
              {c.resolutionProof && (
                <ResolutionProof proofUrl={c.resolutionProof} />
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
    localStorage.removeItem("civiclink_citizen");
    localStorage.removeItem("civiclink_authority");
    setCitizen(null);
    setAuthority(null);
    setActiveView("landing");
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
    <div className="min-h-full bg-aurora">
      <TopBar mode={mode} setMode={setMode} who={who} onLogout={logout} />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {!citizen && !authority ? (
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Hero Section - Always visible but adapts */}
            <div className={`text-center transition-all duration-700 ${
              activeView !== "landing" ? "mb-8" : "mb-12"
            }`}>
              <h1 className={`font-bold mb-4 gradient-text transition-all duration-700 ${
                activeView !== "landing" 
                  ? "text-4xl md:text-5xl" 
                  : "text-5xl md:text-6xl animate-fade-in"
              }`}>
                Welcome to CivicLink
              </h1>
              {activeView === "landing" && (
                <>
                  <p className="text-2xl md:text-3xl font-semibold text-white mb-3 animate-fade-in stagger-1">
                    Your Voice, Your City
                  </p>
                  <p className="text-lg text-white/60 max-w-3xl mx-auto leading-relaxed animate-fade-in stagger-2">
                    Report issues, track progress, and help build a better community quickly and transparently.
                    <br className="hidden md:block" />
                    Making Civic Engagement Simple and Effective.
                  </p>
                </>
              )}
            </div>

            {/* Landing View - Cards and Features */}
            {activeView === "landing" && (
              <div className="animate-fade-in">
                {/* Selection Cards */}
                <div className="grid md:grid-cols-2 gap-6 mb-12 max-w-5xl mx-auto">
                  {/* Citizen Box */}
                  <div 
                    className="glass-card rounded-2xl p-8 cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl group"
                    onClick={() => handleModeSelect("citizen")}
                  >
                    <div className="text-center">
                      <div className="text-7xl mb-6 transform transition-transform duration-300 group-hover:scale-110">👤</div>
                      <h3 className="text-3xl font-bold text-white mb-4">For Citizens</h3>
                      <p className="text-white/60 mb-8 leading-relaxed text-lg">
                        Raise complaints, upload evidence, and track the status of your reports in real-time.
                      </p>
                      <button className="btn btn-primary w-full glow-effect text-lg py-4">
                        Get Started →
                      </button>
                    </div>
                  </div>

                  {/* Authority Box */}
                  <div 
                    className="glass-card rounded-2xl p-8 cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl group"
                    onClick={() => handleModeSelect("authority")}
                  >
                    <div className="text-center">
                      <div className="text-7xl mb-6 transform transition-transform duration-300 group-hover:scale-110">🏛️</div>
                      <h3 className="text-3xl font-bold text-white mb-4">For Authorities</h3>
                      <p className="text-white/60 mb-8 leading-relaxed text-lg">
                        Manage and resolve complaints efficiently with our streamlined dashboard.
                      </p>
                      <button className="btn btn-primary w-full glow-effect text-lg py-4">
                        Access Portal →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Features Grid */}
                <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  <div className="glass-card rounded-xl p-6 text-center hover:scale-105 transition-all duration-300">
                    <div className="text-5xl mb-4">📍</div>
                    <h4 className="text-lg font-semibold text-white mb-2">GPS Location Tagging</h4>
                    <p className="text-sm text-white/50">Automatically detect and tag complaint locations</p>
                  </div>
                  <div className="glass-card rounded-xl p-6 text-center hover:scale-105 transition-all duration-300">
                    <div className="text-5xl mb-4">📸</div>
                    <h4 className="text-lg font-semibold text-white mb-2">Photo Evidence</h4>
                    <p className="text-sm text-white/50">Upload photos from camera or gallery</p>
                  </div>
                  <div className="glass-card rounded-xl p-6 text-center hover:scale-105 transition-all duration-300">
                    <div className="text-5xl mb-4">📊</div>
                    <h4 className="text-lg font-semibold text-white mb-2">Real-time Tracking</h4>
                    <p className="text-sm text-white/50">Monitor progress from submission to resolution</p>
                  </div>
                </div>
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

