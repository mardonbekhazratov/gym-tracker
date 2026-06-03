import { Link } from 'react-router-dom';

interface Props {
  grams: number | null;
}

export function ProteinBadge({ grams }: Props) {
  if (!grams) {
    return (
      <Link
        to="/settings"
        className="card flex items-center justify-between px-3 py-2 text-xs"
      >
        <span className="text-slate-300">
          🥩 Set your bodyweight for a protein target
        </span>
        <span className="text-brand-500">Settings →</span>
      </Link>
    );
  }

  return (
    <div className="card flex items-center justify-between px-3 py-2 text-xs">
      <span className="text-slate-300">🥩 Daily protein target</span>
      <span className="font-semibold text-slate-100">{grams} g</span>
    </div>
  );
}
