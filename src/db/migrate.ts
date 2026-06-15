import { db, type DayTemplate, type Session } from './db';
import { DAY_TEMPLATES, MERGED_EXERCISE_SLUGS } from '../data/program';

/**
 * One-time, idempotent data migration that brings an existing database in line
 * with the current program. It:
 *
 *  1. Merges duplicate exercises — remaps existing set logs, per-session swaps,
 *     and per-session exercise order from each retired slug to the surviving
 *     slug, then deletes the retired exercise definition.
 *  2. Ensures the active Tue/Thu/Sat day templates exist.
 *
 * Legacy Mon/Wed/Fri templates are intentionally kept so previously-logged
 * sessions stay labeled. The function only ever acts when stale data is found,
 * so it is safe to run on every startup (and after a JSON restore).
 */
export async function migrateProgram(): Promise<void> {
  await mergeDuplicateExercises();
  await ensureActiveDayTemplates();
}

async function mergeDuplicateExercises(): Promise<void> {
  for (const [oldSlug, newSlug] of Object.entries(MERGED_EXERCISE_SLUGS)) {
    // Remap set logs from the retired slug to the survivor.
    const staleLogs = await db.setLogs
      .where('exerciseSlug')
      .equals(oldSlug)
      .toArray();
    for (const log of staleLogs) {
      await db.setLogs.update(log.id!, { exerciseSlug: newSlug });
    }

    // Remap per-session swaps and exercise order.
    const sessions = await db.sessions.toArray();
    for (const s of sessions) {
      const patch: Partial<Session> = {};

      if (s.swaps && oldSlug in s.swaps) {
        const swaps = { ...s.swaps };
        if (!(newSlug in swaps)) swaps[newSlug] = swaps[oldSlug];
        delete swaps[oldSlug];
        patch.swaps = swaps;
      }

      if (s.exerciseOrder?.includes(oldSlug)) {
        patch.exerciseOrder = dedupe(
          s.exerciseOrder.map((slug) => (slug === oldSlug ? newSlug : slug)),
        );
      }

      if (Object.keys(patch).length > 0) {
        await db.sessions.update(s.id!, patch);
      }
    }

    // Fix any day templates still referencing the retired slug.
    const templates = await db.dayTemplates.toArray();
    for (const t of templates) {
      if (t.exerciseSlugs.includes(oldSlug)) {
        await db.dayTemplates.update(t.id!, {
          exerciseSlugs: dedupe(
            t.exerciseSlugs.map((slug) => (slug === oldSlug ? newSlug : slug)),
          ),
        });
      }
    }

    // Drop the now-merged exercise definition.
    const retired = await db.exercises.where('slug').equals(oldSlug).toArray();
    for (const ex of retired) {
      await db.exercises.delete(ex.id!);
    }
  }
}

async function ensureActiveDayTemplates(): Promise<void> {
  const existing = await db.dayTemplates.toArray();
  const keys = new Set(existing.map((t) => t.key));
  const missing = DAY_TEMPLATES.filter(
    (t) => !keys.has(t.key),
  ) as Omit<DayTemplate, 'id'>[];
  if (missing.length > 0) {
    await db.dayTemplates.bulkAdd(missing);
  }
}

function dedupe(slugs: string[]): string[] {
  return Array.from(new Set(slugs));
}
