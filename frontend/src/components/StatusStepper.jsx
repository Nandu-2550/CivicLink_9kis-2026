const STATUS_STEPS = ["Pending", "Under Review", "In Progress", "Resolved"];

export function StatusStepper({ currentStatus }) {
  const statusPercentages = {
    "Pending": 20,
    "Under Review": 40,
    "In Progress": 70,
    "Resolved": 100
  };
  
  const activeIdx = Math.max(0, STATUS_STEPS.indexOf(currentStatus));
  const progressPercent = statusPercentages[currentStatus] || 20;
  
  const getStatusColor = (step, idx) => {
    if (idx <= activeIdx) {
      if (step === "Resolved") return "bg-emerald-400/15 border-emerald-300/30 text-emerald-100";
      if (step === "In Progress") return "bg-orange-400/15 border-orange-300/30 text-orange-100";
      return "bg-cyan-400/15 border-cyan-300/30 text-cyan-100";
    }
    return "bg-white/5 border-white/10 text-slate-300";
  };
  
  return (
    <div className="mt-3">
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
                  "h-8 w-8 rounded-full grid place-items-center text-xs border",
                  getStatusColor(s, idx)
                ].join(" ")}
                title={s}
              >
                {idx + 1}
              </div>
              {idx !== STATUS_STEPS.length - 1 && (
                <div className={done ? "h-px w-8 bg-cyan-300/30" : "h-px w-8 bg-white/10"} />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-xs text-slate-400">
        Status: <span className="text-slate-100">{currentStatus || "Pending"}</span>
        <span className="ml-2 text-cyan-300">({progressPercent}%)</span>
      </div>
    </div>
  );
}
