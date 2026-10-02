// One-off test for the "auto-finish yesterday's session" rule.
// Run: node scripts/test-auto-complete.mjs
import assert from 'node:assert/strict';
import { sessionsToAutoComplete } from '../src/lib/autoComplete.ts';

// Deterministic day mapping for the test: timestamps are "day numbers" * 1000.
const dayOf = (ts) => `2026-10-${String(Math.floor(ts / 1000)).padStart(2, '0')}`;
const at = (day, extra = 0) => day * 1000 + extra;
const today = '2026-10-03';

const run = (sessions, logs) =>
  sessionsToAutoComplete(sessions, logs, today, dayOf).sort((a, b) => a - b);

// Open session whose last change was yesterday → finished.
assert.deepEqual(
  run([{ id: 1, completed: false }], [{ sessionId: 1, timestamp: at(2) }]),
  [1],
  'yesterday’s open session should auto-finish',
);

// Last change today → still being worked on, keep open.
assert.deepEqual(
  run([{ id: 1, completed: false }], [{ sessionId: 1, timestamp: at(3) }]),
  [],
  'session edited today stays open',
);

// The *latest* change decides: started yesterday, edited again today → open.
assert.deepEqual(
  run(
    [{ id: 1, completed: false }],
    [
      { sessionId: 1, timestamp: at(2) },
      { sessionId: 1, timestamp: at(3, 500) },
    ],
  ),
  [],
  'a change today keeps the session open',
);

// Backfilled session (dated in the past but logged today) waits until tomorrow.
assert.deepEqual(
  run([{ id: 7, completed: false, date: '2026-09-28' }], [{ sessionId: 7, timestamp: at(3) }]),
  [],
  'backfilled session logged today stays open until tomorrow',
);

// No logged sets (auto-created when you just looked at a day) → never finished.
assert.deepEqual(
  run([{ id: 1, completed: false }], []),
  [],
  'empty session is not auto-finished',
);

// Already completed → nothing to do.
assert.deepEqual(
  run([{ id: 1, completed: true }], [{ sessionId: 1, timestamp: at(1) }]),
  [],
  'completed session is left alone',
);

// Auto-finished once and then reopened by hand → respect the reopen.
assert.deepEqual(
  run(
    [{ id: 1, completed: false, autoCompleted: true }],
    [{ sessionId: 1, timestamp: at(1) }],
  ),
  [],
  'manually reopened session is not auto-finished again',
);

// Mixed batch: only the stale open one with logs is picked.
assert.deepEqual(
  run(
    [
      { id: 1, completed: false },
      { id: 2, completed: false },
      { id: 3, completed: true },
      { id: 4, completed: false },
    ],
    [
      { sessionId: 1, timestamp: at(1) },
      { sessionId: 2, timestamp: at(3) },
      { sessionId: 3, timestamp: at(1) },
      { sessionId: 9, timestamp: at(1) }, // orphan log, no session
    ],
  ),
  [1],
  'mixed batch picks only stale open sessions with logs',
);

console.log('auto-complete: all assertions passed');
