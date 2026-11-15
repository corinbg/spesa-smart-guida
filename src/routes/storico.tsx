import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, History } from "lucide-react";

import { fetchArchived, fetchReceipts, type ShoppingItem } from "@/lib/api";
import { formatEuro, monthlyTotal } from "@/lib/receipts";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/storico")({
  head: () => ({ meta: [
    { title: "Storico spese — Spesa Smart" },
    { name: "description", content: "Consulta gli scontrini passati e il totale delle spese del mese." },
    { property: "og:title", content: "Storico spese — Spesa Smart" },
    { property: "og:description", content: "Consulta gli scontrini passati e il totale delle spese del mese." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
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
    map.get(key)?.items.push(it);
  }
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, v]) => ({ key, ...v }));
}

function StoricoPage() {
  const { data: items = [], isLoading, isError } = useQuery({
    queryKey: ["items", "archived"],
    queryFn: fetchArchived,
  });

  const { data: receipts = [], isLoading: loadingReceipts, isError: receiptError } = useQuery({
    queryKey: ["receipts"], queryFn: fetchReceipts,
  });
  const groups = [
    ...receipts.map((receipt) => ({
      key: receipt.id,
      label: dateFmt.format(new Date(receipt.archived_at)),
      timestamp: receipt.archived_at,
      total: receipt.total_cents,
      supermarket: receipt.supermarket,
      items: items.filter((item) => item.receipt_id === receipt.id),
    })),
    ...groupByDay(items.filter((item) => !item.receipt_id)).map((group) => ({
      ...group, timestamp: group.key, total: null, supermarket: null,
    })),
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const missingTotals = receipts.filter((receipt) => {
    const date = new Date(receipt.archived_at);
    const now = new Date();
    return receipt.total_cents === null && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }).length;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Spese passate" subtitle="Storico" />

      <div className="retail-section flex-1 space-y-5 px-4 py-5">
        {isLoading || loadingReceipts ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : isError || receiptError ? (
          <p role="alert" className="text-sm text-destructive">Impossibile caricare lo Storico. Riprova tra poco.</p>
        ) : groups.length === 0 ? (
          <div className="retail-card border-2 border-dashed border-primary/25 bg-card/60 px-6 py-12 text-center">
            <History className="mx-auto mb-3 h-10 w-10 text-primary" />
            <p className="font-bold text-foreground">Nessuna spesa archiviata</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Le liste archiviate appariranno qui.
            </p>
          </div>
        ) : (
          <>
          <div className="border-b border-border pb-5">
            <p className="text-sm font-semibold text-muted-foreground">Totale registrato · {new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" }).format(new Date())}</p>
            <p className="mt-1 text-3xl font-extrabold text-primary">{formatEuro(monthlyTotal(receipts))}</p>
            {missingTotals > 0 && <p className="mt-1 text-xs text-muted-foreground">{missingTotals} spese senza totale escluse</p>}
          </div>
          {groups.map((g) => (
            <section key={g.key}>
              <div className="mb-3 space-y-1 border-b border-border pb-3">
                <h2 className="text-sm font-extrabold capitalize text-foreground">{g.label}</h2>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">{g.supermarket && `${g.supermarket} · `}{g.items.filter((item) => item.preso).length} presi su {g.items.length} prodotti</p>
                  <Badge variant="outline" className="border-primary/30 text-primary">{g.total === null ? "Totale non inserito" : formatEuro(g.total)}</Badge>
                </div>
              </div>
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
          ))}
          </>
        )}
      </div>
    </div>
  );
}
