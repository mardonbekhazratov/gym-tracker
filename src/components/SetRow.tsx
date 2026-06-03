import { useEffect, useState } from 'react';
import type { SetLog } from '../db/db';
import { displayWeight, parseWeightToKg } from '../lib/units';

export interface SetRowProps {
  setNumber: number;
  existing?: SetLog;
  ghost?: SetLog;
  units: 'kg' | 'lb';
  targetRepLow: number;
  targetRepHigh: number;
  onSave: (data: { weightKg: number; reps: number; rir: number }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function SetRow({
  setNumber,
  existing,
  ghost,
  units,
  targetRepLow,
  targetRepHigh,
  onSave,
  onDelete,
}: SetRowProps) {
  const [weight, setWeight] = useState<string>(
    existing ? displayWeight(existing.weightKg, units) : '',
  );
  const [reps, setReps] = useState<string>(
    existing ? String(existing.reps) : '',
  );
  const [rir, setRir] = useState<string>(
    existing ? String(existing.rir) : '2',
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setWeight(displayWeight(existing.weightKg, units));
      setReps(String(existing.reps));
      setRir(String(existing.rir));
    }
  }, [existing, units]);

  const ghostWeight = ghost ? displayWeight(ghost.weightKg, units) : null;
  const ghostReps = ghost ? String(ghost.reps) : null;
  const targetReps = `${targetRepLow}-${targetRepHigh}`;

  const canSave = weight.trim() !== '' && reps.trim() !== '';

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const w = parseWeightToKg(weight, units);
      const r = Math.max(0, parseInt(reps, 10) || 0);
      const rirNum = Math.max(0, Math.min(5, parseInt(rir, 10) || 0));
      await onSave({ weightKg: w, reps: r, rir: rirNum });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-[28px_1fr_1fr_1fr_auto] gap-2 items-center">
      <div className="text-slate-500 text-sm text-center">{setNumber}</div>

      <div className="relative">
        <input
          inputMode="decimal"
          type="number"
          step="0.5"
          placeholder={ghostWeight ?? '—'}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onBlur={handleSave}
          className="input"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
          {units}
        </span>
      </div>

      <div className="relative">
        <input
          inputMode="numeric"
          type="number"
          placeholder={ghostReps ?? targetReps}
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          onBlur={handleSave}
          className="input"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
          reps
        </span>
      </div>

      <div className="relative">
        <input
          inputMode="numeric"
          type="number"
          min={0}
          max={5}
          placeholder="RIR"
          value={rir}
          onChange={(e) => setRir(e.target.value)}
          onBlur={handleSave}
          className="input"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
          RIR
        </span>
      </div>

      <button
        type="button"
        onClick={onDelete}
        disabled={!existing || !onDelete}
        className="tap text-slate-500 disabled:text-slate-700 px-2"
        aria-label="Delete set"
      >
        ✕
      </button>
    </div>
  );
}
