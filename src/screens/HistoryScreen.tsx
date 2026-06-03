import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db, type Session } from '../db/db';
import { listSessions, setsForSession } from '../db/queries';
import { formatDateLong } from '../lib/dates';

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
        built.push({
          session: s,
          setCount: sets.length,
          label: labelByKey.get(s.dayKey) ?? s.dayKey,
        });
      }
      setRows(built);
      setLoading(false);
    }
    void load();
  }, []);

  if (loading) {
    return (
      <div className="px-4 pt-5 pb-4">
        <h1 className="text-2xl font-bold mb-3">History</h1>
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-4 max-w-xl mx-auto space-y-3">
      <h1 className="text-2xl font-bold">History</h1>

      {rows.length === 0 && (
        <p className="text-slate-400 text-sm">
          No sessions yet — log your first set on the Today tab.
        </p>
      )}

      <ul className="space-y-2">
        {rows.map(({ session, setCount, label }) => (
          <li key={session.id}>
            <Link
              to={`/history/${session.id}`}
              className="tap card flex items-center justify-between px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-semibold truncate">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatDateLong(session.date)} · {setCount} set
                  {setCount === 1 ? '' : 's'}
                </p>
              </div>
              <span
                className={`text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 ${
                  session.completed
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {session.completed ? 'Done' : 'Open'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
