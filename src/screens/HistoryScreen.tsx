import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db, type Session } from '../db/db';
import { listSessions, setsForSession } from '../db/queries';
import { formatDateLong } from '../lib/dates';
import { Icon } from '../components/Icon';

interface Row {
  session: Session;
  setCount: number;
  label: string;
}

export function HistoryScreen() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const sessions = await listSessions();
      const templates = await db.dayTemplates.toArray();
      const labelByKey = new Map(templates.map((t) => [t.key, t.label]));
      const built: Row[] = [];
      for (const s of sessions) {
        const sets = await setsForSession(s.id!);
        if (sets.length === 0) continue; // skip empty auto-created sessions
        built.push({
          session: s,
          setCount: sets.length,
          label: labelByKey.get(s.dayKey) ?? s.dayKey,
        });
      }
      built.sort((a, b) => (a.session.date < b.session.date ? 1 : -1));
      setRows(built);
      setLoading(false);
    }
    void load();
  }, []);

  return (
    <div className="px-4 pt-4 pb-6 max-w-xl mx-auto space-y-4">
      <header>
        <p className="label-eyebrow flex items-center gap-1.5">
          <span className="inline-block w-1 h-1 rounded-full bg-ember-500" />
          Log
        </p>
        <h1 className="display text-[40px] leading-[1.05] mt-1.5 text-ink-50">
          History
        </h1>
      </header>

      {loading && <p className="text-ink-400 text-sm">Loading…</p>}

      {!loading && rows.length === 0 && (
        <div className="card p-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-ink-800/60 grid place-items-center text-ink-400 mb-3">
            <Icon name="history" size={24} />
          </div>
          <p className="text-ink-300 text-sm">
            No sessions yet — log your first set on the Today tab.
          </p>
        </div>
      )}

      <ul className="space-y-2">
        {rows.map(({ session, setCount, label }) => (
          <li key={session.id}>
            <Link
              to={`/history/${session.id}`}
              className="tap card flex items-center justify-between px-4 py-3.5"
            >
              <div className="min-w-0">
                <p className="font-semibold text-ink-50 truncate tracking-tighter-">
                  {label}
                </p>
                <p className="text-xs text-ink-400 mt-0.5 num">
                  {formatDateLong(session.date)} · {setCount} set
                  {setCount === 1 ? '' : 's'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[10px] uppercase tracking-[0.18em] font-semibold rounded-full px-2 py-0.5
                    ${
                      session.completed
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-ink-800 text-ink-300'
                    }`}
                >
                  {session.completed ? 'Done' : 'Open'}
                </span>
                <Icon name="chevron-right" size={16} className="text-ink-500" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
