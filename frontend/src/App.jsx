import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";

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
  const activeIdx = Math.max(0, STATUS_STEPS.indexOf(currentStatus));
  
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

function StageTimeline({ currentStage }) {
  const activeIdx = Math.max(0, STAGES.indexOf(currentStage));
  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        {STAGES.map((s, idx) => {
          const done = idx <= activeIdx;
          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className={[
                  "h-8 w-8 rounded-full grid place-items-center text-xs border",
                  done ? "bg-cyan-400/15 border-cyan-300/30 text-cyan-100" : "bg-white/5 border-white/10 text-slate-300"
                ].join(" ")}
                title={s}
              >
                {idx + 1}
              </div>
              {idx !== STAGES.length - 1 && (
                <div className={done ? "h-px w-10 bg-cyan-300/30" : "h-px w-10 bg-white/10"} />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-xs text-slate-400">
        Current: <span className="text-slate-100">{currentStage}</span>
      </div>
    </div>
  );
}

function TopBar({ mode, setMode, who, onLogout }) {
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
          {who ? (
            <>
              <div className="hidden sm:block text-xs text-slate-200 glass rounded-xl px-3 py-2">{who}</div>
              <button className="btn" onClick={onLogout} type="button">
                Logout
              </button>
            </>
          ) : (
            <>
              <button className={mode === "citizen" ? "btn btn-primary" : "btn"} onClick={() => setMode("citizen")} type="button">
                Citizen
              </button>
              <button className={mode === "authority" ? "btn btn-primary" : "btn"} onClick={() => setMode("authority")} type="button">
                Authority
              </button>
            </>
          )}
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
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold">Citizen Access</div>
          <div className="text-sm text-slate-400">JWT Sign-up / Login</div>
        </div>
        <div className="flex gap-2">
          <button className={tab === "login" ? "btn btn-primary" : "btn"} onClick={() => setTab("login")} type="button">
            Login
          </button>
          <button className={tab === "signup" ? "btn btn-primary" : "btn"} onClick={() => setTab("signup")} type="button">
            Signup
          </button>
        </div>
      </div>

      <form className="mt-5 space-y-3" onSubmit={submit}>
        {tab === "signup" && (
          <input className="input" placeholder="Full name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
        )}
        <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
        <input className="input" placeholder="Password (min 6 chars)" type="password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} />
        {err && <div className="text-sm text-red-300">{err}</div>}
        <button className="btn btn-primary w-full" disabled={loading} type="submit">
          {loading ? "Please wait..." : tab === "login" ? "Login" : "Create account"}
        </button>
      </form>
    </div>
  );
}

function CitizenApp({ token }) {
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
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-xl font-semibold">My Complaints</div>
            <div className="text-sm text-slate-400">5-stage progress timeline</div>
          </div>
          <button className="btn" onClick={() => loadMine().catch(() => {})} type="button">
            Refresh
          </button>
        </div>

        <div className="mt-5 grid gap-4">
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
                <StageTimeline currentStage={c.currentStage} />
                <StatusStepper currentStatus={c.status} />
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

  return (
    <div className="glass rounded-2xl p-6">
      <div className="text-xl font-semibold">Authority Login</div>
      <div className="text-sm text-slate-400 mt-1">Category + Secret Code</div>
      <form className="mt-5 space-y-3" onSubmit={submit}>
        <select className="input" value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input className="input" placeholder="Secret code" value={form.secretCode} onChange={(e) => setForm((s) => ({ ...s, secretCode: e.target.value }))} />
        {err && <div className="text-sm text-red-300">{err}</div>}
        <button className="btn btn-primary w-full" disabled={loading} type="submit">
          {loading ? "Please wait..." : "Login"}
        </button>
      </form>
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
        <div className="mt-5 grid gap-4">
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
              <StageTimeline currentStage={c.currentStage} />
              <StatusStepper currentStatus={c.status} />

              {/* Resolution proof upload for authorities */}
              {c.status === "In Progress" && (
                <div className="mt-4 grid gap-3">
                  <div className="text-xs text-slate-400">Update Status (required for resolution proof)</div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <select 
                      className="input" 
                      value={statusDraft[c._id] || c.status || "Pending"} 
                      onChange={(e) => setStatusDraft((s) => ({ ...s, [c._id]: e.target.value }))}
                    >
                      {STATUS_STEPS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <input className="input sm:col-span-1" placeholder="Note (optional)" value={noteDraft[c._id] || ""} onChange={(e) => setNoteDraft((s) => ({ ...s, [c._id]: e.target.value }))} />
                  </div>
                  
                  {/* Resolution proof file input - show only when status is Resolved */}
                  {(statusDraft[c._id] || c.status) === "Resolved" && (
                    <div className="flex items-center gap-3">
                      <label className="btn cursor-pointer select-none text-sm">
                        Upload Proof Photo
                        <input
                          className="hidden"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setProofFile((s) => ({ ...s, [c._id]: e.target.files?.[0] || null }))}
                        />
                      </label>
                      <span className="text-xs text-slate-400">
                        {proofFile[c._id]?.name || (c.resolutionProof ? "Photo uploaded" : "No file chosen")}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button className="btn btn-primary" onClick={() => updateStatus(c._id).catch(() => {})} type="button">
                      Update Status
                    </button>
                  </div>
                </div>
              )}

              {/* Show existing resolution proof */}
              {c.resolutionProof && (
                <ResolutionProof proofUrl={c.resolutionProof} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("citizen");
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
  }

  return (
    <div className="min-h-full bg-aurora">
      <TopBar mode={mode} setMode={setMode} who={who} onLogout={logout} />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {!citizen && !authority ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="glass rounded-2xl p-6">
                <div className="text-3xl font-semibold leading-tight">File complaints. Auto-route them. Track progress.</div>
                <div className="mt-3 text-slate-300">
                  Keyword routing assigns one of 8 authority categories. Authorities see only their department and can update stages.
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <span key={c} className="text-xs rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <div className="glass rounded-2xl p-6 text-sm text-slate-300">
                Make sure backend is running on <span className="text-slate-100">https://civiclink-9kis-2026.onrender.com</span> (or set <span className="text-slate-100">VITE_API_BASE_URL</span>).
              </div>
            </div>

            {mode === "citizen" ? (
              <CitizenAuth
                onAuthed={(data) => {
                  localStorage.setItem("civiclink_citizen", JSON.stringify(data));
                  setCitizen(data);
                }}
              />
            ) : (
              <AuthorityAuth
                onAuthed={(data) => {
                  localStorage.setItem("civiclink_authority", JSON.stringify(data));
                  setAuthority(data);
                }}
              />
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

