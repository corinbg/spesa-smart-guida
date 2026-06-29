import { getCategoryIcon } from "@/lib/categories";
import { cn } from "@/lib/utils";

type CategoryHeaderProps = {
  categoria: string;
  count?: number;
  progress?: { done: number; total: number };
};

export function CategoryHeader({ categoria, count, progress }: CategoryHeaderProps) {
  const Icon = getCategoryIcon(categoria);
  const pct =
    progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : null;
  const isComplete = pct === 100;

  return (
    <div className="mb-3">
      <div className="flex items-center gap-3 rounded-xl bg-accent px-3 py-2.5 ring-1 ring-primary/10">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20">
          <Icon className="h-5 w-5 text-primary" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-extrabold text-foreground">{categoria}</h3>
          {count !== undefined && (
            <p className="text-xs text-muted-foreground">
              {count} {count === 1 ? "prodotto" : "prodotti"}
            </p>
          )}
        </div>
        {pct !== null && (
          <span
            className={cn(
              "shrink-0 text-xs font-bold",
              isComplete ? "text-promo" : "text-primary",
            )}
          >
            {isComplete ? "✓ " : ""}
            {pct}%
          </span>
        )}
      </div>
      {pct !== null && (
        <div className="dopamine-progress-track mt-1.5">
          <div
            className={cn("dopamine-progress-fill", isComplete && "is-complete")}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
