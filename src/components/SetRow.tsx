import { useEffect, useState } from 'react';
import type { SetLog } from '../db/db';
import { displayWeight, parseWeightToKg } from '../lib/units';
import { Icon } from './Icon';
import { NumberField } from './ui/NumberField';

export interface SetRowProps {
  setNumber: number;
  existing?: SetLog;
  ghost?: SetLog;
  units: 'kg' | 'lb';
  targetRepLow: number;
  targetRepHigh: number;
  /** When true, weight input is replaced by a BW tile and weight is auto-filled. */
  bodyweightOnly?: boolean;
  /** Latest bodyweight (kg) used as default weight for bodyweight-only exercises. */
  bodyweightKg?: number | null;
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
  bodyweightOnly = false,
  bodyweightKg,
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

  const canSave = bodyweightOnly
    ? reps.trim() !== ''
    : weight.trim() !== '' && reps.trim() !== '';

  async function commit() {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const w = bodyweightOnly
        ? existing?.weightKg ?? bodyweightKg ?? 0
        : parseWeightToKg(weight, units);
      const r = Math.max(0, parseInt(reps, 10) || 0);
      const rirNum = Math.max(0, Math.min(5, parseInt(rir, 10) || 0));
      await onSave({ weightKg: w, reps: r, rir: rirNum });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-[28px_1fr_1fr_1fr_auto] gap-2 items-center">
      <div className="text-ink-500 text-sm text-center num font-semibold">
        {setNumber}
      </div>

      {bodyweightOnly ? (
        <div
          className="field flex flex-col items-center justify-center gap-0 leading-none py-1.5 cursor-default select-none"
          aria-label="Bodyweight"
          title={
            bodyweightKg
              ? `Bodyweight ${displayWeight(bodyweightKg, units)} ${units}`
              : 'Bodyweight (set yours in Settings)'
          }
        >
          <span className="text-xs font-bold tracking-[0.18em] text-ember-300">BW</span>
          {bodyweightKg ? (
            <span className="text-[10px] text-ink-400 num">
              {displayWeight(bodyweightKg, units)} {units}
            </span>
          ) : (
            <span className="text-[10px] text-ink-500">—</span>
          )}
        </div>
      ) : (
        <NumberField
          value={weight}
          onChange={setWeight}
          onCommit={() => void commit()}
          placeholder={ghostWeight ?? '—'}
          suffix={units}
          step={2.5}
          ariaLabel="Weight"
        />
      )}

      <NumberField
        value={reps}
        onChange={setReps}
        onCommit={() => void commit()}
        placeholder={ghostReps ?? targetReps}
        suffix="reps"
        step={1}
        ariaLabel="Reps"
      />

      <NumberField
        value={rir}
        onChange={setRir}
        onCommit={() => void commit()}
        placeholder="RIR"
        suffix="rir"
        step={1}
        min={0}
        max={5}
        ariaLabel="RIR"
      />

      <button
        type="button"
        onClick={onDelete}
        disabled={!existing || !onDelete}
        className="tap text-ink-500 disabled:text-ink-700 px-2"
        aria-label="Delete set"
      >
        <Icon name="trash" size={16} />
      </button>
    </div>
  );
}
