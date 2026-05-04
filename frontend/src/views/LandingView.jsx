import { Zap, Eye, Shield, TrendingUp, Mail, Phone, MapPin } from 'lucide-react';

export function LandingView({ onModeSelect, activeView, isTransitioning }) {
  return (
    <div className="max-w-7xl mx-auto">
      <div className={`text-center transition-all duration-700 animate-fade-in ${activeView !== "landing" ? "mb-8 opacity-60 scale-90" : "mb-12"}`}>
        <img src="/logo.png" alt="CivicLink" className={`mx-auto mb-6 object-contain animate-logo-pulse transition-all duration-1000 ${activeView !== "landing" ? "h-16" : "h-32"}`} />
        <h1 className={`font-bold mb-4 gradient-text transition-all duration-1000 animate-reveal ${activeView !== "landing" ? "text-4xl" : "text-6xl md:text-8xl"}`}>CivicLink</h1>
        {activeView === "landing" && (
          <div className="animate-slide-up-in">
            <p className="text-3xl font-light text-white/90 mb-6">Your Voice, <span className="font-bold text-blue-400">Your City</span></p>
          </div>
        )}
      </div>

      {activeView === "landing" && (
        <div className="animate-fade-in stagger-3">
          <div className="grid md:grid-cols-2 gap-8 mb-20 max-w-5xl mx-auto">
            <div className="glass-card rounded-3xl p-10 cursor-pointer group" onClick={() => onModeSelect("citizen")}>
              <div className="text-center">
                <div className="text-8xl mb-8 animate-float">👤</div>
                <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-blue-300">For Citizens</h3>
                <button className="btn btn-primary w-full text-lg py-5">Launch Dashboard</button>
              </div>
            </div>
            <div className="glass-card rounded-3xl p-10 cursor-pointer group" onClick={() => onModeSelect("authority")}>
              <div className="text-center">
                <div className="text-8xl mb-8 animate-float [animation-delay:0.5s]">🏛️</div>
                <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-purple-300">For Authorities</h3>
                <button className="btn btn-primary w-full text-lg py-5">Access Portal</button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <FeatureCard icon={<Zap />} title="Rapid File" desc="Submit grievances in seconds." />
            <FeatureCard icon={<Eye />} title="Live Ledger" desc="Immutable tracking of reports." />
            <FeatureCard icon={<Shield />} title="Vault Security" desc="Institutional-grade encryption." />
            <FeatureCard icon={<TrendingUp />} title="Civic Insights" desc="AI-powered analytics." />
          </div>

          <footer className="mt-24 py-16 border-t border-white/10 text-center">
            <div className="flex justify-center gap-12 text-slate-400 mb-8">
              <div className="flex items-center gap-2"><Mail size={16} /> support@civiclink.com</div>
              <div className="flex items-center gap-2"><Phone size={16} /> 1-800-CIVIC-LINK</div>
            </div>
            <p className="text-slate-500 text-sm">© 2026 CivicLink. Built for transparency.</p>
          </footer>
        </div>
      )}
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="glass-card rounded-2xl p-8 hover:-translate-y-3 transition-all">
      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-white/40 leading-relaxed text-sm">{desc}</p>
    </div>
  );
}
