import { getCategoryIcon } from "@/lib/categories";

type CategoryHeaderProps = {
  categoria: string;
  count?: number;
  progress?: { done: number; total: number };
};

export function CategoryHeader({ categoria, count, progress }: CategoryHeaderProps) {
  const Icon = getCategoryIcon(categoria);
  const pct =
    progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : null;

  return (
    <div className="mb-3">
      <div className="flex items-center gap-3 rounded-xl bg-accent px-3 py-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
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
          <span className="shrink-0 text-xs font-bold text-primary">{pct}%</span>
        )}
      </div>
      {pct !== null && (
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-primary/15">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
