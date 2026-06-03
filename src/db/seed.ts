import { db } from './db';
import { EXERCISES, DAY_TEMPLATES } from '../data/program';
import { todayISO } from '../lib/dates';

export async function seedIfEmpty(): Promise<void> {
  const exerciseCount = await db.exercises.count();
  if (exerciseCount === 0) {
    await db.exercises.bulkAdd(EXERCISES);
  }

  const templateCount = await db.dayTemplates.count();
  if (templateCount === 0) {
    await db.dayTemplates.bulkAdd(DAY_TEMPLATES);
  }

  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.add({
      units: 'kg',
      programStartDate: todayISO(),
      proteinPerKg: 1.8,
    });
  }
}
