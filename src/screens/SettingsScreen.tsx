import { useEffect, useRef, useState } from 'react';
import { db, type Settings } from '../db/db';
import { BodyWeightInput } from '../components/BodyWeightInput';
import { Icon } from '../components/Icon';
import { NumberField } from '../components/ui/NumberField';
import { DatePicker } from '../components/ui/DatePicker';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { useStore } from '../store/useStore';
import { displayWeight, parseWeightToKg } from '../lib/units';
import {
  exportBackup,
  importBackup,
  triggerDownload,
  type BackupFile,
} from '../lib/backup';
import { todayISO } from '../lib/dates';

export function SettingsScreen() {
  const units = useStore((s) => s.units);
  const setUnits = useStore((s) => s.setUnits);
  const confirm = useConfirm();
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

  async function handleProteinCommit(value: string) {
    const v = parseFloat(value);
    if (Number.isFinite(v) && v > 0) await persist({ proteinPerKg: v });
  }

  async function handleBwForProteinCommit(value: string) {
    if (!value.trim()) {
      await persist({ bodyweightForProteinKg: undefined });
      return;
    }
    const kg = parseWeightToKg(value, units);
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
    const ok = await confirm({
      title: 'Replace all data?',
      body: 'Import will REPLACE all current data with the contents of the selected file. This cannot be undone.',
      confirmLabel: 'Replace',
      cancelLabel: 'Cancel',
      tone: 'danger',
    });
    if (!ok) {
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

  return (
    <div className="px-4 pt-4 pb-6 space-y-4 max-w-xl mx-auto">
      <header>
        <p className="label-eyebrow flex items-center gap-1.5">
          <span className="inline-block w-1 h-1 rounded-full bg-ember-500" />
          Configure
        </p>
        <h1 className="display text-[40px] leading-[1.05] mt-1.5 text-ink-50">
          Settings
        </h1>
      </header>

      <section className="card p-4 space-y-3">
        <h2 className="font-semibold text-ink-100 inline-flex items-center gap-2">
          <Icon name="weight" size={16} className="text-ember-400" />
          Units
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {(['kg', 'lb'] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => handleUnitsToggle(u)}
              className={`tap rounded-xl py-2.5 font-semibold border tracking-wide uppercase
                ${
                  units === u
                    ? 'bg-ember-500 text-white border-ember-500 shadow-glow'
                    : 'bg-ink-900/60 text-ink-200 border-ink-800'
                }`}
            >
              {u}
            </button>
          ))}
        </div>
      </section>

      <BodyWeightInput units={units} onChange={() => setBwTick((n) => n + 1)} />

      <section className="card p-4 space-y-3">
        <h2 className="font-semibold text-ink-100 inline-flex items-center gap-2">
          <Icon name="protein" size={16} className="text-ember-400" />
          Protein target
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="label-eyebrow mb-1">g per kg bodyweight</p>
            <NumberField
              value={proteinPerKg}
              onChange={setProteinPerKg}
              onCommit={handleProteinCommit}
              step={0.1}
              min={0.5}
              max={4}
              stepper
              ariaLabel="Grams per kg bodyweight"
            />
          </div>
          <div>
            <p className="label-eyebrow mb-1">Bodyweight ({units})</p>
            <NumberField
              value={bwForProtein}
              onChange={setBwForProtein}
              onCommit={handleBwForProteinCommit}
              placeholder="optional"
              step={0.5}
              ariaLabel="Bodyweight for protein"
            />
          </div>
        </div>
        {settings?.bodyweightForProteinKg && (
          <p className="text-xs text-ink-400 num">
            Daily target ~
            {Math.round(
              settings.bodyweightForProteinKg * settings.proteinPerKg,
            )}
            g protein.
          </p>
        )}
      </section>

      <section className="card p-4 space-y-3">
        <h2 className="font-semibold text-ink-100 inline-flex items-center gap-2">
          <Icon name="calendar" size={16} className="text-ember-400" />
          Program
        </h2>
        <DatePicker
          value={settings?.programStartDate ?? ''}
          onChange={(d) => void persist({ programStartDate: d })}
          eyebrow="Program start date"
        />
      </section>

      <section className="card p-4 space-y-3">
        <h2 className="font-semibold text-ink-100 inline-flex items-center gap-2">
          <Icon name="download" size={16} className="text-ember-400" />
          Backup
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn-ghost" onClick={handleExport}>
            <Icon name="download" size={16} />
            Export JSON
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => fileRef.current?.click()}
          >
            <Icon name="upload" size={16} />
            Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
        {status && (
          <p className="text-xs text-ink-400">{status}</p>
        )}
      </section>

      {/* silence unused-state warning */}
      <span className="hidden">{bwTick}</span>
    </div>
  );
}
