import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  hint?: string;
  id?: string;
  /** 深色 Agent OS 风格。 */
  dark?: boolean;
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
  id,
  dark,
}: ToggleProps) {
  if (dark) {
    return (
      <label
        htmlFor={id}
        className={cn(
          "dow-toggle-card",
          checked && "dow-toggle-card-active"
        )}
      >
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all",
              checked
                ? "border-transparent bg-[linear-gradient(135deg,#22d3ee_0%,#a757ff_60%,#5b87ff_100%)] text-white shadow-[0_0_18px_-2px_rgba(34,211,238,0.55)]"
                : "border-[rgba(180,150,255,0.25)] bg-white/[0.04] text-transparent"
            )}
          >
            <Check className="h-4 w-4" strokeWidth={3} />
          </span>
          <div className="min-w-0">
            {label ? (
              <span className="block text-sm font-medium text-white">
                {label}
              </span>
            ) : null}
            {hint ? (
              <span className="mt-0.5 block text-xs text-[rgba(226,219,255,0.65)]">
                {hint}
              </span>
            ) : null}
          </div>
        </div>
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={cn(
            "dow-focus relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
            checked
              ? "bg-[linear-gradient(135deg,#ff5bb0,#a757ff_55%,#5b87ff)]"
              : "bg-white/[0.08]"
          )}
          style={{ border: "1px solid rgba(180,150,255,0.2)" }}
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
