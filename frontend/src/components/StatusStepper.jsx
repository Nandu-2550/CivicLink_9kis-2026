const STATUS_STEPS = ["Pending", "Under Review", "In Progress", "Resolved"];

export function StatusStepper({ currentStatus, priority, escalationLevel }) {
  const statusPercentages = {
    "Pending": 20,
    "Under Review": 40,
    "In Progress": 70,
    "Resolved": 100
  };
  
  const activeIdx = Math.max(0, STATUS_STEPS.indexOf(currentStatus));
  const progressPercent = statusPercentages[currentStatus] || 20;
  
  const StatusBadge = () => {
    if (!priority && escalationLevel !== 0) return null;
    
    const isCritical = priority === 'CRITICAL';
    const levelText = escalationLevel > 0 ? ` (Lv ${escalationLevel})` : '';
    
    return (
      <div className={`inline-flex px-4 py-2 rounded-full text-xs font-bold mb-4 transition-all duration-500 ${
        isCritical 
          ? 'bg-red-900/60 text-red-100 border-2 border-red-500 critical-glow shadow-xl' 
          : escalationLevel > 0 
            ? 'bg-orange-900/50 text-orange-100 border-2 border-orange-500 shadow-lg' 
            : 'bg-blue-900/30 text-blue-100 border border-blue-500/50'
      }`}>
        {isCritical ? '🚨 CRITICAL ESCALATED' : escalationLevel > 0 ? `⚠️ ESCALATED${levelText}` : `Priority: ${priority?.toUpperCase()}`}
      </div>
    );
  };
  
  const getStatusColor = (step, idx) => {
    if (idx <= activeIdx) {
      if (step === "Resolved") return "bg-emerald-400/20 border-emerald-400/40 text-emerald-100";
      if (step === "In Progress") return "bg-orange-400/20 border-orange-400/40 text-orange-100";
      return "bg-cyan-400/20 border-cyan-400/40 text-cyan-100";
    }
    return "bg-white/5 border-white/20 text-slate-400";
  };
  
  return (
    <div className="mt-3">
      <StatusBadge />
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-3">
        <div 
          className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_STEPS.map((s, idx) => {
          const done = idx <= activeIdx;
          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className={[
                  "h-8 w-8 rounded-full grid place-items-center text-xs border transition-all",
                  getStatusColor(s, idx)
                ].join(" ")}
                title={s}
              >
                {idx + 1}
              </div>
              {idx !== STATUS_STEPS.length - 1 && (
                <div className={done ? "h-px w-8 bg-gradient-to-r from-cyan-400 to-emerald-400/50" : "h-px w-8 bg-white/10"} />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-xs text-slate-400">
        Status: <span className="text-slate-200 font-medium">{currentStatus || "Pending"}</span>
        <span className="ml-2 text-cyan-300">({progressPercent}%)</span>
      </div>
    </div>
  );
}

