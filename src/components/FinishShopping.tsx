import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { archiveActive } from "@/lib/api";
import { parseReceiptTotal } from "@/lib/receipts";
import { clearRoute } from "@/lib/route-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function FinishShopping({ supermarket, onArchived }: { supermarket?: string; onArchived?: () => void }) {
  const [open, setOpen] = useState(false);
  const [total, setTotal] = useState("");
  const [error, setError] = useState("");
  const qc = useQueryClient();
  const archive = useMutation({
    mutationFn: archiveActive,
    onSuccess: async () => {
      clearRoute();
      onArchived?.();
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["items"] }),
        qc.invalidateQueries({ queryKey: ["receipts"] }),
      ]);
      setOpen(false);
      setTotal("");
      toast.success("Spesa archiviata nello Storico");
    },
    onError: () => setError("Salvataggio non riuscito. Riprova: la lista non è stata archiviata."),
  });
  return (
    <Dialog open={open} onOpenChange={(value) => { if (!archive.isPending) { setOpen(value); setError(""); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="w-full border-primary/30 text-primary">
          <CheckCircle2 className="mr-2 h-5 w-5" />Termina spesa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Totale dello scontrino</DialogTitle>
          <DialogDescription>I prodotti della lista saranno spostati nello Storico. Il totale è facoltativo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => {
          event.preventDefault();
          try {
            setError("");
            archive.mutate({ totalCents: parseReceiptTotal(total), supermarket });
          } catch (e) { setError(e instanceof Error ? e.message : "Importo non valido"); }
        }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="receipt-total">Totale (€) · facoltativo</Label>
            <Input id="receipt-total" inputMode="decimal" placeholder="64,80" value={total}
              onChange={(e) => setTotal(e.target.value)} disabled={archive.isPending} autoFocus
              aria-invalid={Boolean(error)} aria-describedby={error ? "receipt-error" : undefined} />
            {error && <p id="receipt-error" role="alert" className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={archive.isPending}>Annulla</Button>
            <Button type="submit" disabled={archive.isPending}>
              {archive.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {total.trim() ? "Salva e archivia" : "Archivia senza totale"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}