import { useEffect, useState } from 'react';
import { weeklyVolume } from '../db/queries';
import { WEEKLY_VOLUME_TARGETS } from '../data/program';
import type { MuscleGroup } from '../db/db';
import { Icon } from './Icon';

const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  sideDelts: 'Side delts',
  rearDelts: 'Rear delts',
  triceps: 'Triceps',
  biceps: 'Biceps',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
  abs: 'Abs',
  shoulders: 'Shoulders',
};

function status(
  count: number,
  range?: [number, number],
): { color: string; label: string } {
  if (!range) {
    if (count === 0) return { color: 'bg-ink-700', label: '—' };
    return { color: 'bg-ink-500', label: 'tracked' };
  }
  const [low, high] = range;
  if (count <= 0) return { color: 'bg-rose-500/70', label: 'none' };
  if (count < low) return { color: 'bg-amber-500/80', label: 'low' };
  if (count > high) return { color: 'bg-rose-500/70', label: 'high' };
  return { color: 'bg-emerald-500/80', label: 'on target' };
}

interface Props {
  refreshKey?: number;
}

export function WeeklyVolume({ refreshKey }: Props) {
  const [counts, setCounts] = useState<Partial<Record<MuscleGroup, number>>>({});
  const [bounds, setBounds] = useState<{ from: string; to: string } | null>(null);

  useEffect(() => {
    void weeklyVolume().then(({ counts, from, to }) => {
      setCounts(counts);
      setBounds({ from, to });
    });
  }, [refreshKey]);

  const targeted = Object.keys(WEEKLY_VOLUME_TARGETS) as MuscleGroup[];
  const extra = (Object.keys(counts) as MuscleGroup[]).filter(
    (m) => !targeted.includes(m),
  );
  const all = [...targeted, ...extra];

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold text-ink-100 inline-flex items-center gap-2">
          <Icon name="target" size={16} className="text-ember-400" />
          Weekly volume
        </h2>
        {bounds && (
          <span className="text-[11px] text-ink-500 num">
            {bounds.from.slice(5)} – {bounds.to.slice(5)}
          </span>
        )}
      </div>
      <ul className="space-y-2">
        {all.map((m) => {
          const range = WEEKLY_VOLUME_TARGETS[m];
          const count = counts[m] ?? 0;
          const s = status(count, range);
          const target = range ? `${range[0]}–${range[1]}` : '—';
          const pct = range ? Math.min(100, (count / range[1]) * 100) : 0;
          return (
            <li key={m} className="text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ink-100">{MUSCLE_LABEL[m]}</span>
                <span className="text-ink-300 num">
                  {count}
                  <span className="text-ink-500"> / {target}</span>
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-ink-800/80 overflow-hidden">
                <div
                  className={`h-full ${s.color} transition-[width] duration-500 ease-out`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] text-ink-500 leading-snug">
        Targets from the program; evidence-based band is 10–20 sets/wk/muscle.
      </p>
    </div>
  );
}
