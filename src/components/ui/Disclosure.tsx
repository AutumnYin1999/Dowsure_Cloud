import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DisclosureProps {
  trigger: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function Disclosure({
  trigger,
  children,
  defaultOpen = false,
  className,
}: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("w-full", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="ds-focus flex w-full items-center justify-between gap-3 rounded-lg text-left"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">{trigger}</div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-ink-muted transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open ? (
        <div className="mt-3 animate-fade-in text-sm text-ink-muted">
          {children}
        </div>
      ) : null}
    </div>
  );
}
