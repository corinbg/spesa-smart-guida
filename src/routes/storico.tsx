import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, History } from "lucide-react";

import { fetchArchived, type ShoppingItem } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/storico")({
  head: () => ({ meta: [{ title: "Storico — Lista Spesa" }] }),
  component: StoricoPage,
});

const dateFmt = new Intl.DateTimeFormat("it-IT", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function groupByDay(items: ShoppingItem[]) {
  const map = new Map<string, { label: string; items: ShoppingItem[] }>();
  for (const it of items) {
    const ref = it.archived_at ?? it.created_at;
    const d = new Date(ref);
    const key = d.toISOString().slice(0, 10);
    if (!map.has(key)) {
      map.set(key, { label: dateFmt.format(d), items: [] });
    }
    map.get(key)!.items.push(it);
  }
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, v]) => ({ key, ...v }));
}

function StoricoPage() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items", "archived"],
    queryFn: fetchArchived,
  });

  const groups = groupByDay(items);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-5 pt-6 pb-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Storico
          </p>
          <h1 className="truncate text-2xl font-bold tracking-tight">Spese passate</h1>
        </div>
        <ThemeToggle />
      </header>

      <div className="space-y-5 px-5 pb-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
            <History className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">Nessuna spesa archiviata</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Le liste archiviate appariranno qui.
            </p>
          </div>
        ) : (
          groups.map((g) => (
            <section key={g.key}>
              <h2 className="mb-2 px-1 text-sm font-semibold capitalize text-muted-foreground">
                {g.label}
              </h2>
              <ul className="space-y-2">
                {g.items.map((it) => (
                  <li
                    key={it.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{it.prodotto}</p>
                        {it.extra ? (
                          <Badge variant="secondary" className="shrink-0 text-[10px]">
                            Extra
                          </Badge>
                        ) : (
                          <Badge className="shrink-0 bg-primary/15 text-primary text-[10px] hover:bg-primary/15">
                            AI
                          </Badge>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        {it.quantita && <span>{it.quantita}</span>}
                        {it.quantita && it.categoria && <span>·</span>}
                        {it.categoria && <span>{it.categoria}</span>}
                      </div>
                    </div>
                    {it.preso && (
                      <Badge
                        variant="outline"
                        className="shrink-0 border-success/40 text-success text-[10px]"
                      >
                        Preso
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
