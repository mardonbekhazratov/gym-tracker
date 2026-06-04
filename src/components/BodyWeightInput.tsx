import { useEffect, useState } from 'react';
import { latestBodyWeight, recordBodyWeight } from '../db/queries';
import { displayWeight, parseWeightToKg } from '../lib/units';
import { todayISO } from '../lib/dates';
import { Icon } from './Icon';
import { NumberField } from './ui/NumberField';
import { DatePicker } from './ui/DatePicker';

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
    <section className="card p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold text-ink-100 inline-flex items-center gap-2">
          <Icon name="weight" size={16} className="text-ember-400" />
          Bodyweight
        </h2>
        {latest && (
          <span className="text-[11px] text-ink-400 num truncate">
            Latest · {latest}
          </span>
        )}
      </div>
      <div className="space-y-2">
        <DatePicker value={date} onChange={setDate} eyebrow="Date" />
        <div className="grid grid-cols-[1fr_auto] gap-2 items-stretch">
          <NumberField
            value={value}
            onChange={setValue}
            placeholder={units}
            suffix={units}
            step={0.1}
            ariaLabel="Bodyweight"
          />
          <button
            type="button"
            className="btn-primary px-5"
            disabled={!value.trim() || saving}
            onClick={handleSave}
          >
            <Icon name="check" size={16} />
            Save
          </button>
        </div>
      </div>
    </section>
  );
}
