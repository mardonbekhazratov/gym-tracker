import { useMemo, useState, type ReactNode } from 'react';
import type { Exercise } from '../db/db';
import type { NewExerciseInput } from '../db/queries';
import { Sheet } from './ui/Sheet';
import { Icon } from './Icon';
import { ExerciseFields, draftFromExercise, parseDraft } from './ExerciseFields';

interface Props {
  library: Exercise[];
  /** Slugs already present in the current session — hidden from the library list. */
  existingSlugs: string[];
  onClose: () => void;
  onAddExisting: (slug: string) => void;
  onCreate: (input: NewExerciseInput) => void;
}

type Tab = 'library' | 'new';

export function AddExerciseSheet({
  library,
  existingSlugs,
  onClose,
  onAddExisting,
  onCreate,
}: Props) {
  const [tab, setTab] = useState<Tab>('library');

  const [draft, setDraft] = useState(() => draftFromExercise());

  const existing = useMemo(() => new Set(existingSlugs), [existingSlugs]);
  const available = useMemo(
    () =>
      library
        .filter((e) => !existing.has(e.slug))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [library, existing],
  );

  const parsed = parseDraft(draft);

  function handleCreate() {
    if (parsed.ok) onCreate(parsed.value);
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
            <ExerciseFields draft={draft} onChange={setDraft} autoFocusName />

            <button
              type="button"
              disabled={!parsed.ok}
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
