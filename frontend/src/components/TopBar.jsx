export function TopBar({ who, onLogout }) {
  if (!who) return null;
  
  return (
    <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/50 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="CivicLink Logo" 
            className="h-11 w-11 object-contain animate-logo-pulse drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]" 
          />
          <div>
            <div className="text-xl font-black leading-tight gradient-text tracking-tighter">CivicLink</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-xs text-slate-200 glass rounded-xl px-3 py-2">{who}</div>
          <button className="btn" onClick={onLogout} type="button">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
