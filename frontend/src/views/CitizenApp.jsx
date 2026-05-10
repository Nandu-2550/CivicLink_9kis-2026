import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import { CameraModal } from "../components/CameraModal";
import { ImagePanel } from "../components/ImagePanel";
import { StatusStepper } from "../components/StatusStepper";
import { LocationPicker } from "../components/LocationPicker";

export function CitizenApp({ token, user }) {
  const [gps, setGps] = useState({ lat: null, lng: null, address: "", status: "idle" });
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ title: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [gpsErrorHint, setGpsErrorHint] = useState("");
  const gpsWatchIdRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

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
        setGps((prev) => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude, status: "ok" }));
      },
      (e) => {
        const denied = e && (e.code === 1);
        setGps((prev) => ({ ...prev, lat: null, lng: null, status: denied ? "denied" : "error" }));
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
      // Ensure we have GPS before submitting
      let finalLat = gps.lat;
      let finalLng = gps.lng;

      if (!finalLat || !finalLng) {
        // One last attempt to get location if not ready
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              finalLat = pos.coords.latitude;
              finalLng = pos.coords.longitude;
              resolve();
            },
            (err) => reject(new Error("Location is required to file a complaint. Please enable GPS.")),
            { enableHighAccuracy: true, timeout: 5000 }
          );
        });
      }

      const loc = { lat: finalLat, lng: finalLng, address: gps.address };
      await api.fileComplaint({ token, title: form.title, description: form.description, location: loc, file });
      
      setMsg("Complaint filed successfully.");
      setForm({ title: "", description: "" }); setFile(null);
      // Don't reset GPS entirely, keep it watching for next
      await loadMine();
    } catch (ex) { 
      setErr(ex.message); 
    } finally { 
      setLoading(false); 
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this complaint? This cannot be undone.")) return;
    setLoading(true);
    try {
      await api.deleteComplaint(token, id);
      await loadMine();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <CameraModal open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={(f) => setFile(f)} />
      <div className="glass rounded-2xl p-6 lg:col-span-2">
        <div className="text-xl font-semibold">File Complaint</div>
        <form className="mt-5 space-y-3" onSubmit={submitComplaint}>
          <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} required />
          <textarea className="input min-h-[120px]" placeholder="Detailed description of the issue..." value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} required />
          
          <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${gps.status === 'ok' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                Live GPS Location
              </span>
              {gps.status !== 'ok' && (
                <button type="button" onClick={startWatchingLocation} className="text-[10px] text-blue-400 hover:underline">
                  Enable GPS
                </button>
              )}
            </div>
            
            <div className="text-xs">
              {gps.status === "ok" ? (
                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-mono bg-white/5 px-2 py-1 rounded">
                    {gps.lat?.toFixed(5)}, {gps.lng?.toFixed(5)}
                  </span>
                  <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Locked</span>
                </div>
              ) : (
                <div className="text-red-400 italic bg-red-400/5 p-2 rounded border border-red-400/10">
                  {gpsErrorHint || "Waiting for GPS signal..."}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm">
            <div>Predicted Category: <span className="text-slate-100 font-bold">{predicted}</span></div>
          </div>

          <div className="flex items-center gap-3">
            <label className="btn btn-primary cursor-pointer">
              Upload <input className="hidden" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            <button className="btn" type="button" onClick={() => setCameraOpen(true)}>Camera</button>
            <button className="btn" type="button" onClick={() => setFile(null)} disabled={!file}>Clear</button>
          </div>
          <div className="text-xs text-slate-400">{file?.name || "No file chosen"}</div>
          {err && <div className="text-sm text-red-400 font-medium bg-red-400/10 p-3 rounded-xl border border-red-400/20">{err}</div>}
          {msg && <div className="text-sm text-emerald-300 font-medium bg-emerald-400/10 p-3 rounded-xl border border-emerald-400/20">{msg}</div>}
          <button 
            className={`btn btn-primary w-full py-4 text-lg font-bold transition-all ${loading ? 'opacity-70 scale-[0.98]' : 'hover:scale-[1.01]'}`} 
            disabled={loading} 
            type="submit"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                Submitting Complaint...
              </span>
            ) : "Submit Complaint"}
          </button>
        </form>
      </div>

      <div className="glass rounded-2xl p-6 lg:col-span-3">
        <div className="flex items-end justify-between mb-6">
          <div className="text-xl font-semibold">My Complaints</div>
          <button className="btn" onClick={loadMine}>Refresh</button>
        </div>
        <div className="grid gap-4">
          {complaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-2xl border-dashed border-2 border-white/10">
              <div className="text-4xl mb-4">📝</div>
              <div className="text-xl font-semibold text-slate-200">No complaints filed yet</div>
              <p className="text-sm text-slate-400 mt-2 max-w-[250px]">
                You haven't filed any complaints yet. Use the form on the left to report an issue in your community!
              </p>
            </div>
          ) : complaints.map((c) => (
            <div key={c._id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex justify-between items-start font-semibold">
                <span>{c.title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs glass px-2 py-1 rounded-full">{c.category}</span>
                  <button 
                    className="text-red-400 hover:text-red-300 transition-colors" 
                    onClick={() => handleDelete(c._id)}
                    title="Delete Complaint"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
              <div className="mt-2 text-sm text-slate-300">{c.description}</div>
              <ImagePanel title="Evidence" imageUrl={c.citizenImage || c.attachmentUrl} />
              <ImagePanel title="Resolution" imageUrl={c.authorityImage || c.resolutionProof} />
              <StatusStepper currentStatus={c.status} />
              {c.statusHistory && c.statusHistory.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="text-[10px] uppercase text-slate-500 font-bold mb-2">History Log</div>
                  <div className="space-y-2">
                    {c.statusHistory
                      .slice()
                      .reverse()
                      .filter((h, i, arr) => {
                        if (i === 0) return true;
                        const isAuto = h.note === `Status changed to ${h.step}`;
                        if (isAuto && arr[i-1].step === h.step) return false;
                        return true;
                      })
                      .slice(0, 5)
                      .map((h, i) => (
                        <div key={i} className="flex gap-3 text-xs">
                          <div className="w-20 shrink-0 font-bold text-slate-400">{h.step}</div>
                          <div className="text-slate-300 italic">{h.note}</div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
