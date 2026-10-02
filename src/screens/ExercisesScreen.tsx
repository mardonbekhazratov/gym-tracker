import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { db, type DayKey, type DayTemplate, type Exercise } from '../db/db';
import { EditExerciseSheet } from '../components/EditExerciseSheet';
import { MUSCLE_GROUPS } from '../components/ExerciseFields';
import { Icon } from '../components/Icon';

const ACTIVE_DAYS: { key: DayKey; short: string }[] = [
  { key: 'tuesday', short: 'Tue' },
  { key: 'thursday', short: 'Thu' },
  { key: 'saturday', short: 'Sat' },
];

/** Settings → Exercises: browse the library and edit any exercise's defaults. */
export function ExercisesScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [templates, setTemplates] = useState<DayTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Exercise | null>(null);

  useEffect(() => {
    void Promise.all([db.exercises.toArray(), db.dayTemplates.toArray()]).then(
      ([ex, tmpl]) => {
        setExercises(ex);
        setTemplates(tmpl);
        setLoading(false);
      },
    );
  }, []);

  // Which program days each exercise is part of, e.g. slug → ['Tue', 'Sat'].
  const daysBySlug = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const d of ACTIVE_DAYS) {
      const t = templates.find((x) => x.key === d.key);
      for (const slug of t?.exerciseSlugs ?? []) {
        m.set(slug, [...(m.get(slug) ?? []), d.short]);
      }
    }
    return m;
  }, [templates]);

  const groups = useMemo(
    () =>
      MUSCLE_GROUPS.map((g) => ({
        ...g,
        items: exercises
          .filter((e) => e.muscleGroup === g.value)
          .sort((a, b) => a.name.localeCompare(b.name)),
      })).filter((g) => g.items.length > 0),
    [exercises],
  );

  function handleSaved(updated: Exercise) {
    setExercises((prev) => prev.map((e) => (e.slug === updated.slug ? updated : e)));
  }

  function handleDeleted(slug: string) {
    setExercises((prev) => prev.filter((e) => e.slug !== slug));
    setTemplates((prev) =>
      prev.map((t) => ({ ...t, exerciseSlugs: t.exerciseSlugs.filter((s) => s !== slug) })),
    );
  }

  return (
    <div className="px-4 pt-4 pb-6 max-w-xl mx-auto space-y-4">
      <Link
        to="/settings"
        className="tap inline-flex items-center gap-1.5 text-sm text-ember-400 font-medium"
      >
        <Icon name="arrow-left" size={16} />
        Back to settings
      </Link>

      <header>
        <p className="label-eyebrow flex items-center gap-1.5">
          <span className="inline-block w-1 h-1 rounded-full bg-ember-500" />
          Library
        </p>
        <h1 className="display text-[40px] leading-[1.05] mt-1.5 text-ink-50">
          Exercises
        </h1>
        <p className="text-xs text-ink-400 mt-2 leading-relaxed">
          Tap an exercise to change its default sets, rep range, rest time or
          swap alternatives.
        </p>
      </header>

      {loading && <p className="text-ink-400 text-sm">Loading…</p>}

      {groups.map((g) => (
        <section key={g.value}>
          <h2 className="label-eyebrow px-1 mb-1.5">
            {g.label} <span className="num text-ink-600">· {g.items.length}</span>
          </h2>
          <ul className="space-y-2">
            {g.items.map((ex) => (
              <li key={ex.slug}>
                <button
                  type="button"
                  onClick={() => setEditing(ex)}
                  className="tap card w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-50 truncate text-[15px] tracking-tighter-">
                      {ex.name}
                    </p>
                    <p className="text-xs text-ink-400 mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="num">
                        {ex.defaultSets} × {ex.repLow}–{ex.repHigh}
                      </span>
                      <span className="inline-flex items-center gap-1 text-ink-500">
                        <Icon name="clock" size={11} />
                        <span className="num">{ex.restSeconds}s</span>
                      </span>
                      {(daysBySlug.get(ex.slug) ?? []).map((d) => (
                        <span
                          key={d}
                          className="text-[9px] font-bold tracking-[0.18em] uppercase text-ink-300 bg-ink-800 rounded px-1.5 py-0.5"
                        >
                          {d}
                        </span>
                      ))}
                      {ex.custom && (
                        <span className="text-[9px] font-bold tracking-[0.18em] text-ember-300">
                          CUSTOM
                        </span>
                      )}
                    </p>
                  </div>
                  <Icon name="edit" size={16} className="text-ink-500 shrink-0 ml-2" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {editing && (
        <EditExerciseSheet
          exercise={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
