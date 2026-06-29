import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, History } from "lucide-react";

import { fetchArchived, type ShoppingItem } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
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
      <PageHeader title="Spese passate" subtitle="Storico" />

      <div className="retail-section flex-1 space-y-5 px-4 py-5">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : groups.length === 0 ? (
          <div className="retail-card border-2 border-dashed border-primary/25 bg-card/60 px-6 py-12 text-center">
            <History className="mx-auto mb-3 h-10 w-10 text-primary" />
            <p className="font-bold text-foreground">Nessuna spesa archiviata</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Le liste archiviate appariranno qui.
            </p>
          </div>
        ) : (
          groups.map((g) => (
            <section key={g.key}>
              <h2 className="mb-3 rounded-xl bg-accent px-3 py-2 text-sm font-extrabold capitalize text-foreground">
                {g.label}
              </h2>
              <ul className="space-y-2">
                {g.items.map((it) => (
                  <li
                    key={it.id}
                    className="retail-card flex items-center gap-3 px-4 py-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-base font-bold text-foreground">{it.prodotto}</p>
                        {it.extra ? (
                          <Badge variant="promo" className="shrink-0 text-[10px]">
                            Extra
                          </Badge>
                        ) : (
                          <Badge className="shrink-0 bg-accent text-primary text-[10px] hover:bg-accent">
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
                        className="shrink-0 border-primary/40 text-primary text-[10px]"
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
