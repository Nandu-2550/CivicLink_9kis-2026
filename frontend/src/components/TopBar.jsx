import { motion } from 'framer-motion';

export function TopBar({ who, onLogout }) {
  if (!who) return null;
  
  return (
    <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/50 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <motion.img 
            src="/logo.png" 
            alt="CivicLink Logo" 
            animate={{ 
              filter: [
                "drop-shadow(0 0 8px rgba(37, 99, 235, 0.4))", 
                "drop-shadow(0 0 20px rgba(16, 185, 129, 0.6))", 
                "drop-shadow(0 0 8px rgba(37, 99, 235, 0.4))"
              ] 
            }}
            whileHover={{ 
              scale: 1.05,
              filter: "drop-shadow(0 0 25px rgba(16, 185, 129, 0.8))"
            }}
            transition={{ 
              filter: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 0.2 }
            }}
            className="h-8 sm:h-12 w-auto object-contain cursor-pointer" 
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
