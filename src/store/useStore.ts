import { create } from 'zustand';
import type { DayKey } from '../db/db';
import { dayKeyForDate } from '../lib/dates';
import { DEFAULT_REST_CHIME, type RestChimeMode } from '../lib/restChime';

interface RestTimerState {
  exerciseSlug: string;
  exerciseName: string;
  /** When the rest began (ms epoch) — used to show total time rested. */
  startedAt: number;
  endsAt: number;
  totalSeconds: number;
}

interface UIState {
  selectedDay: DayKey;
  setSelectedDay: (d: DayKey) => void;
  expandedExerciseSlug: string | null;
  setExpandedExerciseSlug: (slug: string | null) => void;

  units: 'kg' | 'lb';
  setUnits: (u: 'kg' | 'lb') => void;

  restChime: RestChimeMode;
  setRestChime: (m: RestChimeMode) => void;

  rest: RestTimerState | null;
  startRest: (input: { exerciseSlug: string; exerciseName: string; seconds: number }) => void;
  addRest: (seconds: number) => void;
  clearRest: () => void;
}

const initialDay: DayKey = dayKeyForDate() ?? 'tuesday';

export const useStore = create<UIState>((set, get) => ({
  selectedDay: initialDay,
  setSelectedDay: (d) => set({ selectedDay: d }),
  expandedExerciseSlug: null,
  setExpandedExerciseSlug: (slug) => set({ expandedExerciseSlug: slug }),

  units: 'kg',
  setUnits: (u) => set({ units: u }),

  restChime: DEFAULT_REST_CHIME,
  setRestChime: (m) => set({ restChime: m }),

  rest: null,
  startRest: ({ exerciseSlug, exerciseName, seconds }) => {
    const now = Date.now();
    set({
      rest: {
        exerciseSlug,
        exerciseName,
        startedAt: now,
        endsAt: now + seconds * 1000,
        totalSeconds: seconds,
      },
    });
  },
  addRest: (seconds) => {
    const cur = get().rest;
    if (!cur) return;
    set({
      rest: {
        ...cur,
        endsAt: cur.endsAt + seconds * 1000,
        totalSeconds: cur.totalSeconds + seconds,
      },
    });
  },
  clearRest: () => set({ rest: null }),
}));
