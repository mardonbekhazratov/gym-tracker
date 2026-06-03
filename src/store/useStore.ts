import { create } from 'zustand';
import type { DayKey } from '../db/db';
import { dayKeyForDate } from '../lib/dates';

interface UIState {
  selectedDay: DayKey;
  setSelectedDay: (d: DayKey) => void;
  expandedExerciseSlug: string | null;
  setExpandedExerciseSlug: (slug: string | null) => void;
}

const initialDay: DayKey = dayKeyForDate() ?? 'monday';

export const useStore = create<UIState>((set) => ({
  selectedDay: initialDay,
  setSelectedDay: (d) => set({ selectedDay: d, expandedExerciseSlug: null }),
  expandedExerciseSlug: null,
  setExpandedExerciseSlug: (slug) => set({ expandedExerciseSlug: slug }),
}));
