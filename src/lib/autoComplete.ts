// Pure rule for auto-finishing sessions the user forgot to close. Kept free of
// runtime imports so `node scripts/test-auto-complete.mjs` can load it directly.

export interface AutoCompleteSession {
  id?: number;
  completed: boolean;
  autoCompleted?: boolean;
}

export interface AutoCompleteLog {
  sessionId: number;
  timestamp: number;
}

/**
 * Ids of sessions that should be marked done automatically: still open, have
 * at least one logged set, and the most recent set change happened on a
 * calendar day before `today`. A session is only ever auto-finished once
 * (`autoCompleted`), so reopening it by hand sticks.
 *
 * `dayOf` maps a set-log timestamp to its local ISO date (YYYY-MM-DD).
 */
export function sessionsToAutoComplete(
  sessions: AutoCompleteSession[],
  logs: AutoCompleteLog[],
  today: string,
  dayOf: (timestamp: number) => string,
): number[] {
  const lastChange = new Map<number, number>();
  for (const l of logs) {
    const prev = lastChange.get(l.sessionId);
    if (prev == null || l.timestamp > prev) lastChange.set(l.sessionId, l.timestamp);
  }

  const ids: number[] = [];
  for (const s of sessions) {
    if (s.id == null || s.completed || s.autoCompleted) continue;
    const ts = lastChange.get(s.id);
    if (ts == null) continue;
    if (dayOf(ts) < today) ids.push(s.id);
  }
  return ids;
}
