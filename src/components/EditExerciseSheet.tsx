import { useEffect, useState } from 'react';
import type { Exercise } from '../db/db';
import {
  countSetLogsForExercise,
  deleteExercise,
  updateExercise,
} from '../db/queries';
import { Sheet } from './ui/Sheet';
import { TextField } from './ui/TextField';
import { useConfirm } from './ui/ConfirmDialog';
import { Icon } from './Icon';
import { ExerciseFields, draftFromExercise, parseDraft } from './ExerciseFields';

interface Props {
  exercise: Exercise;
  onClose: () => void;
  onSaved: (updated: Exercise) => void;
  onDeleted: (slug: string) => void;
}

/**
 * Edit an exercise's library definition: name, muscle group, default sets,
 * rep range, rest time and swap alternatives. Applies everywhere the exercise
 * is used; logged sets are untouched. Never-logged exercises can be deleted.
 */
export function EditExerciseSheet({ exercise, onClose, onSaved, onDeleted }: Props) {
  const confirm = useConfirm();
  const [draft, setDraft] = useState(() => draftFromExercise(exercise));
  const [alternatives, setAlternatives] = useState<string[]>(exercise.alternatives);
  const [newAlt, setNewAlt] = useState('');
  const [logCount, setLogCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void countSetLogsForExercise(exercise.slug).then(setLogCount);
  }, [exercise.slug]);

  const parsed = parseDraft(draft);

  /** Alternatives including whatever is still typed in the "add" box. */
  function withPendingAlt(list: string[]): string[] {
    const v = newAlt.trim();
    return v && !list.includes(v) ? [...list, v] : list;
  }

  function addAlternative() {
    setAlternatives((list) => withPendingAlt(list));
    setNewAlt('');
  }

  async function handleSave() {
    if (!parsed.ok || saving) return;
    setSaving(true);
    try {
      const updated = await updateExercise(exercise.id!, {
        ...parsed.value,
        alternatives: withPendingAlt(alternatives),
      });
      if (updated) onSaved(updated);
      onClose();
    } catch (e) {
      setError(`Save failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: `Delete ${exercise.name}?`,
      body: 'It will be removed from the library and from every program day. This cannot be undone.',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await deleteExercise(exercise.slug);
      onDeleted(exercise.slug);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <Sheet open onClose={onClose} eyebrow="Edit exercise" title={exercise.name}>
      <div className="px-3 pt-3 pb-5 space-y-4">
        <p className="text-xs text-ink-400 px-1 leading-relaxed">
          Changes apply to every session that uses this exercise. Sets you’ve
          already logged stay as they are.
        </p>

        <ExerciseFields draft={draft} onChange={setDraft} />

        <div>
          <p className="label-eyebrow mb-1.5">Swap alternatives</p>
          {alternatives.length === 0 ? (
            <p className="text-xs text-ink-500 mb-2">None yet.</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5 mb-2">
              {alternatives.map((alt) => (
                <li
                  key={alt}
                  className="inline-flex items-center gap-0.5 rounded-lg pl-3 pr-0.5 text-sm
                    bg-ink-800/40 border border-ink-800 text-ink-200"
                >
                  {alt}
                  <button
                    type="button"
                    onClick={() => setAlternatives((list) => list.filter((a) => a !== alt))}
                    aria-label={`Remove ${alt}`}
                    className="w-8 h-8 grid place-items-center text-ink-400 active:text-ink-100"
                  >
                    <Icon name="close" size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <div className="flex-1 min-w-0">
              <TextField
                value={newAlt}
                onChange={(e) => setNewAlt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addAlternative();
                }}
                placeholder="Add an alternative"
              />
            </div>
            <button
              type="button"
              onClick={addAlternative}
              disabled={newAlt.trim() === ''}
              className="btn-ghost shrink-0 disabled:opacity-40"
            >
              <Icon name="plus" size={16} />
              Add
            </button>
          </div>
        </div>

        {(error || !parsed.ok) && (
          <p className="text-xs text-rose-300 px-1">{error ?? (!parsed.ok && parsed.error)}</p>
        )}

        <button
          type="button"
          disabled={!parsed.ok || saving}
          onClick={handleSave}
          className="btn-primary w-full py-3.5 disabled:opacity-40"
        >
          <Icon name="check" size={18} />
          Save changes
        </button>

        {logCount === 0 && (
          <button
            type="button"
            onClick={handleDelete}
            className="btn-ghost w-full text-rose-300"
          >
            <Icon name="trash" size={16} />
            Delete exercise
          </button>
        )}
        {logCount != null && logCount > 0 && (
          <p className="text-[11px] text-ink-500 text-center num">
            {logCount} logged set{logCount === 1 ? '' : 's'} · can’t be deleted
          </p>
        )}
      </div>
    </Sheet>
  );
}
