import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Exercise, SetLog } from '../db/db';
import {
  deleteSetLog,
  lastSessionForExercise,
  setsForSessionAndExercise,
  upsertSetLog,
} from '../db/queries';
import { SetRow } from './SetRow';
import { Icon } from './Icon';
import { displayWeight } from '../lib/units';
import { useStore } from '../store/useStore';
import { BODYWEIGHT_ONLY_SLUGS } from '../data/program';

interface Props {
  exercise: Exercise;
  sessionId: number;
  sessionDate: string;
  units: 'kg' | 'lb';
  expanded: boolean;
  onToggle: () => void;
  triggerRest?: boolean;
  swappedTo?: string | null;
  onOpenSwap?: () => void;
  bodyweightKg?: number | null;
}

export function ExerciseCard({
  exercise,
  sessionId,
  sessionDate,
  units,
  expanded,
  onToggle,
  triggerRest = true,
  swappedTo,
  onOpenSwap,
  bodyweightKg,
}: Props) {
  const [sets, setSets] = useState<SetLog[]>([]);
  const [ghostSets, setGhostSets] = useState<SetLog[]>([]);
  const [ghostDate, setGhostDate] = useState<string | null>(null);
  const [extraSets, setExtraSets] = useState(0);
  const startRest = useStore((s) => s.startRest);

  const bodyweightOnly = BODYWEIGHT_ONLY_SLUGS.has(exercise.slug);

  const refresh = useCallback(async () => {
    const current = await setsForSessionAndExercise(sessionId, exercise.slug);
    setSets(current);
    const ghost = await lastSessionForExercise(exercise.slug, sessionDate);
    if (ghost) {
      setGhostSets(ghost.sets);
      setGhostDate(ghost.session.date);
    } else {
      setGhostSets([]);
      setGhostDate(null);
    }
  }, [sessionId, exercise.slug, sessionDate]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const totalRows = useMemo(() => {
    return Math.max(exercise.defaultSets + extraSets, sets.length);
  }, [exercise.defaultSets, extraSets, sets.length]);

  const completedSets = sets.length;
  const done = completedSets >= exercise.defaultSets;

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
    if (data.reps <= 0) return;
    if (!bodyweightOnly && data.weightKg <= 0) return;
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
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={onToggle}
          className="tap flex-1 flex items-center justify-between px-4 py-3 text-left min-w-0"
        >
          <div className="min-w-0">
            <h3 className="font-semibold text-ink-50 truncate text-[15px] tracking-tighter- inline-flex items-center gap-1.5">
              {swappedTo ?? exercise.name}
              {bodyweightOnly && (
                <span className="text-[9px] font-bold tracking-[0.18em] text-ember-300 bg-ember-500/10 border border-ember-500/30 rounded px-1.5 py-0.5">
                  BW
                </span>
              )}
            </h3>
            <p className="text-xs text-ink-400 mt-0.5 truncate">
              {swappedTo && (
                <span className="text-amber-300/90 mr-1">
                  swap · for {exercise.name} ·{' '}
                </span>
              )}
              <span className="num">
                {exercise.defaultSets} × {exercise.repLow}–{exercise.repHigh}
              </span>
              <span className="inline-flex items-center gap-1 ml-1.5 text-ink-500">
                <Icon name="clock" size={11} />
                <span className="num">{exercise.restSeconds}s</span>
              </span>
              {topSet && !bodyweightOnly && (
                <>
                  {' · '}
                  <span className="text-ink-200 num">
                    top {displayWeight(topSet.weightKg, units)}
                    {units} × {topSet.reps}
                  </span>
                </>
              )}
              {topSet && bodyweightOnly && (
                <>
                  {' · '}
                  <span className="text-ink-200 num">top {topSet.reps} reps</span>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span
              className={`text-[11px] num rounded-full px-2 py-0.5 font-semibold tracking-wide
                ${
                  done
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-ink-800 text-ink-300'
                }`}
            >
              {completedSets}/{exercise.defaultSets}
            </span>
            <span
              className={`text-ink-400 transition-transform duration-200 ${
                expanded ? 'rotate-180' : ''
              }`}
            >
              <Icon name="chevron-down" size={18} />
            </span>
          </div>
        </button>
        {onOpenSwap && (
          <button
            type="button"
            onClick={onOpenSwap}
            className="tap px-3 text-ink-400 active:text-ink-100 border-l border-ink-800"
            aria-label="Swap exercise"
            title="Swap exercise"
          >
            <Icon name="swap" size={18} />
          </button>
        )}
      </div>

      {expanded && (
        <div className="px-3 pb-4 pt-2 border-t border-ink-800 space-y-2">
          {ghostDate && (
            <p className="text-[11px] text-ink-500 px-1 inline-flex items-center gap-1.5">
              <Icon name="history" size={12} />
              Last session {ghostDate} — beat it.
            </p>
          )}

          <div className="grid grid-cols-[28px_1fr_1fr_1fr_auto] gap-2 px-1 pb-1 label-eyebrow">
            <span></span>
            <span className="text-center">
              {bodyweightOnly ? 'Body' : 'Weight'}
            </span>
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
                bodyweightOnly={bodyweightOnly}
                bodyweightKg={bodyweightKg}
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
              <Icon name="plus" size={16} />
              Add set
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
