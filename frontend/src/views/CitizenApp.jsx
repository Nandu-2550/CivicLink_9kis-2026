import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import { CameraModal } from "../components/CameraModal";
import { ImagePanel } from "../components/ImagePanel";
import { StatusStepper } from "../components/StatusStepper";

export function CitizenApp({ token, user }) {
  const [gps, setGps] = useState({ lat: null, lng: null, accuracyM: null, updatedAt: null, status: "idle" });
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ title: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [gpsErrorHint, setGpsErrorHint] = useState("");
  const gpsWatchIdRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const predicted = useMemo(() => {
    const d = (form.description || "").toLowerCase();
    if (!d.trim()) return "Auto";
    if (d.includes("traffic") || d.includes("signal")) return "Traffic";
    if (d.includes("fraud") || d.includes("cyber")) return "Consumer/Cyber";
    if (d.includes("garbage") || d.includes("pothole")) return "Municipality";
    if (d.includes("pollution") || d.includes("smoke")) return "Pollution";
    if (d.includes("school") || d.includes("college")) return "School/University";
    if (d.includes("rights") || d.includes("discrimination")) return "Human Rights";
    if (d.includes("theft") || d.includes("police")) return "Police";
    if (d.includes("pension") || d.includes("ration")) return "Govt Dept";
    return "Auto";
  }, [form.description]);

  async function loadMine() {
    try {
      const data = await api.myComplaints(token);
      setComplaints(data.complaints || []);
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    loadMine();
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
    if (!navigator.geolocation) return setGps({ lat: null, lng: null, status: "unsupported" });

    stopWatchingLocation();
    gpsWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracyM: pos.coords.accuracy, updatedAt: Date.now(), status: "ok" });
      },
      (e) => {
        const denied = e && (e.code === 1);
        setGps({ lat: null, lng: null, status: denied ? "denied" : "error" });
        setGpsErrorHint(denied ? "Location permission denied." : "Unable to read location.");
        stopWatchingLocation();
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }

  useEffect(() => {
    startWatchingLocation();
    return () => stopWatchingLocation();
  }, []);

  async function submitComplaint(e) {
    e.preventDefault();
    setLoading(true); setErr(""); setMsg("");
    try {
      const loc = { lat: gps.lat, lng: gps.lng, formattedAddress: "" };
      await api.fileComplaint({ token, title: form.title, description: form.description, location: loc, file });
      setMsg("Complaint filed successfully.");
      setForm({ title: "", description: "" }); setFile(null);
      await loadMine();
    } catch (ex) { setErr(ex.message); } finally { setLoading(false); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <CameraModal open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={(f) => setFile(f)} />
      <div className="glass rounded-2xl p-6 lg:col-span-2">
        <div className="text-xl font-semibold">File Complaint</div>
        <form className="mt-5 space-y-3" onSubmit={submitComplaint}>
          <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
          <textarea className="input min-h-[120px]" placeholder="Description" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
          <div className="flex items-center justify-between gap-3 text-sm">
            <div>Predicted: <span className="text-slate-100">{predicted}</span></div>
            <button className="btn" onClick={startWatchingLocation} type="button">Refresh Location</button>
          </div>
          <div className="text-xs text-slate-400">
            GPS: {gps.status === "ok" ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : gps.status}
          </div>
          <div className="flex items-center gap-3">
            <label className="btn btn-primary cursor-pointer">
              Upload <input className="hidden" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            <button className="btn" type="button" onClick={() => setCameraOpen(true)}>Camera</button>
            <button className="btn" type="button" onClick={() => setFile(null)} disabled={!file}>Clear</button>
          </div>
          <div className="text-xs text-slate-400">{file?.name || "No file chosen"}</div>
          {err && <div className="text-sm text-red-300">{err}</div>}
          {msg && <div className="text-sm text-emerald-200">{msg}</div>}
          <button className="btn btn-primary w-full" disabled={loading} type="submit">{loading ? "Submitting..." : "Submit"}</button>
        </form>
      </div>

      <div className="glass rounded-2xl p-6 lg:col-span-3">
        <div className="flex items-end justify-between mb-6">
          <div className="text-xl font-semibold">My Complaints</div>
          <button className="btn" onClick={loadMine}>Refresh</button>
        </div>
        <div className="grid gap-4">
          {complaints.length === 0 ? <div className="text-sm text-slate-400">No complaints yet</div> : complaints.map((c) => (
            <div key={c._id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex justify-between font-semibold">
                <span>{c.title}</span>
                <span className="text-xs glass px-2 py-1 rounded-full">{c.category}</span>
              </div>
              <div className="mt-2 text-sm text-slate-300">{c.description}</div>
              <ImagePanel title="Evidence" imageUrl={c.citizenImage || c.attachmentUrl} />
              <ImagePanel title="Resolution" imageUrl={c.authorityImage || c.resolutionProof} />
              <StatusStepper currentStatus={c.status} />
              {c.statusHistory && c.statusHistory.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="text-[10px] uppercase text-slate-500 font-bold mb-2">History</div>
                  {c.statusHistory.slice().reverse().map((h, i) => (
                    <div key={i} className="text-xs mb-1">
                      <span className="font-bold text-slate-300">{h.step}</span>: {h.note}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
