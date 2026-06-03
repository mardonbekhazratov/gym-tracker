import { useEffect, useState } from 'react';
import { db, type Settings } from '../db/db';
import { BodyWeightInput } from '../components/BodyWeightInput';
import { useStore } from '../store/useStore';
import { displayWeight, parseWeightToKg } from '../lib/units';

export function SettingsScreen() {
  const units = useStore((s) => s.units);
  const setUnits = useStore((s) => s.setUnits);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [proteinPerKg, setProteinPerKg] = useState('1.8');
  const [bwForProtein, setBwForProtein] = useState('');
  const [bwTick, setBwTick] = useState(0);

  useEffect(() => {
    void db.settings.get(1).then((s) => {
      if (!s) return;
      setSettings(s);
      setProteinPerKg(String(s.proteinPerKg));
      setBwForProtein(
        s.bodyweightForProteinKg
          ? displayWeight(s.bodyweightForProteinKg, units)
          : '',
      );
    });
  }, [units]);

  async function persist(patch: Partial<Settings>) {
    if (!settings?.id) return;
    await db.settings.update(settings.id, patch);
    const updated = await db.settings.get(settings.id);
    if (updated) setSettings(updated);
  }

  async function handleUnitsToggle(next: 'kg' | 'lb') {
    setUnits(next);
    await persist({ units: next });
  }

  async function handleProteinBlur() {
    const v = parseFloat(proteinPerKg);
    if (Number.isFinite(v) && v > 0) await persist({ proteinPerKg: v });
  }

  async function handleBwForProteinBlur() {
    if (!bwForProtein.trim()) {
      await persist({ bodyweightForProteinKg: undefined });
      return;
    }
    const kg = parseWeightToKg(bwForProtein, units);
    if (kg > 0) await persist({ bodyweightForProteinKg: kg });
  }

  return (
    <div className="px-4 pt-5 pb-4 space-y-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="card p-4 space-y-3">
        <h2 className="font-semibold">Units</h2>
        <div className="grid grid-cols-2 gap-2">
          {(['kg', 'lb'] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => handleUnitsToggle(u)}
              className={`tap rounded-xl py-2 font-semibold border ${
                units === u
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-slate-900 text-slate-200 border-slate-800'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </section>

      <BodyWeightInput units={units} onChange={() => setBwTick((n) => n + 1)} />

      <section className="card p-4 space-y-3">
        <h2 className="font-semibold">Protein target</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-slate-400">g per kg bodyweight</span>
            <input
              type="number"
              step="0.1"
              value={proteinPerKg}
              onChange={(e) => setProteinPerKg(e.target.value)}
              onBlur={handleProteinBlur}
              className="input mt-1"
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">
              Bodyweight ({units})
            </span>
            <input
              type="number"
              step="0.1"
              placeholder="optional"
              value={bwForProtein}
              onChange={(e) => setBwForProtein(e.target.value)}
              onBlur={handleBwForProteinBlur}
              className="input mt-1"
            />
          </label>
        </div>
        {settings?.bodyweightForProteinKg && (
          <p className="text-xs text-slate-400">
            Daily target ~
            {Math.round(
              settings.bodyweightForProteinKg * settings.proteinPerKg,
            )}
            g protein.
          </p>
        )}
      </section>

      <section className="card p-4 space-y-2">
        <h2 className="font-semibold">Program</h2>
        <label className="block">
          <span className="text-xs text-slate-400">Program start date</span>
          <input
            type="date"
            value={settings?.programStartDate ?? ''}
            onChange={(e) => void persist({ programStartDate: e.target.value })}
            className="input mt-1"
          />
        </label>
      </section>

      {/* used to silence unused-state warning when BodyWeightInput refreshes the chart */}
      <span className="hidden">{bwTick}</span>
    </div>
  );
}
