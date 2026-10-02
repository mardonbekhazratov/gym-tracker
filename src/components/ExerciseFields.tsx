import type { Exercise, MuscleGroup } from '../db/db';
import type { NewExerciseInput } from '../db/queries';
import { TextField } from './ui/TextField';
import { NumberField } from './ui/NumberField';

export const MUSCLE_GROUPS: { value: MuscleGroup; label: string }[] = [
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'sideDelts', label: 'Side delts' },
  { value: 'rearDelts', label: 'Rear delts' },
  { value: 'triceps', label: 'Triceps' },
  { value: 'biceps', label: 'Biceps' },
  { value: 'quads', label: 'Quads' },
  { value: 'hamstrings', label: 'Hamstrings' },
  { value: 'calves', label: 'Calves' },
  { value: 'abs', label: 'Abs' },
];

/** Editable form state; numbers are kept as strings for NumberField. */
export interface ExerciseDraft {
  name: string;
  muscleGroup: MuscleGroup;
  sets: string;
  repLow: string;
  repHigh: string;
  rest: string;
}

export function draftFromExercise(e?: Exercise): ExerciseDraft {
  if (!e) {
    return { name: '', muscleGroup: 'chest', sets: '3', repLow: '8', repHigh: '12', rest: '90' };
  }
  return {
    name: e.name,
    muscleGroup: e.muscleGroup,
    sets: String(e.defaultSets),
    repLow: String(e.repLow),
    repHigh: String(e.repHigh),
    rest: String(e.restSeconds),
  };
}

/** Validate a draft. Returns the parsed values, or an error to show the user. */
export function parseDraft(
  d: ExerciseDraft,
): { ok: true; value: NewExerciseInput } | { ok: false; error: string } {
  const sets = parseInt(d.sets, 10);
  const low = parseInt(d.repLow, 10);
  const high = parseInt(d.repHigh, 10);
  const rest = parseInt(d.rest, 10);
  if (d.name.trim().length === 0) return { ok: false, error: 'Give it a name.' };
  if (!Number.isFinite(sets) || sets < 1) return { ok: false, error: 'At least 1 set.' };
  if (!Number.isFinite(low) || low < 1) return { ok: false, error: 'Reps (low) must be at least 1.' };
  if (!Number.isFinite(high) || high < low) {
    return { ok: false, error: 'Reps (high) can’t be below reps (low).' };
  }
  if (!Number.isFinite(rest) || rest < 0) return { ok: false, error: 'Rest can’t be negative.' };
  return {
    ok: true,
    value: {
      name: d.name.trim(),
      muscleGroup: d.muscleGroup,
      defaultSets: sets,
      repLow: low,
      repHigh: high,
      restSeconds: rest,
    },
  };
}

interface Props {
  draft: ExerciseDraft;
  onChange: (next: ExerciseDraft) => void;
  autoFocusName?: boolean;
}

/** Name, muscle group, sets, rep range and rest — shared by add & edit sheets. */
export function ExerciseFields({ draft, onChange, autoFocusName = false }: Props) {
  const set = <K extends keyof ExerciseDraft>(key: K, value: ExerciseDraft[K]) =>
    onChange({ ...draft, [key]: value });

  return (
    <div className="space-y-3">
      <TextField
        eyebrow="Name"
        value={draft.name}
        onChange={(e) => set('name', e.target.value)}
        placeholder="e.g. Cable fly"
        autoFocus={autoFocusName}
      />

      <div>
        <p className="label-eyebrow mb-1.5">Muscle group</p>
        <div className="flex flex-wrap gap-1.5">
          {MUSCLE_GROUPS.map((m) => {
            const active = m.value === draft.muscleGroup;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => set('muscleGroup', m.value)}
                className={`tap rounded-lg px-3 py-1.5 text-sm font-medium border
                  ${
                    active
                      ? 'bg-ember-500/15 border-ember-500/50 text-ink-50'
                      : 'bg-ink-800/40 border-ink-800 text-ink-300'
                  }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="label-eyebrow mb-1">Sets</p>
          <NumberField value={draft.sets} onChange={(v) => set('sets', v)} stepper min={1} />
        </div>
        <div>
          <p className="label-eyebrow mb-1">Rest (s)</p>
          <NumberField
            value={draft.rest}
            onChange={(v) => set('rest', v)}
            stepper
            step={15}
            min={0}
          />
        </div>
        <div>
          <p className="label-eyebrow mb-1">Reps (low)</p>
          <NumberField value={draft.repLow} onChange={(v) => set('repLow', v)} stepper min={1} />
        </div>
        <div>
          <p className="label-eyebrow mb-1">Reps (high)</p>
          <NumberField value={draft.repHigh} onChange={(v) => set('repHigh', v)} stepper min={1} />
        </div>
      </div>
    </div>
  );
}
