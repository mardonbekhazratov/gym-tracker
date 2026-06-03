import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

function formatMMSS(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function RestTimer() {
  const rest = useStore((s) => s.rest);
  const addRest = useStore((s) => s.addRest);
  const clearRest = useStore((s) => s.clearRest);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!rest) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 250);
    return () => window.clearInterval(id);
  }, [rest]);

  if (!rest) return null;

  const remaining = (rest.endsAt - Date.now()) / 1000;
  const elapsed = rest.totalSeconds - remaining;
  const progress = Math.min(100, Math.max(0, (elapsed / rest.totalSeconds) * 100));
  const done = remaining <= 0;

  return (
    <div className="fixed left-3 right-3 bottom-[72px] z-30 pointer-events-none">
      <div
        className={`pointer-events-auto card flex items-center gap-3 px-3 py-2 shadow-2xl border ${
          done ? 'border-emerald-500/50' : 'border-brand-500/40'
        }`}
      >
        <div className="relative w-12 h-12 shrink-0">
          <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="rgb(30 41 59)"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke={done ? 'rgb(16 185 129)' : 'rgb(59 130 203)'}
              strokeWidth="3"
              strokeDasharray={2 * Math.PI * 15}
              strokeDashoffset={2 * Math.PI * 15 * (1 - progress / 100)}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-200"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums">
            {done ? 'GO' : formatMMSS(remaining)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">
            Rest
          </p>
          <p className="text-sm font-semibold text-slate-100 truncate">
            {rest.exerciseName}
          </p>
        </div>

        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            onClick={() => addRest(30)}
            className="tap rounded-lg bg-slate-800 text-slate-200 px-2 py-1 text-xs font-semibold"
          >
            +30s
          </button>
          <button
            type="button"
            onClick={clearRest}
            className="tap rounded-lg bg-slate-800 text-slate-200 px-2 py-1 text-xs font-semibold"
          >
            {done ? 'Done' : 'Skip'}
          </button>
        </div>
      </div>
    </div>
  );
}
