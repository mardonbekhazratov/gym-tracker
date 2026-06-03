import { useEffect, useRef, useState } from 'react';
import { db, type Settings } from '../db/db';
import { BodyWeightInput } from '../components/BodyWeightInput';
import { useStore } from '../store/useStore';
import { displayWeight, parseWeightToKg } from '../lib/units';
import {
  exportBackup,
  importBackup,
  resetAllData,
  triggerDownload,
  type BackupFile,
} from '../lib/backup';
import { todayISO } from '../lib/dates';

export function SettingsScreen() {
  const units = useStore((s) => s.units);
  const setUnits = useStore((s) => s.setUnits);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [proteinPerKg, setProteinPerKg] = useState('1.8');
  const [bwForProtein, setBwForProtein] = useState('');
  const [bwTick, setBwTick] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  async function handleExport() {
    const backup = await exportBackup();
    triggerDownload(
      `workout-tracker-${todayISO()}.json`,
      JSON.stringify(backup, null, 2),
    );
    setStatus(`Exported ${todayISO()}`);
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      !window.confirm(
        'Import will REPLACE all current data with the file contents. Continue?',
      )
    ) {
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as BackupFile;
      await importBackup(parsed);
      const reloaded = await db.settings.get(1);
      if (reloaded) {
        setSettings(reloaded);
        setUnits(reloaded.units);
      }
      setStatus(`Imported ${file.name}`);
    } catch (err) {
      setStatus(
        `Import failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleReset() {
    if (
      !window.confirm(
        'Reset will erase all sessions, sets, and bodyweight history. The program seed will be restored. Continue?',
      )
    )
      return;
    await resetAllData();
    const reloaded = await db.settings.get(1);
    if (reloaded) {
      setSettings(reloaded);
      setUnits(reloaded.units);
    }
    setStatus('Data reset');
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

      <section className="card p-4 space-y-3">
        <h2 className="font-semibold">Backup</h2>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn-ghost" onClick={handleExport}>
            Export JSON
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => fileRef.current?.click()}
          >
            Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportFile}
          />
          <button
            type="button"
            onClick={handleReset}
            className="tap col-span-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold px-4 py-2"
          >
            Reset all data…
          </button>
        </div>
        {status && (
          <p className="text-xs text-slate-400">{status}</p>
        )}
      </section>

      {/* used to silence unused-state warning when BodyWeightInput refreshes the chart */}
      <span className="hidden">{bwTick}</span>
    </div>
  );
}
