import { useEffect, useState } from 'react';
import { db, type Exercise } from '../db/db';
import { ExerciseProgressChart } from '../components/ExerciseProgressChart';
import { BodyWeightChart } from '../components/BodyWeightChart';
import { WeeklyVolume } from '../components/WeeklyVolume';
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
    <div className="px-4 pt-5 pb-4 space-y-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">Progress</h1>

      <WeeklyVolume />

      <section className="card p-3 space-y-2">
        <label className="block">
          <span className="text-xs text-slate-400">Exercise</span>
          <select
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="input mt-1 text-left"
          >
            {exercises.map((ex) => (
              <option key={ex.slug} value={ex.slug}>
                {ex.name}
              </option>
            ))}
          </select>
        </label>
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
