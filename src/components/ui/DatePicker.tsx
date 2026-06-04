import { useMemo, useState } from 'react';
import { Sheet } from './Sheet';
import { Icon } from '../Icon';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (next: string) => void;
  eyebrow?: string;
  placeholder?: string;
  min?: string;
  max?: string;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function parseISO(iso: string): Date | null {
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function toISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatLong(d: Date) {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function DatePicker({
  value,
  onChange,
  eyebrow,
  placeholder = 'Pick a date',
  min,
  max,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseISO(value);
  const today = new Date();

  const [view, setView] = useState<Date>(() => selected ?? today);

  const minDate = min ? parseISO(min) : null;
  const maxDate = max ? parseISO(max) : null;

  const grid = useMemo(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const first = new Date(year, month, 1);
    const startWeekday = first.getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { date: Date; inMonth: boolean }[] = [];
    // Leading blanks from prev month
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      cells.push({ date: d, inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), inMonth: true });
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      const next = new Date(last);
      next.setDate(last.getDate() + 1);
      cells.push({ date: next, inMonth: false });
    }
    return cells;
  }, [view]);

  function shiftMonth(delta: number) {
    setView(new Date(view.getFullYear(), view.getMonth() + delta, 1));
  }

  function pick(d: Date) {
    if (minDate && d < minDate) return;
    if (maxDate && d > maxDate) return;
    onChange(toISO(d));
    setOpen(false);
  }

  const sameYMD = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tap w-full text-left rounded-xl bg-ink-900/80
          border border-ink-700/70 px-3.5 py-3
          flex items-center justify-between gap-3
          focus:outline-none focus:border-ember-500/70
          focus:ring-2 focus:ring-ember-500/20"
      >
        <div className="min-w-0 flex-1">
          {eyebrow && <p className="label-eyebrow">{eyebrow}</p>}
          <p
            className={`truncate ${
              selected ? 'text-ink-50 font-semibold' : 'text-ink-400'
            }`}
          >
            {selected ? formatLong(selected) : placeholder}
          </p>
        </div>
        <Icon name="calendar" size={18} className="text-ink-400 shrink-0" />
      </button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={`${MONTHS[view.getMonth()]} ${view.getFullYear()}`}
        eyebrow={eyebrow ?? 'Date'}
      >
        <div className="px-4 pt-3 pb-5">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="tap rounded-full p-2 text-ink-300 active:bg-ink-800/60"
              aria-label="Previous month"
            >
              <Icon name="chevron-left" size={20} />
            </button>
            <button
              type="button"
              onClick={() => setView(new Date())}
              className="tap text-xs uppercase tracking-[0.18em] text-ink-400 px-3"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="tap rounded-full p-2 text-ink-300 active:bg-ink-800/60"
              aria-label="Next month"
            >
              <Icon name="chevron-right" size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div
                key={i}
                className="text-[10px] uppercase tracking-[0.18em] text-ink-500 py-1"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {grid.map(({ date, inMonth }, i) => {
              const isSel = selected && sameYMD(date, selected);
              const isToday = sameYMD(date, today);
              const disabled =
                (minDate && date < minDate) || (maxDate && date > maxDate);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!!disabled}
                  onClick={() => pick(date)}
                  className={`relative h-10 rounded-xl text-sm num
                    ${
                      isSel
                        ? 'bg-ember-500 text-white font-bold shadow-glow'
                        : inMonth
                        ? 'text-ink-100 active:bg-ink-800/70'
                        : 'text-ink-600'
                    }
                    ${disabled ? 'opacity-30' : ''}
                  `}
                >
                  {date.getDate()}
                  {isToday && !isSel && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-ember-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Sheet>
    </>
  );
}
