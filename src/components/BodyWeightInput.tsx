import { useEffect, useState } from 'react';
import { latestBodyWeight, recordBodyWeight } from '../db/queries';
import { displayWeight, parseWeightToKg } from '../lib/units';
import { todayISO } from '../lib/dates';

interface Props {
  units: 'kg' | 'lb';
  onChange?: () => void;
}

export function BodyWeightInput({ units, onChange }: Props) {
  const [date, setDate] = useState(todayISO());
  const [value, setValue] = useState('');
  const [latest, setLatest] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void latestBodyWeight().then((bw) => {
      if (bw) setLatest(`${displayWeight(bw.weightKg, units)} ${units} · ${bw.date}`);
      else setLatest(null);
    });
  }, [units]);

  async function handleSave() {
    if (!value.trim() || saving) return;
    setSaving(true);
    try {
      const kg = parseWeightToKg(value, units);
      if (kg > 0) {
        await recordBodyWeight(date, kg);
        setValue('');
        const bw = await latestBodyWeight();
        if (bw) setLatest(`${displayWeight(bw.weightKg, units)} ${units} · ${bw.date}`);
        onChange?.();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">Bodyweight</h2>
        {latest && (
          <span className="text-xs text-slate-400">Latest: {latest}</span>
        )}
      </div>
      <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input"
        />
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          placeholder={units}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="input w-24"
        />
        <button
          type="button"
          className="btn-primary"
          disabled={!value.trim() || saving}
          onClick={handleSave}
        >
          Save
        </button>
      </div>
    </div>
  );
}
