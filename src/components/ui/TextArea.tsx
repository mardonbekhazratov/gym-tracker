interface TextAreaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  eyebrow?: string;
  className?: string;
}

export function TextArea({ eyebrow, className = '', ...props }: TextAreaProps) {
  return (
    <label className="block">
      {eyebrow && <span className="label-eyebrow">{eyebrow}</span>}
      <textarea
        {...props}
        className={`w-full rounded-xl bg-ink-900/80 border border-ink-700/70
          text-ink-100 text-base font-normal px-3.5 py-3 leading-relaxed
          focus:outline-none focus:border-ember-500/70
          focus:ring-2 focus:ring-ember-500/20
          placeholder:text-ink-500 resize-none
          ${eyebrow ? 'mt-1' : ''} ${className}`}
      />
    </label>
  );
}
