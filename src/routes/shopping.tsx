import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, MapPin, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  fetchActive,
  optimizeRoute,
  togglePreso,
  type RepartoGroup,
  type ShoppingItem,
} from "@/lib/api";
import { getCategoryIcon } from "@/lib/categories";
import { clearRoute, loadRoute, saveRoute } from "@/lib/route-storage";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const SUPERMARKETS = ["Iperal", "Esselunga", "Coop", "Conad", "Lidl"] as const;

function mergePresoStatus(groups: RepartoGroup[], items: ShoppingItem[]): RepartoGroup[] {
  const presoById = new Map(items.map((i) => [i.id, i.preso]));
  return groups.map((g) => ({
    ...g,
    prodotti: g.prodotti.map((p) => ({
      ...p,
      preso: presoById.get(p.id) ?? p.preso,
    })),
  }));
}

export const Route = createFileRoute("/shopping")({
  head: () => ({ meta: [{ title: "Shopping Mode — Lista Spesa" }] }),
  component: ShoppingPage,
});

function ShoppingPage() {
  const qc = useQueryClient();
  const [supermercato, setSupermercato] = useState<string>("Iperal");
  const [route, setRoute] = useState<RepartoGroup[] | null>(null);
  const [restored, setRestored] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ["items", "active"],
    queryFn: fetchActive,
  });

  useEffect(() => {
    const saved = loadRoute();
    if (saved) {
      setSupermercato(saved.supermercato);
      setRoute(saved.percorso_ottimizzato);
      setRestored(true);
    }
  }, []);

  useEffect(() => {
    if (!route || items.length === 0) return;
    setRoute((r) => (r ? mergePresoStatus(r, items) : r));
  }, [items]);

  const optimizeMut = useMutation({
    mutationFn: async () => {
      const unchecked = items.filter((i) => !i.preso);
      if (unchecked.length === 0) {
        throw new Error("Nessun prodotto da ottimizzare");
      }
      return optimizeRoute(supermercato, unchecked);
    },
    onSuccess: (groups) => {
      setRoute(groups);
      setRestored(false);
      if (groups.length === 0) {
        toast.warning("Nessun percorso restituito");
      } else {
        saveRoute(supermercato, groups);
        toast.success("Percorso pronto");
      }
    },
    onError: (e: Error) => toast.error(e.message || "Errore"),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, preso }: { id: string; preso: boolean }) => togglePreso(id, preso),
    onMutate: async ({ id, preso }) => {
      await qc.cancelQueries({ queryKey: ["items", "active"] });
      const prev = qc.getQueryData<ShoppingItem[]>(["items", "active"]);
      qc.setQueryData<ShoppingItem[]>(["items", "active"], (old) =>
        (old ?? []).map((i) => (i.id === id ? { ...i, preso } : i)),
      );
      setRoute((r) =>
        r
          ? r.map((g) => ({
              ...g,
              prodotti: g.prodotti.map((p) => (p.id === id ? { ...p, preso } : p)),
            }))
          : r,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["items", "active"], ctx.prev);
      toast.error("Errore aggiornamento");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["items", "active"] }),
  });

  const handleResetRoute = () => {
    clearRoute();
    setRoute(null);
    setRestored(false);
    toast.info("Percorso resettato");
  };

  const remaining = items.filter((i) => !i.preso).length;
  const total = items.length;
  const done = total - remaining;
  const showSelection = route === null;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Al supermercato" subtitle="Shopping Mode" />

      <div className="retail-section flex-1 space-y-5 px-4 py-5">
        {total > 0 && !showSelection && (
          <div className="retail-card p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-bold text-foreground">Progresso spesa</span>
              <span className="font-bold text-primary">
                {done}/{total}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-primary/15">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: total > 0 ? `${(done / total) * 100}%` : "0%" }}
              />
            </div>
          </div>
        )}

        {showSelection ? (
          <>
            <section className="retail-card p-5">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Supermercato
              </label>
              <Select value={supermercato} onValueChange={setSupermercato}>
                <SelectTrigger className="h-12 rounded-xl border-border bg-white text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPERMARKETS.map((s) => (
                    <SelectItem key={s} value={s} className="text-base">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                size="lg"
                className="mt-4 h-14 w-full text-base"
                onClick={() => optimizeMut.mutate()}
                disabled={optimizeMut.isPending || remaining === 0}
              >
                {optimizeMut.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Calcolo percorso...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Ottimizza Percorso
                  </>
                )}
              </Button>

              <p className="mt-3 text-center text-sm font-semibold text-muted-foreground">
                {remaining} prodotti da prendere
              </p>
            </section>

            <div className="retail-card border-2 border-dashed border-border bg-white/60 px-6 py-12 text-center">
              <MapPin className="mx-auto mb-3 h-10 w-10 text-primary" />
              <p className="font-bold text-foreground">Pronto per iniziare</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Seleziona il supermercato e ottimizza il percorso.
              </p>
            </div>
          </>
        ) : (
          <>
            <section className="retail-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Percorso attivo
                  </p>
                  <p className="truncate text-lg font-extrabold text-foreground">{supermercato}</p>
                  {restored && (
                    <p className="text-xs text-muted-foreground">Ripristinato dalla sessione</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-primary/30 text-primary"
                  onClick={handleResetRoute}
                >
                  <RotateCcw className="mr-1.5 h-4 w-4" />
                  Resetta
                </Button>
              </div>
              <p className="mt-2 text-center text-sm font-semibold text-muted-foreground">
                {remaining} prodotti da prendere
              </p>
            </section>

            {route!.length === 0 ? (
              <div className="retail-card border-2 border-dashed border-border bg-white/60 px-6 py-10 text-center">
                <p className="text-sm text-muted-foreground">Nessun reparto restituito.</p>
              </div>
            ) : (
              <Accordion
                type="multiple"
                defaultValue={route!.map((_, i) => `r-${i}`)}
                className="space-y-3"
              >
                {route!.map((g, idx) => {
                  const totalDept = g.prodotti.length;
                  const doneDept = g.prodotti.filter((p) => p.preso).length;
                  const DeptIcon = getCategoryIcon(g.reparto);
                  const pct = totalDept > 0 ? Math.round((doneDept / totalDept) * 100) : 0;

                  return (
                    <AccordionItem
                      key={`${g.reparto}-${idx}`}
                      value={`r-${idx}`}
                      className="retail-card overflow-hidden border-0"
                    >
                      <AccordionTrigger className="px-4 py-4 hover:no-underline">
                        <div className="flex flex-1 items-center gap-3 text-left">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground">
                            {g.ordine ?? idx + 1}
                          </span>
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent">
                            <DeptIcon className="h-5 w-5 text-primary" strokeWidth={2.25} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-extrabold text-foreground">{g.reparto}</p>
                            <p className="text-xs text-muted-foreground">
                              {doneDept}/{totalDept} completati
                            </p>
                          </div>
                          <span className="shrink-0 text-xs font-bold text-primary">{pct}%</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-0">
                        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-primary/15">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {g.note_reparto && (
                          <p className="mb-3 rounded-xl bg-accent px-3 py-2 text-xs font-medium text-accent-foreground">
                            {g.note_reparto}
                          </p>
                        )}
                        <ul className="space-y-1">
                          {g.prodotti.map((p) => (
                            <li
                              key={p.id}
                              className="flex items-center gap-3 rounded-2xl px-1 py-3 transition-colors active:bg-secondary"
                            >
                              <Checkbox
                                id={`p-${p.id}`}
                                checked={p.preso}
                                onCheckedChange={(v) =>
                                  toggleMut.mutate({ id: p.id, preso: Boolean(v) })
                                }
                                className="h-8 w-8"
                              />
                              <label
                                htmlFor={`p-${p.id}`}
                                className={cn(
                                  "flex-1 cursor-pointer select-none transition-all",
                                  p.preso
                                    ? "text-muted-foreground line-through opacity-55"
                                    : "text-foreground",
                                )}
                              >
                                <span className="text-base font-bold">{p.prodotto}</span>
                                {p.quantita && (
                                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                                    {p.quantita}
                                  </span>
                                )}
                              </label>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </>
        )}
      </div>
    </div>
  );
}
