import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { db, type Exercise, type Session } from '../db/db';
import {
  latestBodyWeight,
  markSessionCompleted,
  setsForSession,
  setSessionSwap,
  updateSessionNotes,
} from '../db/queries';
import { ExerciseCard } from '../components/ExerciseCard';
import { ExerciseSwapSheet } from '../components/ExerciseSwapSheet';
import { Icon } from '../components/Icon';
import { TextArea } from '../components/ui/TextArea';
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
  const [swapTarget, setSwapTarget] = useState<Exercise | null>(null);
  const [bodyweightKg, setBodyweightKg] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(sessionId)) return;
    const s = await db.sessions.get(sessionId);
    if (!s) return;
    const tmpl = await db.dayTemplates.where('key').equals(s.dayKey).first();
    const sets = await setsForSession(sessionId);
    const allEx = await db.exercises.toArray();
    const bw = await latestBodyWeight();
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
    setBodyweightKg(bw?.weightKg ?? null);
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

  async function handleSelectSwap(alternative: string | null) {
    if (!swapTarget || !session?.id) return;
    const updated = await setSessionSwap(
      session.id,
      swapTarget.slug,
      alternative,
    );
    if (updated) setSession(updated);
  }

  if (!session) {
    return (
      <div className="px-4 pt-4 pb-6 max-w-xl mx-auto">
        <Link
          to="/history"
          className="tap inline-flex items-center gap-1.5 text-sm text-ember-400"
        >
          <Icon name="arrow-left" size={16} />
          Back
        </Link>
        <p className="text-ink-400 text-sm mt-4">Session not found.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-6 max-w-xl mx-auto space-y-4">
      <Link
        to="/history"
        className="tap inline-flex items-center gap-1.5 text-sm text-ember-400 font-medium"
      >
        <Icon name="arrow-left" size={16} />
        Back to history
      </Link>

      <header>
        <p className="label-eyebrow num">{formatDateLong(session.date)}</p>
        <h1 className="display text-[36px] leading-[1.05] mt-1.5 text-ink-50">
          {label}
        </h1>
      </header>

      <section className="card p-3">
        <TextArea
          eyebrow="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          rows={2}
          placeholder="How did it feel?"
        />
      </section>

      <div className="space-y-3">
        {exercises.map((ex) => (
          <ExerciseCard
            key={ex.slug}
            exercise={ex}
            sessionId={sessionId}
            sessionDate={session.date}
            units={units}
            expanded={expanded === ex.slug}
            onToggle={() => setExpanded(expanded === ex.slug ? null : ex.slug)}
            triggerRest={false}
            swappedTo={session.swaps?.[ex.slug] ?? null}
            onOpenSwap={() => setSwapTarget(ex)}
            bodyweightKg={bodyweightKg}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={handleToggleCompleted}
        className={`w-full py-3.5 text-base ${
          session.completed ? 'btn-ghost' : 'btn-primary'
        }`}
      >
        {session.completed ? (
          <>
            <Icon name="check" size={18} />
            Marked done — tap to reopen
          </>
        ) : (
          <>
            <Icon name="sparkle" size={18} />
            Mark session done
          </>
        )}
      </button>

      {swapTarget && (
        <ExerciseSwapSheet
          exercise={swapTarget}
          current={session.swaps?.[swapTarget.slug] ?? null}
          onClose={() => setSwapTarget(null)}
          onSelect={handleSelectSwap}
        />
      )}
    </div>
  );
}
