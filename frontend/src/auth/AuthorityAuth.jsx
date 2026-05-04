import { useState } from "react";
import { api } from "../api";
import { Eye, EyeOff } from 'lucide-react';

const CATEGORIES = ["Police", "School/University", "Municipality", "Consumer/Cyber", "Human Rights", "Govt Dept", "Traffic", "Pollution"];

export function AuthorityAuth({ onAuthed }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ category: "Police", secretCode: "" });
  const [showSecret, setShowSecret] = useState(false);

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
    "Police": "🚔", "School/University": "🎓", "Municipality": "🏛️", "Consumer/Cyber": "🔒",
    "Human Rights": "⚖️", "Govt Dept": "📋", "Traffic": "🚦", "Pollution": "🌿"
  };

  return (
    <div className="glass-card rounded-2xl p-8 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold gradient-text mb-2">Authority Access Portal</h2>
      </div>
      <form className="space-y-5" onSubmit={submit}>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c} type="button" onClick={() => setForm((s) => ({ ...s, category: c }))}
              className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-sm transition-all ${form.category === c ? 'bg-white/10 border-white/30 text-white' : 'bg-white/5 border-white/10 text-white/60'}`}
            >
              <span>{categoryIcons[c]}</span><span className="text-xs">{c}</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <input className="input pr-12" placeholder="Secret Code" type={showSecret ? "text" : "password"} value={form.secretCode} onChange={(e) => setForm((s) => ({ ...s, secretCode: e.target.value }))} />
          <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40" onClick={() => setShowSecret(!showSecret)}>
            {showSecret ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {err && <div className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg">{err}</div>}
        <button className="btn btn-primary w-full" disabled={loading} type="submit">
          {loading ? "Authenticating..." : "Access Dashboard"}
        </button>
      </form>
    </div>
  );
}
