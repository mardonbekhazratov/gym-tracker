import { Icon } from './Icon';

interface Props {
  weeksSince: number;
  onMarkDone: () => void;
}

export function DeloadBanner({ weeksSince, onMarkDone }: Props) {
  if (weeksSince < 6) return null;

  return (
    <div className="card border-amber-500/50 bg-amber-500/[0.07] p-3 flex items-start gap-3">
      <div className="w-9 h-9 shrink-0 rounded-xl grid place-items-center bg-amber-500/15 text-amber-300">
        <Icon name="caution" size={20} strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-amber-100 leading-tight">Deload week</p>
        <p className="text-xs text-amber-100/75 mt-1 leading-relaxed">
          {weeksSince} weeks since last deload — drop to ~60% load for one week
          (Rule 5).
        </p>
      </div>
      <button
        type="button"
        onClick={onMarkDone}
        className="tap shrink-0 rounded-lg bg-amber-500/25 active:bg-amber-500/35 text-amber-50 px-3 py-1.5 text-xs font-semibold"
      >
        Mark done
      </button>
    </div>
  );
}
