// Test for the "when should the rest-over chime be armed" rule.
// Run: node scripts/test-rest-chime.mjs
import assert from 'node:assert/strict';
import { restChimeAction } from '../src/lib/restChime.ts';

const now = 1_000_000;

// No rest timer running → make sure nothing is armed.
assert.deepEqual(restChimeAction(null, 'headphones', now), { type: 'cancel' }, 'no timer cancels');

// Timer running, default mode → chime at the end, only into headphones.
assert.deepEqual(
  restChimeAction(now + 90_000, 'headphones', now),
  { type: 'schedule', at: now + 90_000, headphonesOnly: true },
  'headphones mode schedules a headphones-only chime at endsAt',
);

// "Always" also plays on the phone speaker.
assert.deepEqual(
  restChimeAction(now + 90_000, 'always', now),
  { type: 'schedule', at: now + 90_000, headphonesOnly: false },
  'always mode schedules a chime on any output',
);

// Chime turned off → cancel even while a timer runs (e.g. toggled mid-rest).
assert.deepEqual(restChimeAction(now + 90_000, 'off', now), { type: 'cancel' }, 'off cancels');

// Timer already in overtime → the moment has passed, don't fire late.
assert.deepEqual(restChimeAction(now, 'always', now), { type: 'cancel' }, 'ended timer cancels');
assert.deepEqual(
  restChimeAction(now - 5_000, 'headphones', now),
  { type: 'cancel' },
  'overtime timer cancels',
);

console.log('rest-chime: all assertions passed');
