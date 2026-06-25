import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Loader2, Upload, Plus, Trash2, Sparkles, PencilLine, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import {
  addAiItems,
  addManualItem,
  archiveActive,
  deleteItem,
  fetchActive,
  uploadListImage,
  type ShoppingItem,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/preparazione")({
  head: () => ({ meta: [{ title: "Preparazione — Lista Spesa" }] }),
  component: PreparazionePage,
});

const manualSchema = z.object({
  prodotto: z.string().trim().min(1, "Inserisci un nome").max(80),
  quantita: z.string().trim().max(40).optional(),
});

function PreparazionePage() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items", "active"],
    queryFn: fetchActive,
  });

  const fileRef = useRef<HTMLInputElement>(null);
  const [prodotto, setProdotto] = useState("");
  const [quantita, setQuantita] = useState("");

  const uploadMut = useMutation({
    mutationFn: uploadListImage,
    onSuccess: async (aiItems) => {
      if (!aiItems?.length) {
        toast.warning("Nessun prodotto rilevato nell'immagine");
        return;
      }
      await addAiItems(aiItems);
      qc.invalidateQueries({ queryKey: ["items", "active"] });
      toast.success(`Lista importata (${aiItems.length} prodotti)`);
    },
    onError: (e: Error) => toast.error(e.message || "Errore durante il caricamento"),
  });

  const addMut = useMutation({
    mutationFn: addManualItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items", "active"] });
      setProdotto("");
      setQuantita("");
      toast.success("Prodotto aggiunto");
    },
    onError: () => toast.error("Errore nell'aggiunta"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items", "active"] }),
  });

  const archiveMut = useMutation({
    mutationFn: archiveActive,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      toast.success("Spesa archiviata");
    },
    onError: () => toast.error("Errore nell'archiviazione"),
  });

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) uploadMut.mutate(f);
    e.target.value = "";
  };

  const onAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = manualSchema.safeParse({ prodotto, quantita });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dati non validi");
      return;
    }
    addMut.mutate(parsed.data);
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-5 pt-6 pb-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Preparazione
          </p>
          <h1 className="truncate text-2xl font-bold tracking-tight">La tua lista</h1>
        </div>
        <ThemeToggle />
      </header>

      <div className="space-y-5 px-5 pb-6">
        {/* AI Upload */}
        <section className="rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5 ring-1 ring-primary/10">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Importa con AI</span>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Scatta una foto della tua lista scritta a mano o stampata.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onPickFile}
          />
          <Button
            type="button"
            size="lg"
            className="w-full rounded-2xl"
            onClick={() => fileRef.current?.click()}
            disabled={uploadMut.isPending}
          >
            {uploadMut.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisi in corso...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Carica foto lista
              </>
            )}
          </Button>
        </section>

        {/* Manual add */}
        <section className="rounded-3xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <PencilLine className="h-4 w-4" />
            <span>Aggiungi manualmente</span>
          </div>
          <form onSubmit={onAddManual} className="space-y-2.5">
            <Input
              value={prodotto}
              onChange={(e) => setProdotto(e.target.value)}
              placeholder="Nome prodotto"
              className="h-11 rounded-xl"
              maxLength={80}
            />
            <div className="flex gap-2">
              <Input
                value={quantita}
                onChange={(e) => setQuantita(e.target.value)}
                placeholder="Quantità (es. 2, 500g)"
                className="h-11 flex-1 rounded-xl"
                maxLength={40}
              />
              <Button
                type="submit"
                size="lg"
                variant="secondary"
                className="rounded-xl px-4"
                disabled={addMut.isPending}
                aria-label="Aggiungi"
              >
                {addMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
              </Button>
            </div>
          </form>
        </section>

        {/* Items list */}
        <section>
          <div className="mb-3 flex items-baseline justify-between px-1">
            <h2 className="text-sm font-semibold">Prodotti</h2>
            <span className="text-xs text-muted-foreground">{items.length}</span>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="Nessun prodotto in lista"
              description="Carica una foto o aggiungi prodotti manualmente."
            />
          ) : (
            <ul className="space-y-2">
              {items.map((it) => (
                <ItemRow
                  key={it.id}
                  item={it}
                  onDelete={() => deleteMut.mutate(it.id)}
                />
              ))}
            </ul>
          )}
        </section>

        {items.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="lg" className="w-full rounded-2xl">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Termina Spesa Settimanale
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archiviare la spesa?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tutti i prodotti attivi saranno spostati nello Storico. Potrai consultarli
                  ma non modificarli.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => archiveMut.mutate()}
                  disabled={archiveMut.isPending}
                >
                  Archivia
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}

function ItemRow({ item, onDelete }: { item: ShoppingItem; onDelete: () => void }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{item.prodotto}</p>
          {item.extra ? (
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
          {item.quantita && <span>{item.quantita}</span>}
          {item.quantita && item.categoria && <span>·</span>}
          {item.categoria && <span>{item.categoria}</span>}
        </div>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
        onClick={onDelete}
        aria-label="Elimina"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
