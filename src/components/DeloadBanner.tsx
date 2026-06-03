interface Props {
  weeksSince: number;
  onMarkDone: () => void;
}

export function DeloadBanner({ weeksSince, onMarkDone }: Props) {
  if (weeksSince < 6) return null;

  return (
    <div className="card border-amber-500/50 bg-amber-500/10 p-3 flex items-start gap-3">
      <div className="text-2xl leading-none">⚠️</div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-amber-200">Deload week</p>
        <p className="text-xs text-amber-200/80 mt-0.5">
          {weeksSince} weeks since last deload — drop to ~60% load for one week
          (Rule 5).
        </p>
      </div>
      <button
        type="button"
        onClick={onMarkDone}
        className="tap shrink-0 rounded-lg bg-amber-500/30 hover:bg-amber-500/40 text-amber-100 px-3 py-1.5 text-xs font-semibold"
      >
        Mark done
      </button>
    </div>
  );
}
