import { useState } from "react";
import { api } from "../api";
import { Eye, EyeOff, Mail, KeyRound, ArrowLeft, Phone } from 'lucide-react';

export function CitizenAuth({ onAuthed }) {
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ name: "", identifier: "", email: "", phone: "", password: "", otp: "", newPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot Password States: 'none', 'identifier', 'otp'
  const [forgotStep, setForgotStep] = useState("none");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setSuccess("");
    setLoading(true);
    try {
      if (forgotStep === "identifier") {
        await api.forgotPassword(form.identifier);
        setForgotStep("otp");
        setSuccess("OTP sent successfully!");
      } else if (forgotStep === "otp") {
        await api.resetPassword(form.identifier, form.otp, form.newPassword);
        setForgotStep("none");
        setSuccess("Password reset successful! Please login.");
        setTab("login");
      } else {
        const data =
          tab === "login"
            ? await api.login({ identifier: form.identifier, password: form.password })
            : await api.register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
        onAuthed({ token: data.token, user: data.user });
      }
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setLoading(false);
    }
  }

  const renderForgotPassword = () => (
    <div className="space-y-4 animate-fade-in">
      <button 
        onClick={() => { setForgotStep("none"); setErr(""); setSuccess(""); }}
        className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-4 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Login
      </button>
      
      <h3 className="text-xl font-bold text-white mb-2">
        {forgotStep === "identifier" ? "Reset Password" : "Verify OTP"}
      </h3>
      <p className="text-white/40 text-sm mb-6">
        {forgotStep === "identifier" 
          ? "Enter your email or phone number and we'll send you a 6-digit code." 
          : `We've sent a code to ${form.identifier}`}
      </p>

      <form className="space-y-4" onSubmit={submit}>
        {forgotStep === "identifier" ? (
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
            <input 
              className="input pl-12" 
              type="text" 
              placeholder="Email or Phone Number" 
              value={form.identifier} 
              onChange={(e) => setForm({ ...form, identifier: e.target.value })} 
              required
            />
          </div>
        ) : (
          <>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
              <input 
                className="input pl-12 tracking-widest font-mono" 
                placeholder="6-Digit OTP" 
                maxLength={6}
                value={form.otp} 
                onChange={(e) => setForm({ ...form, otp: e.target.value })} 
                required
              />
            </div>
            <div className="relative">
              <input 
                className="input pr-12" 
                type={showPassword ? "text" : "password"} 
                placeholder="New Password" 
                value={form.newPassword} 
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })} 
                required
              />
              <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </>
        )}

        {err && <div className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{err}</div>}
        {success && <div className="text-sm text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">{success}</div>}

        <button className="btn btn-primary w-full mt-6" disabled={loading} type="submit">
          {loading ? (forgotStep === "identifier" ? "Sending..." : "Processing...") : (forgotStep === "identifier" ? "Send OTP" : "Reset Password")}
        </button>
      </form>
    </div>
  );

  return (
    <div className="glass-card rounded-2xl p-8 animate-fade-in max-w-md mx-auto">
      {forgotStep !== "none" ? (
        renderForgotPassword()
      ) : (
        <>
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold gradient-text mb-2">
              {tab === "login" ? "Citizen Portal" : "Join CivicLink"}
            </h2>
          </div>
          <div className="flex gap-2 mb-6 p-1 rounded-xl bg-white/5">
            <button 
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-300 ${tab === "login" ? "bg-white/10 text-white shadow-lg" : "text-white/50 hover:text-white/80"}`}
              onClick={() => { setTab("login"); setErr(""); setSuccess(""); }} 
            >
              Login
            </button>
            <button 
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all duration-300 ${tab === "signup" ? "bg-white/10 text-white shadow-lg" : "text-white/50 hover:text-white/80"}`}
              onClick={() => { setTab("signup"); setErr(""); setSuccess(""); }} 
            >
              Sign Up
            </button>
          </div>

          <form className="space-y-4" onSubmit={submit}>
            {tab === "signup" && (
              <>
                <div className="relative">
                  <input className="input" placeholder="Full Name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input className="input pl-12" type="email" placeholder="Email (Optional)" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input className="input pl-12" type="tel" placeholder="Phone Number (Optional)" value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} />
                </div>
                <p className="text-[10px] text-white/30 px-1">Provide at least one: Email or Phone.</p>
              </>
            )}
            
            {tab === "login" && (
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input className="input pl-12" type="text" placeholder="Email or Phone Number" value={form.identifier} onChange={(e) => setForm((s) => ({ ...s, identifier: e.target.value }))} required />
              </div>
            )}

            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input className="input pl-12 pr-12" type={showPassword ? "text" : "password"} placeholder="Password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} required />
              <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {tab === "login" && (
              <div className="text-right">
                <button 
                  type="button" 
                  onClick={() => { setForgotStep("identifier"); setErr(""); setSuccess(""); }}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {err && <div className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{err}</div>}
            {success && <div className="text-sm text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">{success}</div>}

            <button className="btn btn-primary w-full mt-6 py-3 font-bold" disabled={loading} type="submit">
              {loading ? "Processing..." : tab === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
