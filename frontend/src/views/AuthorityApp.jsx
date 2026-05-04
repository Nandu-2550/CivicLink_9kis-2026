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
    setStatusUpdating((prev) => ({ ...prev, [id]: true }));
    try {
      const file = proofFile[id] || null;
      const note = noteDraft[id] || `Status changed to ${newStatus}.`;
      await api.updateStatus(token, id, newStatus, note, file);
      setProofFile((s) => ({ ...s, [id]: null }));
      setNoteDraft((s) => ({ ...s, [id]: "" }));
      setShowResolutionProofUploadForId(null);
      await load();
    } catch (ex) { setErr(ex.message); } finally { setStatusUpdating((prev) => ({ ...prev, [id]: false })); }
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
              <div className="flex justify-between font-semibold">
                <span>{c.title}</span>
                <span className="text-xs glass px-2 py-1 rounded-full">Citizen: {c.citizen?.name}</span>
              </div>
              <div className="mt-2 text-sm text-slate-300">{c.description}</div>
              <ImagePanel title="Evidence" imageUrl={c.citizenImage || c.attachmentUrl} />
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
                      <button className="btn text-xs" onClick={() => quickStatusUpdate(c._id, "Under Review")}>Under Review</button>
                      <button className="btn text-xs" onClick={() => quickStatusUpdate(c._id, "In Progress")}>In Progress</button>
                      <button className="btn btn-primary text-xs" onClick={() => setShowResolutionProofUploadForId(c._id)}>Resolve</button>
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
