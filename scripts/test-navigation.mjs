// One-off test for the Android back-button routing decision.
// Run: node scripts/test-navigation.mjs
import assert from 'node:assert/strict';
import { decideBackAction, isTabRoot, TAB_ROOTS } from '../src/lib/navigation.ts';

// The Today tab is home: back exits the app.
assert.equal(decideBackAction('/'), 'exit', 'home tab should exit');

// Other top-level tabs return to the Today tab, never exit.
for (const p of ['/history', '/progress', '/settings']) {
  assert.equal(decideBackAction(p), 'home', `${p} should go home, not exit`);
}

// Deeper routes navigate back one step (e.g. session detail -> history list).
assert.equal(decideBackAction('/history/123'), 'back', 'session detail should go back');
assert.equal(decideBackAction('/history/abc'), 'back', 'session detail should go back');

// Unknown / trailing-slash paths are treated as deeper routes (never surprise-exit).
assert.equal(decideBackAction('/nope'), 'back', 'unknown path should go back');
assert.equal(decideBackAction('/history/123/'), 'back', 'trailing-slash detail should go back');

// isTabRoot sanity.
for (const p of TAB_ROOTS) assert.equal(isTabRoot(p), true, `${p} is a tab root`);
assert.equal(isTabRoot('/history/123'), false, 'detail is not a tab root');

console.log('navigation: all assertions passed');
