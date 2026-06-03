import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { db, type Exercise, type Session } from '../db/db';
import {
  markSessionCompleted,
  setsForSession,
  updateSessionNotes,
} from '../db/queries';
import { ExerciseCard } from '../components/ExerciseCard';
import { useStore } from '../store/useStore';
import { formatDateLong } from '../lib/dates';

export function SessionDetailScreen() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = Number(params.sessionId);
  const units = useStore((s) => s.units);
  const [session, setSession] = useState<Session | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(sessionId)) return;
    const s = await db.sessions.get(sessionId);
    if (!s) return;
    const tmpl = await db.dayTemplates.where('key').equals(s.dayKey).first();
    const sets = await setsForSession(sessionId);
    const allEx = await db.exercises.toArray();
    const bySlug = new Map(allEx.map((e) => [e.slug, e]));
    const templateSlugs = tmpl?.exerciseSlugs ?? [];
    const loggedOnly = Array.from(new Set(sets.map((x) => x.exerciseSlug))).filter(
      (slug) => !templateSlugs.includes(slug),
    );
    const ordered = [...templateSlugs, ...loggedOnly]
      .map((slug) => bySlug.get(slug))
      .filter((e): e is Exercise => !!e);
    setSession(s);
    setExercises(ordered);
    setLabel(tmpl?.label ?? s.dayKey);
    setNotes(s.notes ?? '');
    if (!expanded && ordered.length > 0) setExpanded(ordered[0].slug);
  }, [sessionId, expanded]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleNotesBlur() {
    if (!session?.id) return;
    if ((session.notes ?? '') === notes) return;
    await updateSessionNotes(session.id, notes);
    const updated = await db.sessions.get(session.id);
    if (updated) setSession(updated);
  }

  async function handleToggleCompleted() {
    if (!session?.id) return;
    await markSessionCompleted(session.id, !session.completed);
    const updated = await db.sessions.get(session.id);
    if (updated) setSession(updated);
  }

  if (!session) {
    return (
      <div className="px-4 pt-5 pb-4">
        <Link to="/history" className="text-sm text-brand-500">
          ← Back
        </Link>
        <p className="text-slate-400 text-sm mt-3">Session not found.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-4 max-w-xl mx-auto space-y-3">
      <Link to="/history" className="text-sm text-brand-500">
        ← Back to history
      </Link>

      <header>
        <p className="text-xs uppercase tracking-wider text-slate-500">
          {formatDateLong(session.date)}
        </p>
        <h1 className="text-2xl font-bold mt-0.5">{label}</h1>
      </header>

      <section className="card p-3 space-y-1">
        <label className="block">
          <span className="text-xs text-slate-400">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            rows={2}
            className="input mt-1 text-left text-base font-normal"
            placeholder="How did it feel?"
          />
        </label>
      </section>

      <div className="space-y-3">
        {exercises.map((ex) => (
          <ExerciseCard
            key={ex.slug}
            exercise={ex}
            sessionId={sessionId}
            units={units}
            expanded={expanded === ex.slug}
            onToggle={() => setExpanded(expanded === ex.slug ? null : ex.slug)}
            triggerRest={false}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={handleToggleCompleted}
        className={`w-full mt-3 ${
          session.completed ? 'btn-ghost' : 'btn-primary'
        } py-3 text-base`}
      >
        {session.completed
          ? '✓ Marked done — tap to reopen'
          : 'Mark session done'}
      </button>
    </div>
  );
}
