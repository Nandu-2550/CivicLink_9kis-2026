import { useState } from "react";
import { api } from "../api";
import { Eye, EyeOff } from 'lucide-react';

export function CitizenAuth({ onAuthed }) {
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

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
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold gradient-text mb-2">
          {tab === "login" ? "Welcome back, Citizen" : "Join CivicLink"}
        </h2>
      </div>
      <div className="flex gap-2 mb-6 p-1 rounded-xl bg-white/5">
        <button 
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-300 ${tab === "login" ? "bg-white/10 text-white" : "text-white/50"}`}
          onClick={() => setTab("login")} 
        >
          Login
        </button>
        <button 
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-300 ${tab === "signup" ? "bg-white/10 text-white" : "text-white/50"}`}
          onClick={() => setTab("signup")} 
        >
          Sign Up
        </button>
      </div>
      <form className="space-y-4" onSubmit={submit}>
        {tab === "signup" && (
          <input className="input" placeholder="Full Name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
        )}
        <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
        <div className="relative">
          <input className="input pr-12" type={showPassword ? "text" : "password"} placeholder="Password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} />
          <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {err && <div className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg">{err}</div>}
        <button className="btn btn-primary w-full mt-6" disabled={loading} type="submit">
          {loading ? "Processing..." : tab === "login" ? "Sign In" : "Create Account"}
        </button>
      </form>
    </div>
  );
}
