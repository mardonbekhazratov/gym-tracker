// Pure rule for arming the rest-over chime. Kept free of runtime imports so
// `node scripts/test-rest-chime.mjs` can load it directly.

/** Settings choice: chime only into headphones, on any output, or never. */
export type RestChimeMode = 'headphones' | 'always' | 'off';

export const DEFAULT_REST_CHIME: RestChimeMode = 'headphones';

export type RestChimeAction =
  | { type: 'schedule'; at: number; headphonesOnly: boolean }
  | { type: 'cancel' };

/**
 * What the native alarm should be, given the running rest timer's end time
 * (`null` when no timer) and the user's setting. Scheduling replaces any
 * earlier alarm, so this is re-evaluated whenever the end time or mode
 * changes (new set saved, +30s, Skip/Done, setting toggled). A timer that has
 * already run out cancels rather than chiming late.
 */
export function restChimeAction(
  endsAt: number | null,
  mode: RestChimeMode,
  now: number,
): RestChimeAction {
  if (endsAt === null || mode === 'off' || endsAt <= now) return { type: 'cancel' };
  return { type: 'schedule', at: endsAt, headphonesOnly: mode === 'headphones' };
}
