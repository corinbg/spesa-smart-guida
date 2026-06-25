import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, MapPin, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  fetchActive,
  optimizeRoute,
  togglePreso,
  type RepartoGroup,
  type ShoppingItem,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ThemeToggle } from "@/components/ThemeToggle";
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

export const Route = createFileRoute("/shopping")({
  head: () => ({ meta: [{ title: "Shopping Mode — Lista Spesa" }] }),
  component: ShoppingPage,
});

function ShoppingPage() {
  const qc = useQueryClient();
  const [supermercato, setSupermercato] = useState<string>("Iperal");
  const [route, setRoute] = useState<RepartoGroup[] | null>(null);

  const { data: items = [] } = useQuery({
    queryKey: ["items", "active"],
    queryFn: fetchActive,
  });

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
      if (groups.length === 0) toast.warning("Nessun percorso restituito");
      else toast.success("Percorso pronto");
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

  const remaining = items.filter((i) => !i.preso).length;

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-5 pt-6 pb-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Shopping Mode
          </p>
          <h1 className="truncate text-2xl font-bold tracking-tight">Al supermercato</h1>
        </div>
        <ThemeToggle />
      </header>

      <div className="space-y-5 px-5 pb-6">
        <section className="rounded-3xl border border-border bg-card p-5">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Supermercato
          </label>
          <Select value={supermercato} onValueChange={setSupermercato}>
            <SelectTrigger className="h-12 rounded-xl text-base">
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
            className="mt-3 h-14 w-full rounded-2xl text-base"
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

          <p className="mt-3 text-center text-xs text-muted-foreground">
            {remaining} prodotti da prendere
          </p>
        </section>

        {route === null ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
            <MapPin className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">Pronto per iniziare</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Seleziona il supermercato e ottimizza il percorso.
            </p>
          </div>
        ) : route.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">Nessun reparto restituito.</p>
          </div>
        ) : (
          <Accordion
            type="multiple"
            defaultValue={route.map((_, i) => `r-${i}`)}
            className="space-y-3"
          >
            {route.map((g, idx) => {
              const total = g.prodotti.length;
              const done = g.prodotti.filter((p) => p.preso).length;
              return (
                <AccordionItem
                  key={`${g.reparto}-${idx}`}
                  value={`r-${idx}`}
                  className="overflow-hidden rounded-3xl border border-border bg-card"
                >
                  <AccordionTrigger className="px-4 py-4 hover:no-underline">
                    <div className="flex flex-1 items-center gap-3 text-left">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                        {g.ordine ?? idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{g.reparto}</p>
                        <p className="text-xs text-muted-foreground">
                          {done}/{total} completati
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    {g.note_reparto && (
                      <p className="mb-3 rounded-xl bg-accent px-3 py-2 text-xs text-accent-foreground">
                        {g.note_reparto}
                      </p>
                    )}
                    <ul className="space-y-1">
                      {g.prodotti.map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center gap-3 rounded-2xl px-2 py-3 transition-colors"
                        >
                          <Checkbox
                            id={`p-${p.id}`}
                            checked={p.preso}
                            onCheckedChange={(v) =>
                              toggleMut.mutate({ id: p.id, preso: Boolean(v) })
                            }
                            className="h-7 w-7 rounded-lg"
                          />
                          <label
                            htmlFor={`p-${p.id}`}
                            className={cn(
                              "flex-1 cursor-pointer select-none text-base transition-all",
                              p.preso && "text-muted-foreground line-through opacity-60",
                            )}
                          >
                            <span className="font-medium">{p.prodotto}</span>
                            {p.quantita && (
                              <span className="ml-2 text-sm text-muted-foreground">
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
      </div>
    </div>
  );
}
