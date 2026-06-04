import { useEffect, useRef, useState } from 'react';

interface NumberFieldProps {
  value: string;
  onChange: (next: string) => void;
  onCommit?: (next: string) => void;
  placeholder?: string;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
  /** Whether to show stepper buttons (+/-). Off for compact set-row entry. */
  stepper?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function NumberField({
  value,
  onChange,
  onCommit,
  placeholder,
  suffix,
  step = 1,
  min,
  max,
  stepper = false,
  className = '',
  ariaLabel,
}: NumberFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [internal, setInternal] = useState(value);

  useEffect(() => setInternal(value), [value]);

  function clamp(n: number) {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  }

  function commit(v: string) {
    onChange(v);
    onCommit?.(v);
  }

  function bump(delta: number) {
    const n = parseFloat(internal);
    const base = Number.isFinite(n) ? n : min ?? 0;
    const next = clamp(Math.round((base + delta) * 100) / 100);
    const s = String(next);
    setInternal(s);
    commit(s);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    // Only digits, optional decimal point
    if (/^-?\d*\.?\d*$/.test(v)) {
      setInternal(v);
      onChange(v);
    }
  }

  return (
    <div className={`relative ${className}`}>
      {stepper && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => bump(-step)}
          className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7
            rounded-lg bg-ink-800/80 text-ink-200 grid place-items-center
            active:scale-95 transition-transform"
          aria-label="Decrement"
        >
          <span className="text-base font-bold leading-none">−</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={internal}
        onChange={handleChange}
        onBlur={() => commit(internal)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
          }
        }}
        className={`field ${stepper ? 'px-10' : ''} ${suffix ? 'pr-7' : ''}`}
      />
      {stepper && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => bump(step)}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7
            rounded-lg bg-ink-800/80 text-ink-200 grid place-items-center
            active:scale-95 transition-transform"
          aria-label="Increment"
        >
          <span className="text-base font-bold leading-none">+</span>
        </button>
      )}
      {!stepper && suffix && (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-[0.15em] text-ink-500 pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}
