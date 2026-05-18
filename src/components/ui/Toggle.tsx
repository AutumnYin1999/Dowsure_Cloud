import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  hint?: string;
  id?: string;
}

export function Toggle({ checked, onChange, label, hint, id }: ToggleProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-surface-line bg-white p-3.5 transition-colors hover:border-brand-200 sm:p-4"
    >
      <div className="flex flex-col">
        {label ? (
          <span className="text-sm font-medium text-ink">{label}</span>
        ) : null}
        {hint ? (
          <span className="mt-0.5 text-xs text-ink-soft">{hint}</span>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "ds-focus relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-brand-600" : "bg-surface-line"
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </button>
    </label>
  );
}
