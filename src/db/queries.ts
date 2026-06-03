import { db, type SetLog, type Session, type DayKey } from './db';
import { todayISO } from '../lib/dates';

export async function getOrCreateSessionForToday(
  dayKey: DayKey,
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
