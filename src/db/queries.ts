import {
  db,
  type BodyWeight,
  type SetLog,
  type Session,
  type AnyDayKey,
  type Exercise,
  type MuscleGroup,
} from './db';
import { todayISO } from '../lib/dates';

export async function getOrCreateSessionForToday(
  dayKey: AnyDayKey,
  date: string = todayISO(),
): Promise<Session> {
  const existing = await db.sessions
    .where({ date })
    .and((s) => s.dayKey === dayKey)
    .first();
  if (existing) return existing;
  const id = await db.sessions.add({
    date,
    dayKey,
    completed: false,
  });
  return (await db.sessions.get(id))!;
}

export async function setsForSession(sessionId: number): Promise<SetLog[]> {
  return db.setLogs.where('sessionId').equals(sessionId).sortBy('setNumber');
}

export async function setsForSessionAndExercise(
  sessionId: number,
  exerciseSlug: string,
): Promise<SetLog[]> {
  const all = await db.setLogs.where('sessionId').equals(sessionId).toArray();
  return all
    .filter((s) => s.exerciseSlug === exerciseSlug)
    .sort((a, b) => a.setNumber - b.setNumber);
}

export async function lastSessionForExercise(
  exerciseSlug: string,
  beforeDate: string = todayISO(),
): Promise<{ session: Session; sets: SetLog[] } | null> {
  const logs = await db.setLogs
    .where('exerciseSlug')
    .equals(exerciseSlug)
    .toArray();
  if (logs.length === 0) return null;

  const sessionIds = Array.from(new Set(logs.map((l) => l.sessionId)));
  const sessions = await db.sessions.bulkGet(sessionIds);
  const prior = sessions
    .filter((s): s is Session => !!s && s.date < beforeDate)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  if (prior.length === 0) return null;
  const last = prior[0];
  const sets = logs
    .filter((l) => l.sessionId === last.id)
    .sort((a, b) => a.setNumber - b.setNumber);
  return { session: last, sets };
}

export async function upsertSetLog(
  partial: Omit<SetLog, 'id' | 'timestamp'> & { id?: number },
): Promise<number> {
  const row: SetLog = {
    ...partial,
    timestamp: Date.now(),
  };
  if (partial.id != null) {
    await db.setLogs.put({ ...row, id: partial.id });
    return partial.id;
  }
  return (await db.setLogs.add(row)) as number;
}

export async function deleteSetLog(id: number): Promise<void> {
  await db.setLogs.delete(id);
}

export async function markSessionCompleted(
  sessionId: number,
  completed = true,
): Promise<void> {
  await db.sessions.update(sessionId, { completed });
}

export async function updateSessionNotes(
  sessionId: number,
  notes: string,
): Promise<void> {
  await db.sessions.update(sessionId, { notes });
}

export async function setSessionSwap(
  sessionId: number,
  exerciseSlug: string,
  alternative: string | null,
): Promise<Session | undefined> {
  const sess = await db.sessions.get(sessionId);
  if (!sess) return undefined;
  const swaps = { ...(sess.swaps ?? {}) };
  if (alternative) swaps[exerciseSlug] = alternative;
  else delete swaps[exerciseSlug];
  await db.sessions.update(sessionId, { swaps });
  return db.sessions.get(sessionId);
}

export async function setSessionExerciseOrder(
  sessionId: number,
  exerciseSlugs: string[],
): Promise<Session | undefined> {
  await db.sessions.update(sessionId, { exerciseOrder: exerciseSlugs });
  return db.sessions.get(sessionId);
}

export interface NewExerciseInput {
  name: string;
  muscleGroup: MuscleGroup;
  defaultSets: number;
  repLow: number;
  repHigh: number;
  restSeconds: number;
}

/** Turn a display name into a URL-ish slug, e.g. "Cable Fly!" → "cable-fly". */
function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'exercise'
  );
}

/**
 * Create a user-defined exercise, generating a slug unique among existing
 * exercises. Returns the persisted row (with its id and final slug).
 */
export async function createExercise(input: NewExerciseInput): Promise<Exercise> {
  const existing = await db.exercises.toArray();
  const taken = new Set(existing.map((e) => e.slug));
  const base = slugify(input.name);
  let slug = base;
  let n = 2;
  while (taken.has(slug)) {
    slug = `${base}-${n++}`;
  }
  const row: Exercise = {
    slug,
    name: input.name.trim(),
    muscleGroup: input.muscleGroup,
    defaultSets: input.defaultSets,
    repLow: input.repLow,
    repHigh: input.repHigh,
    restSeconds: input.restSeconds,
    alternatives: [],
    custom: true,
  };
  const id = (await db.exercises.add(row)) as number;
  return { ...row, id };
}

export async function recordBodyWeight(
  date: string,
  weightKg: number,
): Promise<void> {
  const existing = await db.bodyWeights.where('date').equals(date).first();
  if (existing) {
    await db.bodyWeights.update(existing.id!, { weightKg });
  } else {
    await db.bodyWeights.add({ date, weightKg });
  }
}

export async function allBodyWeights(): Promise<BodyWeight[]> {
  const rows = await db.bodyWeights.toArray();
  return rows.sort((a, b) => (a.date < b.date ? -1 : 1));
}

export async function latestBodyWeight(): Promise<BodyWeight | null> {
  const rows = await allBodyWeights();
  return rows.length > 0 ? rows[rows.length - 1] : null;
}

export interface ExerciseHistoryPoint {
  date: string;
  topWeightKg: number;
  topReps: number;
  est1RM: number;
}

export async function exerciseHistory(
  exerciseSlug: string,
): Promise<ExerciseHistoryPoint[]> {
  const { epley1RM } = await import('../lib/epley');
  const logs = await db.setLogs
    .where('exerciseSlug')
    .equals(exerciseSlug)
    .toArray();
  if (logs.length === 0) return [];
  const sessionIds = Array.from(new Set(logs.map((l) => l.sessionId)));
  const sessions = await db.sessions.bulkGet(sessionIds);
  const sessionById = new Map<number, Session>();
  for (const s of sessions) if (s?.id != null) sessionById.set(s.id, s);

  const byDate = new Map<string, SetLog[]>();
  for (const l of logs) {
    const sess = sessionById.get(l.sessionId);
    if (!sess) continue;
    const arr = byDate.get(sess.date) ?? [];
    arr.push(l);
    byDate.set(sess.date, arr);
  }

  const points: ExerciseHistoryPoint[] = [];
  for (const [date, sets] of byDate) {
    const top = sets.reduce((best, s) => {
      const e = epley1RM(s.weightKg, s.reps);
      const b = epley1RM(best.weightKg, best.reps);
      return e > b ? s : best;
    });
    points.push({
      date,
      topWeightKg: top.weightKg,
      topReps: top.reps,
      est1RM: epley1RM(top.weightKg, top.reps),
    });
  }
  return points.sort((a, b) => (a.date < b.date ? -1 : 1));
}

export async function listSessions(): Promise<Session[]> {
  const rows = await db.sessions.toArray();
  return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
}

function isoWeekBounds(ref: Date = new Date()): { from: string; to: string } {
  const monday = new Date(ref);
  const dow = monday.getDay(); // 0=Sun, 1=Mon
  const offset = (dow + 6) % 7; // days since Monday
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - offset);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  return { from: todayISO(monday), to: todayISO(sunday) };
}

export async function weeklyVolume(
  ref: Date = new Date(),
): Promise<{ counts: Partial<Record<MuscleGroup, number>>; from: string; to: string }> {
  const { from, to } = isoWeekBounds(ref);
  const sessions = await db.sessions.toArray();
  const inWeek = sessions.filter((s) => s.date >= from && s.date <= to);
  if (inWeek.length === 0) return { counts: {}, from, to };

  const sessionIds = new Set(inWeek.map((s) => s.id!));
  const allLogs = await db.setLogs.toArray();
  const weekLogs = allLogs.filter((l) => sessionIds.has(l.sessionId));

  const exercises = await db.exercises.toArray();
  const muscleBySlug = new Map<string, MuscleGroup>(
    exercises.map((e) => [e.slug, e.muscleGroup]),
  );

  const counts: Partial<Record<MuscleGroup, number>> = {};
  for (const l of weekLogs) {
    const mg = muscleBySlug.get(l.exerciseSlug);
    if (!mg) continue;
    counts[mg] = (counts[mg] ?? 0) + 1;
  }
  return { counts, from, to };
}
