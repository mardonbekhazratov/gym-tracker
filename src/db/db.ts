import Dexie, { Table } from 'dexie';
import type { RestChimeMode } from '../lib/restChime';

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

/** Days the program is actively trained on. */
export type DayKey = 'tuesday' | 'thursday' | 'saturday';
/** Old day keys kept only so previously-logged sessions stay labeled. */
export type LegacyDayKey = 'monday' | 'wednesday' | 'friday';
/** Any day key that may appear in stored records (active or legacy). */
export type AnyDayKey = DayKey | LegacyDayKey;

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
  /** True for exercises the user created in-app (not part of the seed). */
  custom?: boolean;
}

export interface DayTemplate {
  id?: number;
  key: AnyDayKey;
  label: string;
  exerciseSlugs: string[];
}

export interface Session {
  id?: number;
  date: string;
  dayKey: AnyDayKey;
  notes?: string;
  completed: boolean;
  /**
   * Set when the app marked this session done on its own (the day after its
   * last set change). A session is only auto-finished once, so reopening it
   * by hand sticks. Not indexed — no schema version bump needed.
   */
  autoCompleted?: boolean;
  /** per-session exercise swaps: exerciseSlug → alternative display name. */
  swaps?: Record<string, string>;
  /**
   * Per-session ordered exercise slugs. When set, overrides the day template's
   * order for this session only (covers in-session reordering and added
   * exercises). Undefined means "use the template order".
   */
  exerciseOrder?: string[];
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
  /** Rest-over chime; missing on older rows → DEFAULT_REST_CHIME. */
  restChime?: RestChimeMode;
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
