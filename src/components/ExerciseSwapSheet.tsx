import { useEffect } from 'react';
import type { Exercise } from '../db/db';

interface Props {
  exercise: Exercise;
  current: string | null;
  onClose: () => void;
  onSelect: (alternative: string | null) => void;
}

export function ExerciseSwapSheet({
  exercise,
  current,
  onClose,
  onSelect,
}: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-slate-950/70"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Swap ${exercise.name}`}
        className="absolute bottom-0 inset-x-0 rounded-t-2xl bg-slate-900 border-t border-slate-800 pb-[env(safe-area-inset-bottom)] max-h-[80vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-slate-900 px-4 pt-3 pb-2 border-b border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              Swap exercise
            </p>
            <p className="font-semibold">{exercise.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tap text-slate-400 p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <ul className="p-2 space-y-1">
          <li>
            <button
              type="button"
              onClick={() => {
                onSelect(null);
                onClose();
              }}
              className={`tap w-full text-left rounded-xl px-3 py-3 ${
                current == null
                  ? 'bg-brand-500/20 border border-brand-500/40'
                  : 'bg-slate-800/60 border border-transparent'
              }`}
            >
              <span className="font-semibold">Use as written</span>
              <span className="block text-xs text-slate-400 mt-0.5">
                {exercise.name}
              </span>
            </button>
          </li>
          {exercise.alternatives.map((alt) => (
            <li key={alt}>
              <button
                type="button"
                onClick={() => {
                  onSelect(alt);
                  onClose();
                }}
                className={`tap w-full text-left rounded-xl px-3 py-3 ${
                  current === alt
                    ? 'bg-brand-500/20 border border-brand-500/40'
                    : 'bg-slate-800/60 border border-transparent'
                }`}
              >
                <span className="font-semibold">{alt}</span>
                <span className="block text-xs text-slate-400 mt-0.5">
                  Logs under {exercise.name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
