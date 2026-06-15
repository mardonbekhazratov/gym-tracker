import { useEffect, useMemo, useState } from 'react';
import { db, type DayKey, type DayTemplate, type Exercise, type Session, type Settings } from '../db/db';
import {
  getOrCreateSessionForToday,
  latestBodyWeight,
  markSessionCompleted,
  setSessionSwap,
  setSessionExerciseOrder,
  createExercise,
  type NewExerciseInput,
} from '../db/queries';
import { ExerciseCard } from '../components/ExerciseCard';
import { ExerciseSwapSheet } from '../components/ExerciseSwapSheet';
import { AddExerciseSheet } from '../components/AddExerciseSheet';
import { DeloadBanner } from '../components/DeloadBanner';
import { ProteinBadge } from '../components/ProteinBadge';
import { Icon } from '../components/Icon';
import { DatePicker } from '../components/ui/DatePicker';
import { useStore } from '../store/useStore';
import { dayKeyForDate, formatDateLong, todayISO, weeksBetween } from '../lib/dates';

const DAYS: { key: DayKey; short: string }[] = [
  { key: 'tuesday', short: 'Tue' },
  { key: 'thursday', short: 'Thu' },
  { key: 'saturday', short: 'Sat' },
];

/** Split "Wednesday — Lower" → { weekday: "Wednesday", focus: "Lower" }. */
function splitTemplateLabel(label: string): { weekday: string; focus: string } {
  const m = label.match(/^(.+?)\s*[—–-]\s*(.+)$/);
  if (m) return { weekday: m[1].trim(), focus: m[2].trim() };
  return { weekday: '', focus: label };
}

export function TodayScreen() {
  const selectedDay = useStore((s) => s.selectedDay);
  const setSelectedDay = useStore((s) => s.setSelectedDay);
  const expandedExerciseSlug = useStore((s) => s.expandedExerciseSlug);
  const setExpandedExerciseSlug = useStore((s) => s.setExpandedExerciseSlug);
  const units = useStore((s) => s.units);
  const [logDate, setLogDate] = useState<string>(todayISO());
  const [template, setTemplate] = useState<DayTemplate | null>(null);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [bodyweightKg, setBodyweightKg] = useState<number | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [swapTarget, setSwapTarget] = useState<Exercise | null>(null);
  const [reordering, setReordering] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const bySlug = useMemo(
    () => new Map(allExercises.map((e) => [e.slug, e])),
    [allExercises],
  );
  const exercises = useMemo(
    () => order.map((s) => bySlug.get(s)).filter((e): e is Exercise => !!e),
    [order, bySlug],
  );

  const today = todayISO();
  const todayKey = useMemo(() => dayKeyForDate(), []);
  const isToday = logDate === today;

  const weeksSinceDeload = settings
    ? weeksBetween(settings.lastDeloadDate ?? settings.programStartDate, today)
    : 0;

  const proteinGrams =
    settings?.bodyweightForProteinKg && settings.proteinPerKg
      ? Math.round(settings.bodyweightForProteinKg * settings.proteinPerKg)
      : null;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [s, tmpl, allEx, bw] = await Promise.all([
        db.settings.get(1),
        db.dayTemplates.where('key').equals(selectedDay).first(),
        db.exercises.toArray(),
        latestBodyWeight(),
      ]);
      if (cancelled) return;
      if (s) setSettings(s);
      setBodyweightKg(bw?.weightKg ?? null);

      setAllExercises(allEx);
      setReordering(false);

      if (!tmpl) {
        setTemplate(null);
        setOrder([]);
        setSession(null);
        setInitialLoad(false);
        return;
      }

      const exBySlug = new Map(allEx.map((e) => [e.slug, e]));
      const sess = await getOrCreateSessionForToday(selectedDay, logDate);
      if (cancelled) return;

      // Per-session order (reordered/added exercises) overrides the template,
      // filtered to slugs that still resolve to a known exercise.
      const orderedSlugs = (sess.exerciseOrder ?? tmpl.exerciseSlugs).filter(
        (slug) => exBySlug.has(slug),
      );

      setTemplate(tmpl);
      setOrder(orderedSlugs);
      setSession(sess);

      // Keep expanded card valid for the new day.
      if (
        !expandedExerciseSlug ||
        !orderedSlugs.includes(expandedExerciseSlug)
      ) {
        setExpandedExerciseSlug(orderedSlugs[0] ?? null);
      }
      setInitialLoad(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, logDate]);

  async function handleFinish() {
    if (!session?.id) return;
    await markSessionCompleted(session.id, !session.completed);
    const updated = await db.sessions.get(session.id);
    if (updated) setSession(updated);
  }

  async function handleMarkDeloadDone() {
    if (!settings?.id) return;
    await db.settings.update(settings.id, { lastDeloadDate: today });
    const updated = await db.settings.get(settings.id);
    if (updated) setSettings(updated);
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

  async function applyOrder(next: string[]) {
    if (!session?.id) return;
    setOrder(next);
    const updated = await setSessionExerciseOrder(session.id, next);
    if (updated) setSession(updated);
  }

  function moveExercise(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= order.length) return;
    const next = order.slice();
    [next[index], next[target]] = [next[target], next[index]];
    void applyOrder(next);
  }

  async function handleAddExisting(slug: string) {
    setAddOpen(false);
    if (order.includes(slug)) return;
    await applyOrder([...order, slug]);
    setExpandedExerciseSlug(slug);
  }

  async function handleCreateExercise(input: NewExerciseInput) {
    setAddOpen(false);
    const created = await createExercise(input);
    setAllExercises((prev) => [...prev, created]);
    await applyOrder([...order, created.slug]);
    setExpandedExerciseSlug(created.slug);
  }

  const { weekday, focus } = template
    ? splitTemplateLabel(template.label)
    : { weekday: '', focus: 'Pick a day' };

  return (
    <div className="px-4 pt-4 pb-6 max-w-xl mx-auto">
      <header className="mb-4">
        <div className="flex items-center justify-between gap-2">
          <p className="label-eyebrow flex items-center gap-1.5">
            <span className="inline-block w-1 h-1 rounded-full bg-ember-500" />
            {isToday ? 'Today' : 'Logging'} · {weekday || formatDateLong(logDate)}
          </p>
          {!isToday && (
            <button
              type="button"
              onClick={() => setLogDate(today)}
              className="tap text-[10px] uppercase tracking-[0.18em] font-semibold text-ember-400 px-2 py-1 rounded-md border border-ember-500/30 bg-ember-500/5"
            >
              Back to today
            </button>
          )}
        </div>
        <h1
          key={focus}
          className="display text-[36px] sm:text-[40px] leading-[1.05] mt-1.5 text-ink-50
            min-h-[2.2em] animate-[titleIn_320ms_cubic-bezier(0.32,0.72,0,1)]"
        >
          {focus}
        </h1>
        <div className="mt-2">
          <DatePicker
            value={logDate}
            onChange={setLogDate}
            eyebrow="Log date"
            max={today}
          />
        </div>
      </header>

      <div className="space-y-2 mb-4">
        <DeloadBanner
          weeksSince={weeksSinceDeload}
          onMarkDone={handleMarkDeloadDone}
        />
        <ProteinBadge grams={proteinGrams} />
      </div>

      <div role="tablist" className="grid grid-cols-3 gap-2 mb-5">
        {DAYS.map((d) => {
          const active = d.key === selectedDay;
          const isTodayBadge = d.key === todayKey;
          return (
            <button
              key={d.key}
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedDay(d.key)}
              className={`tap relative rounded-xl py-2.5 text-sm font-semibold border tracking-wide
                transition-[background-color,border-color,box-shadow,color] duration-200
                ${
                  active
                    ? 'bg-ember-500 text-white border-ember-500 shadow-glow'
                    : 'bg-ink-900/60 text-ink-200 border-ink-800 active:bg-ink-800/60'
                }`}
            >
              {d.short}
              {isTodayBadge && !active && (
                <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>

      {initialLoad && (
        <p className="text-ink-400 text-sm">Loading…</p>
      )}

      {!initialLoad && !template && (
        <p className="text-ink-400 text-sm">
          No template for this day. Pick Tue, Thu, or Sat.
        </p>
      )}

      {template && session && (
        <div
          key={`${selectedDay}-${session.id}`}
          className="space-y-3 animate-[fadeSlide_280ms_cubic-bezier(0.32,0.72,0,1)]"
        >
          {exercises.length > 1 && (
            <div className="flex items-center justify-between -mb-1">
              <p className="label-eyebrow num">{exercises.length} exercises</p>
              <button
                type="button"
                onClick={() => setReordering((r) => !r)}
                className={`tap text-[10px] uppercase tracking-[0.18em] font-semibold
                  px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5
                  ${
                    reordering
                      ? 'text-white bg-ember-500 border-ember-500'
                      : 'text-ink-300 border-ink-700 bg-ink-900/60'
                  }`}
              >
                <Icon name={reordering ? 'check' : 'swap'} size={13} />
                {reordering ? 'Done' : 'Reorder'}
              </button>
            </div>
          )}

          {reordering
            ? exercises.map((ex, i) => (
                <div
                  key={ex.slug}
                  className="card flex items-center justify-between px-4 py-3"
                >
                  <span className="font-semibold text-ink-50 truncate text-[15px] min-w-0">
                    {session.swaps?.[ex.slug] ?? ex.name}
                  </span>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => moveExercise(i, -1)}
                      disabled={i === 0}
                      aria-label="Move up"
                      className="tap w-9 h-9 grid place-items-center rounded-lg
                        bg-ink-800/70 text-ink-200 disabled:opacity-30"
                    >
                      <Icon name="chevron-down" size={18} className="rotate-180" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveExercise(i, 1)}
                      disabled={i === exercises.length - 1}
                      aria-label="Move down"
                      className="tap w-9 h-9 grid place-items-center rounded-lg
                        bg-ink-800/70 text-ink-200 disabled:opacity-30"
                    >
                      <Icon name="chevron-down" size={18} />
                    </button>
                  </div>
                </div>
              ))
            : exercises.map((ex) => (
                <ExerciseCard
                  key={ex.slug}
                  exercise={ex}
                  sessionId={session.id!}
                  sessionDate={session.date}
                  units={units}
                  expanded={expandedExerciseSlug === ex.slug}
                  onToggle={() =>
                    setExpandedExerciseSlug(
                      expandedExerciseSlug === ex.slug ? null : ex.slug,
                    )
                  }
                  swappedTo={session.swaps?.[ex.slug] ?? null}
                  onOpenSwap={() => setSwapTarget(ex)}
                  bodyweightKg={bodyweightKg}
                />
              ))}

          {!reordering && (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="btn-ghost w-full"
            >
              <Icon name="plus" size={16} />
              Add exercise
            </button>
          )}

          {!reordering && (
          <button
            type="button"
            onClick={handleFinish}
            className={`w-full mt-4 py-3.5 text-base ${
              session.completed ? 'btn-ghost' : 'btn-primary'
            }`}
          >
            {session.completed ? (
              <>
                <Icon name="check" size={18} />
                Session finished — tap to reopen
              </>
            ) : (
              <>
                <Icon name="sparkle" size={18} />
                Finish session
              </>
            )}
          </button>
          )}
        </div>
      )}

      {swapTarget && (
        <ExerciseSwapSheet
          exercise={swapTarget}
          current={session?.swaps?.[swapTarget.slug] ?? null}
          onClose={() => setSwapTarget(null)}
          onSelect={handleSelectSwap}
        />
      )}

      {addOpen && session && (
        <AddExerciseSheet
          library={allExercises}
          existingSlugs={order}
          onClose={() => setAddOpen(false)}
          onAddExisting={handleAddExisting}
          onCreate={handleCreateExercise}
        />
      )}

      <style>{`
        @keyframes titleIn {
          from { opacity: 0; transform: translateY(6px); filter: blur(2px); }
          to   { opacity: 1; transform: translateY(0);  filter: blur(0); }
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
