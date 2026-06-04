import { create } from 'zustand';
import type { DayKey } from '../db/db';
import { dayKeyForDate } from '../lib/dates';

interface RestTimerState {
  exerciseSlug: string;
  exerciseName: string;
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

  rest: RestTimerState | null;
  startRest: (input: { exerciseSlug: string; exerciseName: string; seconds: number }) => void;
  addRest: (seconds: number) => void;
  clearRest: () => void;
}

const initialDay: DayKey = dayKeyForDate() ?? 'monday';

export const useStore = create<UIState>((set, get) => ({
  selectedDay: initialDay,
  setSelectedDay: (d) => set({ selectedDay: d }),
  expandedExerciseSlug: null,
  setExpandedExerciseSlug: (slug) => set({ expandedExerciseSlug: slug }),

  units: 'kg',
  setUnits: (u) => set({ units: u }),

  rest: null,
  startRest: ({ exerciseSlug, exerciseName, seconds }) =>
    set({
      rest: {
        exerciseSlug,
        exerciseName,
        endsAt: Date.now() + seconds * 1000,
        totalSeconds: seconds,
      },
    }),
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
