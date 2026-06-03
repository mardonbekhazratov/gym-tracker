import { db } from '../db/db';
import { seedIfEmpty } from '../db/seed';

export const BACKUP_VERSION = 1;

export interface BackupFile {
  app: 'workout-tracker';
  version: number;
  exportedAt: string;
  data: {
    exercises: unknown[];
    dayTemplates: unknown[];
    sessions: unknown[];
    setLogs: unknown[];
    bodyWeights: unknown[];
    settings: unknown[];
  };
}

export async function exportBackup(): Promise<BackupFile> {
  const [exercises, dayTemplates, sessions, setLogs, bodyWeights, settings] =
    await Promise.all([
      db.exercises.toArray(),
      db.dayTemplates.toArray(),
      db.sessions.toArray(),
      db.setLogs.toArray(),
      db.bodyWeights.toArray(),
      db.settings.toArray(),
    ]);

  return {
    app: 'workout-tracker',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: { exercises, dayTemplates, sessions, setLogs, bodyWeights, settings },
  };
}

export function triggerDownload(filename: string, json: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importBackup(file: BackupFile): Promise<void> {
  if (file.app !== 'workout-tracker') {
    throw new Error('Not a workout-tracker backup');
  }
  if (file.version !== BACKUP_VERSION) {
    throw new Error(`Unsupported backup version ${file.version}`);
  }
  await db.transaction(
    'rw',
    [
      db.exercises,
      db.dayTemplates,
      db.sessions,
      db.setLogs,
      db.bodyWeights,
      db.settings,
    ],
    async () => {
      await Promise.all([
        db.exercises.clear(),
        db.dayTemplates.clear(),
        db.sessions.clear(),
        db.setLogs.clear(),
        db.bodyWeights.clear(),
        db.settings.clear(),
      ]);
      await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        db.exercises.bulkAdd(file.data.exercises as any),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        db.dayTemplates.bulkAdd(file.data.dayTemplates as any),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        db.sessions.bulkAdd(file.data.sessions as any),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        db.setLogs.bulkAdd(file.data.setLogs as any),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        db.bodyWeights.bulkAdd(file.data.bodyWeights as any),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        db.settings.bulkAdd(file.data.settings as any),
      ]);
    },
  );
}

export async function resetAllData(): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.exercises,
      db.dayTemplates,
      db.sessions,
      db.setLogs,
      db.bodyWeights,
      db.settings,
    ],
    async () => {
      await Promise.all([
        db.exercises.clear(),
        db.dayTemplates.clear(),
        db.sessions.clear(),
        db.setLogs.clear(),
        db.bodyWeights.clear(),
        db.settings.clear(),
      ]);
    },
  );
  await seedIfEmpty();
}
