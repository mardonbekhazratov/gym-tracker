import { useEffect, useState } from 'react';
import { db, type Exercise } from '../db/db';
import { ExerciseProgressChart } from '../components/ExerciseProgressChart';
import { BodyWeightChart } from '../components/BodyWeightChart';
import { WeeklyVolume } from '../components/WeeklyVolume';
import { Select } from '../components/ui/Select';
import { useStore } from '../store/useStore';

export function ProgressScreen() {
  const units = useStore((s) => s.units);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('');

  useEffect(() => {
    void db.exercises.toArray().then((all) => {
      const sorted = all.slice().sort((a, b) => a.name.localeCompare(b.name));
      setExercises(sorted);
      if (sorted.length > 0 && !selectedSlug) setSelectedSlug(sorted[0].slug);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = exercises.find((e) => e.slug === selectedSlug);

  return (
    <div className="px-4 pt-4 pb-6 space-y-4 max-w-xl mx-auto">
      <header>
        <p className="label-eyebrow flex items-center gap-1.5">
          <span className="inline-block w-1 h-1 rounded-full bg-ember-500" />
          Trajectory
        </p>
        <h1 className="display text-[40px] leading-[1.05] mt-1.5 text-ink-50">
          Progress
        </h1>
      </header>

      <WeeklyVolume />

      <section className="card p-3">
        <Select
          value={selectedSlug}
          eyebrow="Exercise"
          sheetTitle="Choose exercise"
          options={exercises.map((ex) => ({
            value: ex.slug,
            label: ex.name,
          }))}
          onChange={setSelectedSlug}
        />
      </section>

      {selected && (
        <ExerciseProgressChart
          exerciseSlug={selected.slug}
          exerciseName={selected.name}
          units={units}
        />
      )}

      <BodyWeightChart units={units} />
    </div>
  );
}
