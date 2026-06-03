import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Exercise, SetLog } from '../db/db';
import {
  deleteSetLog,
  lastSessionForExercise,
  setsForSessionAndExercise,
  upsertSetLog,
} from '../db/queries';
import { SetRow } from './SetRow';
import { displayWeight } from '../lib/units';
import { useStore } from '../store/useStore';

interface Props {
  exercise: Exercise;
  sessionId: number;
  units: 'kg' | 'lb';
  expanded: boolean;
  onToggle: () => void;
  triggerRest?: boolean;
}

export function ExerciseCard({
  exercise,
  sessionId,
  units,
  expanded,
  onToggle,
  triggerRest = true,
}: Props) {
  const [sets, setSets] = useState<SetLog[]>([]);
  const [ghostSets, setGhostSets] = useState<SetLog[]>([]);
  const [ghostDate, setGhostDate] = useState<string | null>(null);
  const [extraSets, setExtraSets] = useState(0);
  const startRest = useStore((s) => s.startRest);

  const refresh = useCallback(async () => {
    const current = await setsForSessionAndExercise(sessionId, exercise.slug);
    setSets(current);
    const ghost = await lastSessionForExercise(exercise.slug);
    if (ghost) {
      setGhostSets(ghost.sets);
      setGhostDate(ghost.session.date);
    } else {
      setGhostSets([]);
      setGhostDate(null);
    }
  }, [sessionId, exercise.slug]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const totalRows = useMemo(() => {
    return Math.max(exercise.defaultSets + extraSets, sets.length);
  }, [exercise.defaultSets, extraSets, sets.length]);

  const completedSets = sets.length;

  const topSet = useMemo<SetLog | null>(() => {
    if (sets.length === 0) return null;
    return sets.reduce((best, s) =>
      s.weightKg > best.weightKg ||
      (s.weightKg === best.weightKg && s.reps > best.reps)
        ? s
        : best,
    sets[0]);
  }, [sets]);

  async function handleSave(
    setNumber: number,
    existing: SetLog | undefined,
    data: { weightKg: number; reps: number; rir: number },
  ) {
    if (data.weightKg <= 0 || data.reps <= 0) return;
    if (
      existing &&
      existing.weightKg === data.weightKg &&
      existing.reps === data.reps &&
      existing.rir === data.rir
    ) {
      return;
    }
    await upsertSetLog({
      id: existing?.id,
      sessionId,
      exerciseSlug: exercise.slug,
      setNumber,
      weightKg: data.weightKg,
      reps: data.reps,
      rir: data.rir,
    });
    if (triggerRest) {
      startRest({
        exerciseSlug: exercise.slug,
        exerciseName: exercise.name,
        seconds: exercise.restSeconds,
      });
    }
    await refresh();
  }

  async function handleDelete(id: number) {
    await deleteSetLog(id);
    await refresh();
  }

  return (
    <section className="card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="tap w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-100 truncate">
            {exercise.name}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {exercise.defaultSets} × {exercise.repLow}–{exercise.repHigh} ·{' '}
            {exercise.restSeconds}s rest
            {topSet && (
              <>
                {' · '}
                <span className="text-slate-300">
                  top {displayWeight(topSet.weightKg, units)}
                  {units} × {topSet.reps}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`text-xs rounded-full px-2 py-0.5 ${
              completedSets >= exercise.defaultSets
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {completedSets}/{exercise.defaultSets}
          </span>
          <span
            className={`text-slate-400 transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
          >
            ▾
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-4 pt-1 border-t border-slate-800 space-y-2">
          {ghostDate && (
            <p className="text-[11px] text-slate-500 px-1">
              Last session {ghostDate} — beat it.
            </p>
          )}

          <div className="grid grid-cols-[28px_1fr_1fr_1fr_auto] gap-2 px-1 pb-1 text-[10px] uppercase tracking-wider text-slate-500">
            <span></span>
            <span className="text-center">Weight</span>
            <span className="text-center">Reps</span>
            <span className="text-center">RIR</span>
            <span></span>
          </div>

          {Array.from({ length: totalRows }).map((_, i) => {
            const setNumber = i + 1;
            const existing = sets.find((s) => s.setNumber === setNumber);
            const ghost = ghostSets.find((g) => g.setNumber === setNumber);
            return (
              <SetRow
                key={setNumber}
                setNumber={setNumber}
                existing={existing}
                ghost={ghost}
                units={units}
                targetRepLow={exercise.repLow}
                targetRepHigh={exercise.repHigh}
                onSave={(data) => handleSave(setNumber, existing, data)}
                onDelete={
                  existing ? () => handleDelete(existing.id!) : undefined
                }
              />
            );
          })}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              className="btn-ghost flex-1"
              onClick={() => setExtraSets((n) => n + 1)}
            >
              + Add set
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
