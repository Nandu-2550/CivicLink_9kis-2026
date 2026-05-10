import { useEffect, useState } from "react";
import { api } from "../api";
import { ImagePanel } from "../components/ImagePanel";
import { StatusStepper } from "../components/StatusStepper";

export function AuthorityApp({ token, authority }) {
  const [complaints, setComplaints] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [noteDraft, setNoteDraft] = useState({});
  const [proofFile, setProofFile] = useState({});
  const [showResolutionProofUploadForId, setShowResolutionProofUploadForId] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState({});

  async function load() {
    setErr(""); setLoading(true);
    try {
      const data = await api.authorityComplaints(token);
      setComplaints(data.complaints || []);
    } catch (ex) { setErr(ex.message); } finally { setLoading(false); }
  }

  useEffect(() => {
    load();
  }, []);

  async function quickStatusUpdate(id, newStatus) {
    if (statusUpdating[id]) return;
    setStatusUpdating((prev) => ({ ...prev, [id]: true }));
    try {
      const file = proofFile[id] || null;
      const note = noteDraft[id] || `Status changed to ${newStatus}`;
      await api.updateStatus(token, id, newStatus, note, file);
      setProofFile((s) => ({ ...s, [id]: null }));
      setNoteDraft((s) => ({ ...s, [id]: "" }));
      setShowResolutionProofUploadForId(null);
      await load();
    } catch (ex) { 
      setErr(ex.message); 
    } finally { 
      setStatusUpdating((prev) => ({ ...prev, [id]: false })); 
    }
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <div className="text-xl font-semibold">Authority Dashboard</div>
          <div className="text-sm text-slate-400">Category: {authority?.category}</div>
        </div>
        <button className="btn" onClick={load}>Refresh</button>
      </div>

      {err && <div className="text-sm text-red-300 mb-4">{err}</div>}
      {loading ? (
        <div className="text-sm text-slate-400">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {complaints.map((c) => (
            <div key={c._id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex justify-between items-start gap-4">
                <div className="font-semibold text-lg">{c.title}</div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Filed By</span>
                  <div className="text-xs glass px-3 py-1.5 rounded-xl border border-white/10 flex flex-col items-end">
                    <span className="font-bold text-white">{c.citizen?.name}</span>
                    <span className="text-blue-400 font-mono text-[10px]">{c.citizen?.email}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-sm text-slate-300 flex items-start gap-2">
                <div className="flex-1 italic">"{c.description}"</div>
              </div>
              <ImagePanel title="Evidence" imageUrl={c.citizenImage || c.attachmentUrl} />
              
              {c.location?.lat && c.location?.lng && (
                <div className="mt-4 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-1">Incident Location</div>
                      <div className="text-sm text-white font-mono flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        {c.location.lat.toFixed(6)}, {c.location.lng.toFixed(6)}
                      </div>
                      {c.location.address && <div className="text-xs text-slate-400 mt-1 italic">{c.location.address}</div>}
                    </div>
                    <a 
                      href={`https://www.google.com/maps?q=${c.location.lat},${c.location.lng}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-primary text-[10px] py-2 px-4 shadow-lg shadow-blue-500/20 flex items-center gap-2"
                    >
                      <span>View Map</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                  </div>
                </div>
              )}

              <ImagePanel title="Resolution Proof" imageUrl={c.authorityImage || c.resolutionProof} />
              <StatusStepper currentStatus={c.status} />

              {c.status !== "Resolved" && (
                <div className="mt-4 p-4 rounded-xl border border-cyan-500/30 bg-cyan-400/5">
                  <div className="text-sm font-semibold text-cyan-100 mb-3">Update Progress</div>
                  {showResolutionProofUploadForId === c._id ? (
                    <div className="space-y-3">
                      <input type="file" onChange={(e) => setProofFile((s) => ({ ...s, [c._id]: e.target.files?.[0] || null }))} />
                      <div className="flex gap-2">
                        <button className="btn btn-primary flex-1" onClick={() => quickStatusUpdate(c._id, "Resolved")}>Confirm Resolution</button>
                        <button className="btn flex-1" onClick={() => setShowResolutionProofUploadForId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-3">
                      <button 
                        className="btn text-xs" 
                        onClick={() => quickStatusUpdate(c._id, "Under Review")}
                        disabled={statusUpdating[c._id]}
                      >
                        {statusUpdating[c._id] ? "..." : "Under Review"}
                      </button>
                      <button 
                        className="btn text-xs" 
                        onClick={() => quickStatusUpdate(c._id, "In Progress")}
                        disabled={statusUpdating[c._id]}
                      >
                        {statusUpdating[c._id] ? "..." : "In Progress"}
                      </button>
                      <button 
                        className="btn btn-primary text-xs" 
                        onClick={() => setShowResolutionProofUploadForId(c._id)}
                        disabled={statusUpdating[c._id]}
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                  <textarea 
                    className="input text-xs mt-3 min-h-[60px]" 
                    placeholder="Progress note..." 
                    value={noteDraft[c._id] || ""} 
                    onChange={(e) => setNoteDraft(prev => ({ ...prev, [c._id]: e.target.value }))} 
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
