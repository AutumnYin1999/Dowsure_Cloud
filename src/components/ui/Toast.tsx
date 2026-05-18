import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ToastState {
  id: number;
  message: string;
}

let push: ((msg: string) => void) | null = null;

export function showToast(message: string) {
  push?.(message);
}

export function ToastHost() {
  const [items, setItems] = useState<ToastState[]>([]);

  useEffect(() => {
    push = (message: string) => {
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev, { id, message }]);
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, 2200);
    };
    return () => {
      push = null;
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-center gap-2 rounded-full border border-surface-line bg-white px-4 py-2 text-sm text-ink shadow-pop animate-fade-in"
          )}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-emerald/15 text-accent-emerald">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
