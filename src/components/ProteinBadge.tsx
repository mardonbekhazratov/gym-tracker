import { Link } from 'react-router-dom';
import { Icon } from './Icon';

interface Props {
  grams: number | null;
}

export function ProteinBadge({ grams }: Props) {
  if (!grams) {
    return (
      <Link
        to="/settings"
        className="card flex items-center justify-between px-3.5 py-2.5 text-xs"
      >
        <span className="text-ink-200 inline-flex items-center gap-2">
          <Icon name="protein" size={16} className="text-ember-400" />
          Set your bodyweight for a protein target
        </span>
        <span className="text-ember-400 inline-flex items-center gap-1">
          Settings
          <Icon name="chevron-right" size={14} />
        </span>
      </Link>
    );
  }

  return (
    <div className="card flex items-center justify-between px-3.5 py-2.5 text-xs">
      <span className="text-ink-200 inline-flex items-center gap-2">
        <Icon name="protein" size={16} className="text-ember-400" />
        Daily protein target
      </span>
      <span className="font-semibold text-ink-50 num">{grams} g</span>
    </div>
  );
}
