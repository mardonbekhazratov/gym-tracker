import Dexie, { Table } from 'dexie';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'sideDelts'
  | 'rearDelts'
  | 'triceps'
  | 'biceps'
  | 'quads'
  | 'hamstrings'
  | 'calves'
  | 'abs'
  | 'shoulders';

export type DayKey = 'monday' | 'wednesday' | 'friday';

export interface Exercise {
  id?: number;
  slug: string;
  name: string;
  muscleGroup: MuscleGroup;
  defaultSets: number;
  repLow: number;
  repHigh: number;
  restSeconds: number;
  alternatives: string[];
}

export interface DayTemplate {
  id?: number;
  key: DayKey;
  label: string;
  exerciseSlugs: string[];
}

export interface Session {
  id?: number;
  date: string;
  dayKey: DayKey;
  notes?: string;
  completed: boolean;
  /** per-session exercise swaps: exerciseSlug → alternative display name. */
  swaps?: Record<string, string>;
}

export interface SetLog {
  id?: number;
  sessionId: number;
  exerciseSlug: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  rir: number;
  timestamp: number;
}

export interface BodyWeight {
  id?: number;
  date: string;
  weightKg: number;
}

export interface Settings {
  id?: number;
  units: 'kg' | 'lb';
  programStartDate: string;
  lastDeloadDate?: string;
  proteinPerKg: number;
  bodyweightForProteinKg?: number;
}

export class AppDB extends Dexie {
  exercises!: Table<Exercise, number>;
  dayTemplates!: Table<DayTemplate, number>;
  sessions!: Table<Session, number>;
  setLogs!: Table<SetLog, number>;
  bodyWeights!: Table<BodyWeight, number>;
  settings!: Table<Settings, number>;

  constructor() {
    super('workoutTrackerDB');
    this.version(1).stores({
      exercises: '++id, slug, muscleGroup',
      dayTemplates: '++id, key',
      sessions: '++id, date, dayKey',
      setLogs: '++id, sessionId, exerciseSlug',
      bodyWeights: '++id, date',
      settings: '++id',
    });
  }
}

export const db = new AppDB();
