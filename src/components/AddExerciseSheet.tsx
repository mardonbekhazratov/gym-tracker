import { useMemo, useState, type ReactNode } from 'react';
import type { Exercise, MuscleGroup } from '../db/db';
import type { NewExerciseInput } from '../db/queries';
import { Sheet } from './ui/Sheet';
import { TextField } from './ui/TextField';
import { NumberField } from './ui/NumberField';
import { Icon } from './Icon';

interface Props {
  library: Exercise[];
  /** Slugs already present in the current session — hidden from the library list. */
  existingSlugs: string[];
  onClose: () => void;
  onAddExisting: (slug: string) => void;
  onCreate: (input: NewExerciseInput) => void;
}

const MUSCLE_GROUPS: { value: MuscleGroup; label: string }[] = [
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

type Tab = 'library' | 'new';

export function AddExerciseSheet({
  library,
  existingSlugs,
  onClose,
  onAddExisting,
  onCreate,
}: Props) {
  const [tab, setTab] = useState<Tab>('library');

  // New-exercise form state (numbers kept as strings for NumberField).
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('chest');
  const [sets, setSets] = useState('3');
  const [repLow, setRepLow] = useState('8');
  const [repHigh, setRepHigh] = useState('12');
  const [rest, setRest] = useState('90');

  const existing = useMemo(() => new Set(existingSlugs), [existingSlugs]);
  const available = useMemo(
    () =>
      library
        .filter((e) => !existing.has(e.slug))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [library, existing],
  );

  const setsN = parseInt(sets, 10);
  const lowN = parseInt(repLow, 10);
  const highN = parseInt(repHigh, 10);
  const restN = parseInt(rest, 10);
  const canCreate =
    name.trim().length > 0 &&
    Number.isFinite(setsN) &&
    setsN >= 1 &&
    Number.isFinite(lowN) &&
    lowN >= 1 &&
    Number.isFinite(highN) &&
    highN >= lowN &&
    Number.isFinite(restN) &&
    restN >= 0;

  function handleCreate() {
    if (!canCreate) return;
    onCreate({
      name: name.trim(),
      muscleGroup,
      defaultSets: setsN,
      repLow: lowN,
      repHigh: highN,
      restSeconds: restN,
    });
  }

  return (
    <Sheet open onClose={onClose} eyebrow="Add exercise" title="To this session">
      <div className="px-3 pt-3 pb-5">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <TabButton active={tab === 'library'} onClick={() => setTab('library')}>
            From library
          </TabButton>
          <TabButton active={tab === 'new'} onClick={() => setTab('new')}>
            New exercise
          </TabButton>
        </div>

        {tab === 'library' && (
          <ul className="space-y-1.5">
            {available.length === 0 && (
              <li className="text-sm text-ink-400 px-2 py-6 text-center">
                Every exercise is already in this session.
              </li>
            )}
            {available.map((ex) => (
              <li key={ex.slug}>
                <button
                  type="button"
                  onClick={() => onAddExisting(ex.slug)}
                  className="tap w-full text-left rounded-xl px-4 py-3 border
                    bg-ink-800/40 border-transparent hover:bg-ink-800/70
                    flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="font-semibold text-ink-50 block truncate">
                      {ex.name}
                    </span>
                    <span className="block text-xs text-ink-400 mt-0.5 num">
                      {ex.defaultSets} × {ex.repLow}–{ex.repHigh}
                      {ex.custom && (
                        <span className="ml-1.5 text-[9px] font-bold tracking-[0.18em] text-ember-300">
                          CUSTOM
                        </span>
                      )}
                    </span>
                  </div>
                  <Icon name="plus" size={18} className="text-ember-400 shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {tab === 'new' && (
          <div className="space-y-3">
            <TextField
              eyebrow="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cable fly"
              autoFocus
            />

            <div>
              <p className="label-eyebrow mb-1.5">Muscle group</p>
              <div className="flex flex-wrap gap-1.5">
                {MUSCLE_GROUPS.map((m) => {
                  const active = m.value === muscleGroup;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMuscleGroup(m.value)}
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
                <NumberField value={sets} onChange={setSets} stepper min={1} />
              </div>
              <div>
                <p className="label-eyebrow mb-1">Rest (s)</p>
                <NumberField
                  value={rest}
                  onChange={setRest}
                  stepper
                  step={15}
                  min={0}
                />
              </div>
              <div>
                <p className="label-eyebrow mb-1">Reps (low)</p>
                <NumberField value={repLow} onChange={setRepLow} stepper min={1} />
              </div>
              <div>
                <p className="label-eyebrow mb-1">Reps (high)</p>
                <NumberField value={repHigh} onChange={setRepHigh} stepper min={1} />
              </div>
            </div>

            <button
              type="button"
              disabled={!canCreate}
              onClick={handleCreate}
              className="btn-primary w-full py-3.5 disabled:opacity-40"
            >
              <Icon name="plus" size={18} />
              Create &amp; add
            </button>
          </div>
        )}
      </div>
    </Sheet>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tap rounded-xl py-2.5 text-sm font-semibold border tracking-wide
        ${
          active
            ? 'bg-ember-500 text-white border-ember-500'
            : 'bg-ink-900/60 text-ink-200 border-ink-800'
        }`}
    >
      {children}
    </button>
  );
}
