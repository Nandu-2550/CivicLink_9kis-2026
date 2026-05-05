import { useState } from "react";
import { api } from "../api";
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';

const CATEGORIES = ["Police", "School/University", "Municipality", "Consumer/Cyber", "Human Rights", "Govt Dept", "Traffic", "Pollution"];

export function AuthorityAuth({ onAuthed }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ category: "Police", deptCode: "" });
  const [showSecret, setShowSecret] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      // The backend now verifies only by deptCode
      const payload = { 
        deptCode: form.deptCode 
      };
      const data = await api.authorityLogin(payload);
      onAuthed({ token: data.token, authority: data.authority });
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setLoading(false);
    }
  }

  const categoryIcons = {
    "Police": "🚔", "School/University": "🎓", "Municipality": "🏛️", "Consumer/Cyber": "🔒",
    "Human Rights": "⚖️", "Govt Dept": "📋", "Traffic": "🚦", "Pollution": "🌿"
  };

  return (
    <div className="glass-card rounded-2xl p-8 animate-fade-in max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
          <ShieldCheck className="text-blue-400" size={32} />
        </div>
        <h2 className="text-3xl font-bold gradient-text mb-2">Authority Portal</h2>
        <p className="text-white/40 text-sm">Enter your department's secret access code</p>
      </div>

      <form className="space-y-6" onSubmit={submit}>
        <div className="space-y-3">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">Department Category</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c} type="button" onClick={() => setForm((s) => ({ ...s, category: c }))}
                className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-sm transition-all ${form.category === c ? 'bg-blue-500/20 border-blue-500/50 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'}`}
              >
                <span className="text-lg">{categoryIcons[c]}</span><span className="text-xs">{c}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">Access Code</label>
          <div className="relative">
            <input 
              className="input pr-12 focus:border-blue-500/50" 
              placeholder="Enter Department Secret Code" 
              type={showSecret ? "text" : "password"} 
              value={form.deptCode} 
              onChange={(e) => setForm((s) => ({ ...s, deptCode: e.target.value }))} 
              required
            />
            <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors" onClick={() => setShowSecret(!showSecret)}>
              {showSecret ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {err && (
          <div className="text-sm text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20 animate-shake">
            {err}
          </div>
        )}

        <button className="btn btn-primary w-full py-4 text-lg font-bold shadow-lg shadow-blue-500/20" disabled={loading} type="submit">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Verifying...
            </span>
          ) : "Access Dashboard"}
        </button>
      </form>
      
      <div className="mt-8 text-center">
        <p className="text-white/20 text-xs">Shared access enabled for department teams</p>
      </div>
    </div>
  );
}
