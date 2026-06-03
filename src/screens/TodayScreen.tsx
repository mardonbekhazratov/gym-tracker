import { useEffect, useMemo, useState } from 'react';
import { db, type DayKey, type DayTemplate, type Exercise, type Session } from '../db/db';
import { getOrCreateSessionForToday, markSessionCompleted } from '../db/queries';
import { ExerciseCard } from '../components/ExerciseCard';
import { useStore } from '../store/useStore';
import { dayKeyForDate, formatDateLong, todayISO } from '../lib/dates';

const DAYS: { key: DayKey; short: string }[] = [
  { key: 'monday', short: 'Mon' },
  { key: 'wednesday', short: 'Wed' },
  { key: 'friday', short: 'Fri' },
];

export function TodayScreen() {
  const selectedDay = useStore((s) => s.selectedDay);
  const setSelectedDay = useStore((s) => s.setSelectedDay);
  const expandedExerciseSlug = useStore((s) => s.expandedExerciseSlug);
  const setExpandedExerciseSlug = useStore((s) => s.setExpandedExerciseSlug);
  const units = useStore((s) => s.units);
  const [template, setTemplate] = useState<DayTemplate | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const today = todayISO();
  const todayKey = useMemo(() => dayKeyForDate(), []);
  const isToday = todayKey === selectedDay;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const tmpl = await db.dayTemplates.where('key').equals(selectedDay).first();
      if (!tmpl) {
        setTemplate(null);
        setExercises([]);
        setLoading(false);
        return;
      }

      const allEx = await db.exercises.toArray();
      const bySlug = new Map(allEx.map((e) => [e.slug, e]));
      const ordered = tmpl.exerciseSlugs
        .map((slug) => bySlug.get(slug))
        .filter((e): e is Exercise => !!e);

      const sess = await getOrCreateSessionForToday(selectedDay, today);

      if (cancelled) return;
      setTemplate(tmpl);
      setExercises(ordered);
      setSession(sess);
      if (!expandedExerciseSlug && ordered.length > 0) {
        setExpandedExerciseSlug(ordered[0].slug);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, today]);

  async function handleFinish() {
    if (!session?.id) return;
    await markSessionCompleted(session.id, !session.completed);
    const updated = await db.sessions.get(session.id);
    if (updated) setSession(updated);
  }

  return (
    <div className="px-4 pt-5 pb-4 max-w-xl mx-auto">
      <header className="mb-3">
        <p className="text-xs uppercase tracking-wider text-slate-500">
          {isToday ? 'Today' : 'Planned'} · {formatDateLong(today)}
        </p>
        <h1 className="text-2xl font-bold mt-0.5">
          {template?.label ?? 'Pick a day'}
        </h1>
      </header>

      <div role="tablist" className="grid grid-cols-3 gap-2 mb-4">
        {DAYS.map((d) => {
          const active = d.key === selectedDay;
          const isTodayBadge = d.key === todayKey;
          return (
            <button
              key={d.key}
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedDay(d.key)}
              className={`tap relative rounded-xl py-2 text-sm font-semibold border ${
                active
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-slate-900 text-slate-200 border-slate-800'
              }`}
            >
              {d.short}
              {isTodayBadge && !active && (
                <span className="absolute top-1 right-2 text-[9px] text-emerald-400">
                  •
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading && (
        <p className="text-slate-400 text-sm">Loading…</p>
      )}

      {!loading && template && session && (
        <div className="space-y-3">
          {exercises.map((ex) => (
            <ExerciseCard
              key={ex.slug}
              exercise={ex}
              sessionId={session.id!}
              units={units}
              expanded={expandedExerciseSlug === ex.slug}
              onToggle={() =>
                setExpandedExerciseSlug(
                  expandedExerciseSlug === ex.slug ? null : ex.slug,
                )
              }
            />
          ))}

          <button
            type="button"
            onClick={handleFinish}
            className={`w-full mt-3 ${
              session.completed ? 'btn-ghost' : 'btn-primary'
            } py-3 text-base`}
          >
            {session.completed ? '✓ Session finished — tap to reopen' : 'Finish session'}
          </button>
        </div>
      )}

      {!loading && !template && (
        <p className="text-slate-400 text-sm">
          No template for this day. Pick Mon, Wed, or Fri.
        </p>
      )}
    </div>
  );
}
