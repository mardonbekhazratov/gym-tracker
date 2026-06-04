import type { Exercise } from '../db/db';
import { Sheet } from './ui/Sheet';
import { Icon } from './Icon';

interface Props {
  exercise: Exercise;
  current: string | null;
  onClose: () => void;
  onSelect: (alternative: string | null) => void;
}

export function ExerciseSwapSheet({
  exercise,
  current,
  onClose,
  onSelect,
}: Props) {
  return (
    <Sheet
      open
      onClose={onClose}
      eyebrow="Swap exercise"
      title={exercise.name}
    >
      <ul className="p-3 space-y-1.5">
        <li>
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              onClose();
            }}
            className={`tap w-full text-left rounded-xl px-4 py-3.5 border flex items-center justify-between gap-3
              ${
                current == null
                  ? 'bg-ember-500/12 border-ember-500/40'
                  : 'bg-ink-800/40 border-transparent'
              }`}
          >
            <div className="min-w-0">
              <span className="font-semibold text-ink-50">Use as written</span>
              <span className="block text-xs text-ink-400 mt-0.5">
                {exercise.name}
              </span>
            </div>
            {current == null && (
              <Icon name="check" size={18} className="text-ember-400 shrink-0" />
            )}
          </button>
        </li>
        {exercise.alternatives.map((alt) => (
          <li key={alt}>
            <button
              type="button"
              onClick={() => {
                onSelect(alt);
                onClose();
              }}
              className={`tap w-full text-left rounded-xl px-4 py-3.5 border flex items-center justify-between gap-3
                ${
                  current === alt
                    ? 'bg-ember-500/12 border-ember-500/40'
                    : 'bg-ink-800/40 border-transparent'
                }`}
            >
              <div className="min-w-0">
                <span className="font-semibold text-ink-50">{alt}</span>
                <span className="block text-xs text-ink-400 mt-0.5">
                  Logs under {exercise.name}
                </span>
              </div>
              {current === alt && (
                <Icon
                  name="check"
                  size={18}
                  className="text-ember-400 shrink-0"
                />
              )}
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
