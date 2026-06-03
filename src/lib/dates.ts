import type { DayKey } from '../db/db';

export function todayISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dayKeyForDate(d: Date = new Date()): DayKey | null {
  switch (d.getDay()) {
    case 1:
      return 'monday';
    case 3:
      return 'wednesday';
    case 5:
      return 'friday';
    default:
      return null;
  }
}

export function weeksBetween(fromISO: string, toISO: string = todayISO()): number {
  const from = new Date(fromISO + 'T00:00:00');
  const to = new Date(toISO + 'T00:00:00');
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 7));
}

export function formatDateLong(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
