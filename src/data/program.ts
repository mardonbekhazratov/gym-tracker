import type { Exercise, DayTemplate, MuscleGroup } from '../db/db';

type SeedExercise = Omit<Exercise, 'id'>;

const ex = (
  slug: string,
  name: string,
  muscleGroup: MuscleGroup,
  defaultSets: number,
  repLow: number,
  repHigh: number,
  restSeconds: number,
  alternatives: string[],
): SeedExercise => ({
  slug,
  name,
  muscleGroup,
  defaultSets,
  repLow,
  repHigh,
  restSeconds,
  alternatives,
});

export const EXERCISES: SeedExercise[] = [
  // Monday — Upper (Push focus)
  ex('incline-db-press', 'Incline dumbbell press', 'chest', 3, 6, 10, 150, [
    'Incline barbell press',
    'Incline machine press',
    'Incline Smith machine press (30°–45°)',
  ]),
  ex('flat-bench-press', 'Flat bench press', 'chest', 3, 8, 10, 150, [
    'Flat dumbbell press',
    'Machine chest press',
    'Weighted dips (chest-leaning)',
  ]),
  ex('lat-pulldown', 'Lat pulldown', 'back', 3, 8, 12, 120, [
    'Pull-ups (band-assisted)',
    'Neutral-grip pulldown',
    'Kneeling cable pulldown',
  ]),
  ex('chest-supported-row', 'Chest-supported row', 'back', 3, 8, 12, 120, [
    'T-bar row',
    'Seal row',
    'Single-arm dumbbell row',
    'Smith machine row',
  ]),
  ex('db-lateral-raise', 'Lateral raises (dumbbell)', 'sideDelts', 4, 12, 15, 75, [
    'Cable lateral raise',
    'Machine lateral raise',
    'Leaning DB lateral raise',
  ]),
  ex('triceps-pushdown', 'Triceps pushdown', 'triceps', 3, 10, 12, 75, [
    'Overhead cable extension',
    'Skull crushers',
    'Close-grip bench',
    'Dips (triceps)',
  ]),

  // Wednesday — Lower
  ex('back-squat', 'Back squat', 'quads', 3, 6, 10, 180, [
    'Front squat',
    'Hack squat',
    'Smith machine squat',
    'Goblet squat',
  ]),
  ex('romanian-deadlift', 'Romanian deadlift', 'hamstrings', 3, 8, 10, 150, [
    'Dumbbell RDL',
    'Single-leg RDL',
    'Good morning',
    'Stiff-leg deadlift',
  ]),
  ex('leg-press', 'Leg press', 'quads', 2, 10, 12, 120, [
    'Hack squat',
    'Bulgarian split squat',
    'Walking lunges',
    'Pendulum squat',
  ]),
  ex('seated-leg-curl', 'Seated leg curl', 'hamstrings', 3, 10, 12, 90, [
    'Lying leg curl',
    'Standing single-leg curl',
    'Nordic curl',
  ]),
  ex('standing-calf-raise', 'Standing calf raise', 'calves', 3, 10, 15, 90, [
    'Seated calf raise',
    'Leg press calf raise',
    'Single-leg DB calf raise',
  ]),
  ex('hanging-leg-raise', 'Hanging leg raise', 'abs', 3, 10, 15, 60, [
    'Cable crunch',
    "Captain's chair leg raise",
    'Decline sit-ups',
    'Ab wheel rollout',
  ]),

  // Friday — Upper (Pull focus + arms)
  ex('weighted-pull-ups', 'Weighted pull-ups', 'back', 3, 6, 10, 150, [
    'Lat pulldown (heavy)',
    'Neutral-grip pull-up',
    'Assisted pull-up machine',
    'Chin-ups',
  ]),
  ex('overhead-press', 'Overhead press (barbell)', 'shoulders', 3, 6, 10, 150, [
    'Seated DB shoulder press',
    'Arnold press',
    'Machine shoulder press',
    'Push press',
  ]),
  ex('barbell-row', 'Barbell row', 'back', 3, 8, 10, 120, [
    'Pendlay row',
    'T-bar row',
    'Chest-supported row (heavy)',
    'Yates row',
  ]),
  ex('incline-db-press-f', 'Incline dumbbell press', 'chest', 3, 8, 12, 120, [
    'Incline barbell press',
    'Machine incline press',
    'Low-incline DB press',
  ]),
  ex('dumbbell-curl', 'Dumbbell curl', 'biceps', 3, 8, 12, 90, [
    'Barbell curl',
    'EZ-bar curl',
    'Incline DB curl',
    'Hammer curl',
    'Preacher curl',
  ]),
  ex('db-lateral-raise-f', 'Lateral raises (dumbbell)', 'sideDelts', 3, 12, 15, 75, [
    'Cable lateral raise',
    'Machine lateral raise',
    'Leaning DB lateral raise',
  ]),
  ex('rear-delt-flye', 'Rear delt flye (cable)', 'rearDelts', 3, 12, 15, 75, [
    'Reverse pec deck',
    'Bent-over DB rear delt flye',
    'Face pulls',
    'Band pull-aparts',
  ]),
];

export const DAY_TEMPLATES: Omit<DayTemplate, 'id'>[] = [
  {
    key: 'monday',
    label: 'Monday — Upper (Push focus)',
    exerciseSlugs: [
      'incline-db-press',
      'flat-bench-press',
      'lat-pulldown',
      'chest-supported-row',
      'db-lateral-raise',
      'triceps-pushdown',
    ],
  },
  {
    key: 'wednesday',
    label: 'Wednesday — Lower',
    exerciseSlugs: [
      'back-squat',
      'romanian-deadlift',
      'leg-press',
      'seated-leg-curl',
      'standing-calf-raise',
      'hanging-leg-raise',
    ],
  },
  {
    key: 'friday',
    label: 'Friday — Upper (Pull focus + arms)',
    exerciseSlugs: [
      'weighted-pull-ups',
      'overhead-press',
      'barbell-row',
      'incline-db-press-f',
      'dumbbell-curl',
      'db-lateral-raise-f',
      'rear-delt-flye',
    ],
  },
];

/**
 * Exercises typically performed at bodyweight only (no external load).
 * The set logger will hide the weight input and auto-fill weight = latest bodyweight.
 */
export const BODYWEIGHT_ONLY_SLUGS: ReadonlySet<string> = new Set([
  'hanging-leg-raise',
]);

export const SIX_RULES = [
  'Log every set; beat last session by +1 rep or +2.5 kg (progressive overload).',
  'Train at 0–2 RIR; only the last set of an exercise nears true failure.',
  'Protein 1.6–2.2 g/kg bodyweight daily (70 kg → 110–150 g). Non-negotiable.',
  'Sleep 7–9 h.',
  'Deload every 6–8 weeks: drop to ~60% load for one week.',
  'Run the program ≥12 weeks before changing anything.',
];

export const WEEKLY_VOLUME_TARGETS: Partial<Record<MuscleGroup, [number, number]>> = {
  chest: [9, 20],
  back: [9, 20],
  sideDelts: [7, 20],
  triceps: [3, 20],
  biceps: [3, 20],
  quads: [8, 20],
  hamstrings: [8, 20],
};
