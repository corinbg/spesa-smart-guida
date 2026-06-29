import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  Loader2,
  Upload,
  Plus,
  Trash2,
  Sparkles,
  PencilLine,
  CheckCircle2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import {
  addAiItems,
  addManualItem,
  archiveActive,
  deleteItem,
  fetchActive,
  updateItem,
  uploadListImage,
  type ShoppingItem,
} from "@/lib/api";
import { CATEGORIE, groupItemsByCategory } from "@/lib/categories";
import { clearRoute } from "@/lib/route-storage";
import { PageHeader } from "@/components/PageHeader";
import { CategoryHeader } from "@/components/CategoryHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const editSchema = z.object({
  prodotto: z.string().trim().min(1, "Inserisci un nome").max(80),
  quantita: z.string().trim().max(40).optional(),
  categoria: z.string().optional(),
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
      clearRoute();
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

  const grouped = groupItemsByCategory(items);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="La tua lista" subtitle="Preparazione" />

      <div className="retail-section flex-1 space-y-5 px-4 py-5">
        {/* AI Upload */}
        <section className="retail-card overflow-hidden p-5">
          <div className="mb-1 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-promo/25">
              <Sparkles className="h-4 w-4 text-promo-foreground" />
            </span>
            <span className="text-sm font-bold text-foreground">Importa con AI</span>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Carica o scatta una foto della tua lista scritta a mano o stampata.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickFile}
          />
          <Button
            type="button"
            size="lg"
            className="w-full"
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
        <section className="retail-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <PencilLine className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold">Aggiungi manualmente</span>
          </div>
          <form onSubmit={onAddManual} className="space-y-3">
            <Input
              value={prodotto}
              onChange={(e) => setProdotto(e.target.value)}
              placeholder="Nome prodotto"
              maxLength={80}
            />
            <div className="flex gap-2">
              <Input
                value={quantita}
                onChange={(e) => setQuantita(e.target.value)}
                placeholder="Quantità (es. 2, 500g)"
                className="flex-1"
                maxLength={40}
              />
              <Button
                type="submit"
                size="lg"
                className="shrink-0 px-5"
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

        {/* Items list grouped by category */}
        <section>
          <div className="mb-4 flex items-baseline justify-between px-1">
            <h2 className="text-base font-extrabold text-foreground">Prodotti</h2>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              {items.length}
            </span>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="Nessun prodotto in lista"
              description="Carica una foto o aggiungi prodotti manualmente."
            />
          ) : (
            <div className="space-y-6">
              {grouped.map(({ categoria, items: catItems }) => (
                <div key={categoria}>
                  <CategoryHeader categoria={categoria} count={catItems.length} />
                  <ul className="space-y-2">
                    {catItems.map((it) => (
                      <ItemRow
                        key={it.id}
                        item={it}
                        onDelete={() => deleteMut.mutate(it.id)}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        {items.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="lg" className="w-full border-primary/30 text-primary">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Termina Spesa Settimanale
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Archiviare la spesa?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tutti i prodotti attivi saranno spostati nello Storico. Potrai consultarli
                  ma non modificarli.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Annulla</AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-xl"
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
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editProdotto, setEditProdotto] = useState(item.prodotto);
  const [editQuantita, setEditQuantita] = useState(item.quantita ?? "");
  const [editCategoria, setEditCategoria] = useState(item.categoria ?? "");

  const updateMut = useMutation({
    mutationFn: (data: { prodotto: string; quantita?: string; categoria?: string }) =>
      updateItem(item.id, data),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ["items", "active"] });
      const prev = qc.getQueryData<ShoppingItem[]>(["items", "active"]);
      qc.setQueryData<ShoppingItem[]>(["items", "active"], (old) =>
        (old ?? []).map((i) =>
          i.id === item.id
            ? {
                ...i,
                prodotto: data.prodotto,
                quantita: data.quantita?.trim() || null,
                categoria: data.categoria?.trim() || null,
              }
            : i,
        ),
      );
      return { prev };
    },
    onSuccess: () => {
      setOpen(false);
      toast.success("Prodotto aggiornato");
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["items", "active"], ctx.prev);
      toast.error("Errore nell'aggiornamento");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["items", "active"] }),
  });

  const openEdit = () => {
    setEditProdotto(item.prodotto);
    setEditQuantita(item.quantita ?? "");
    setEditCategoria(item.categoria ?? "");
    setOpen(true);
  };

  const onSave = () => {
    const parsed = editSchema.safeParse({
      prodotto: editProdotto,
      quantita: editQuantita,
      categoria: editCategoria,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dati non validi");
      return;
    }
    updateMut.mutate(parsed.data);
  };

  const categoriaOptions = [
    ...CATEGORIE,
    ...(item.categoria && !CATEGORIE.includes(item.categoria as (typeof CATEGORIE)[number])
      ? [item.categoria]
      : []),
  ];

  return (
    <>
      <li className="retail-card flex items-center gap-2 px-4 py-3.5 transition-colors">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-base font-bold text-foreground">{item.prodotto}</p>
            {item.extra ? (
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
            {item.quantita && <span>{item.quantita}</span>}
            {item.quantita && item.categoria && <span>·</span>}
            {item.categoria && <span>{item.categoria}</span>}
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:bg-accent hover:text-primary"
          onClick={openEdit}
          aria-label="Modifica"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
          aria-label="Elimina"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </li>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-extrabold">Modifica prodotto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor={`edit-prodotto-${item.id}`}>Nome</Label>
              <Input
                id={`edit-prodotto-${item.id}`}
                value={editProdotto}
                onChange={(e) => setEditProdotto(e.target.value)}
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-quantita-${item.id}`}>Quantità</Label>
              <Input
                id={`edit-quantita-${item.id}`}
                value={editQuantita}
                onChange={(e) => setEditQuantita(e.target.value)}
                placeholder="es. 2, 500g"
                maxLength={40}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={editCategoria || "__none__"} onValueChange={(v) => setEditCategoria(v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Seleziona categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nessuna categoria</SelectItem>
                  {categoriaOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button onClick={onSave} disabled={updateMut.isPending}>
              {updateMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Salva"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="retail-card border-2 border-dashed border-border bg-white/60 px-6 py-10 text-center">
      <p className="font-bold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
