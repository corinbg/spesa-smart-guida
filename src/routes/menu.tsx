import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef } from "react";
import {
  Loader2,
  Upload,
  Settings,
  Trash2,
  Sparkles,
  History,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";

import {
  deleteMealPlan,
  fetchMealPlan,
  GIORNI_ORDER,
  uploadMealPlanImage,
  type Meal,
  type MealPlanDay,
} from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const Route = createFileRoute("/menu")({
  head: () => ({ meta: [{ title: "Menu — Piano Alimentare" }] }),
  component: MenuPage,
});

// JS getDay(): 0=Domenica, 1=Lunedì ... 6=Sabato
const DAY_INDEX_TO_NAME: Record<number, string> = {
  0: "Domenica",
  1: "Lunedì",
  2: "Martedì",
  3: "Mercoledì",
  4: "Giovedì",
  5: "Venerdì",
  6: "Sabato",
};

const MEAL_EMOJI: Array<{ match: RegExp; emoji: string }> = [
  { match: /colaz/i, emoji: "☕" },
  { match: /spunt/i, emoji: "🥐" },
  { match: /pranz/i, emoji: "🍝" },
  { match: /meren/i, emoji: "🍎" },
  { match: /cena/i, emoji: "🍽️" },
];

function emojiForTipo(tipo: string): string {
  return MEAL_EMOJI.find((m) => m.match.test(tipo))?.emoji ?? "🍽️";
}

function MenuPage() {
  const qc = useQueryClient();
  const { data: plan = [], isLoading } = useQuery({
    queryKey: ["meal_plan"],
    queryFn: fetchMealPlan,
  });

  const fileRef = useRef<HTMLInputElement>(null);

  const uploadMut = useMutation({
    mutationFn: uploadMealPlanImage,
    onSuccess: (days) => {
      qc.invalidateQueries({ queryKey: ["meal_plan"] });
      if (!days.length) {
        toast.warning("Nessun giorno rilevato nell'immagine");
      } else {
        toast.success(`Piano caricato (${days.length} giorni)`);
      }
    },
    onError: (e: Error) => toast.error(e.message || "Errore nel caricamento del piano"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteMealPlan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meal_plan"] });
      toast.success("Piano eliminato");
    },
    onError: () => toast.error("Errore nell'eliminazione"),
  });

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) uploadMut.mutate(f);
    e.target.value = "";
  };

  const todayName = useMemo(() => DAY_INDEX_TO_NAME[new Date().getDay()], []);
  const orderedDays = useMemo(
    () =>
      [...plan].sort(
        (a, b) =>
          GIORNI_ORDER.indexOf(a.giorno as (typeof GIORNI_ORDER)[number]) -
          GIORNI_ORDER.indexOf(b.giorno as (typeof GIORNI_ORDER)[number]),
      ),
    [plan],
  );

  const defaultOpen = useMemo(() => {
    const todayDay = orderedDays.find((d) => d.giorno === todayName);
    return todayDay?.id ?? orderedDays[0]?.id ?? "";
  }, [orderedDays, todayName]);

  const hasPlan = orderedDays.length > 0;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Il tuo menu"
        subtitle="Piano alimentare settimanale"
        trailing={
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 shrink-0 rounded-full text-primary-foreground hover:bg-white/15 hover:text-primary-foreground"
                aria-label="Impostazioni"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 rounded-2xl p-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-destructive hover:bg-destructive/10"
                    disabled={!hasPlan || deleteMut.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    Elimina Piano Attuale
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminare il piano?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Il piano alimentare settimanale verrà rimosso. Potrai caricarne uno nuovo.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Annulla</AlertDialogCancel>
                    <AlertDialogAction
                      className="rounded-xl"
                      onClick={() => deleteMut.mutate()}
                    >
                      Elimina
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </PopoverContent>
          </Popover>
        }
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPickFile}
      />

      <div className="retail-section flex-1 space-y-5 px-4 py-5">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : !hasPlan ? (
          <EmptyState
            uploading={uploadMut.isPending}
            onUpload={() => fileRef.current?.click()}
          />
        ) : (
          <>
            {orderedDays.find((d) => d.image_url)?.image_url && (
              <PlanImagePreview
                src={orderedDays.find((d) => d.image_url)!.image_url!}
              />
            )}
            <p className="px-1 text-sm text-muted-foreground">
              Oggi è <span className="font-bold text-foreground">{todayName}</span>.
              Tocca un giorno per vedere i pasti.
            </p>
            <Accordion
              type="single"
              collapsible
              defaultValue={defaultOpen}
              className="space-y-3"
            >
              {orderedDays.map((day) => (
                <DayItem key={day.id} day={day} isToday={day.giorno === todayName} />
              ))}
            </Accordion>

            <Button
              variant="outline"
              size="lg"
              className="w-full border-primary/30 text-primary"
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
                  Sostituisci piano
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function DayItem({ day, isToday }: { day: MealPlanDay; isToday: boolean }) {
  return (
    <AccordionItem
      value={day.id}
      className="retail-card overflow-hidden border-0 px-4"
    >
      <AccordionTrigger className="py-4 hover:no-underline">
        <div className="flex items-center gap-3">
          <span
            className={
              "flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold " +
              (isToday
                ? "bg-primary text-primary-foreground"
                : "bg-accent text-primary")
            }
          >
            {day.giorno.slice(0, 3)}
          </span>
          <div className="text-left">
            <p className="text-base font-extrabold text-foreground">{day.giorno}</p>
            <p className="text-xs text-muted-foreground">
              {day.pasti.length} past{day.pasti.length === 1 ? "o" : "i"}
              {isToday && " · oggi"}
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        <ul className="space-y-3">
          {day.pasti.map((m, i) => (
            <MealCard key={i} meal={m} />
          ))}
        </ul>
      </AccordionContent>
    </AccordionItem>
  );
}

function MealCard({ meal }: { meal: Meal }) {
  return (
    <li className="relative rounded-2xl bg-white p-4 pr-3 shadow-sm ring-1 ring-border/60">
      <p className="text-sm font-extrabold text-primary">
        {emojiForTipo(meal.tipo)} {meal.tipo}
      </p>
      <p className="mt-1 pr-2 text-sm font-medium text-foreground/85 leading-snug">
        {meal.descrizione}
      </p>
      {meal.macro && (
        <div className="mt-3 flex justify-end">
          <span className="rounded-lg bg-muted px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-foreground/80">
            {meal.macro}
          </span>
        </div>
      )}
    </li>
  );
}

function EmptyState({
  uploading,
  onUpload,
}: {
  uploading: boolean;
  onUpload: () => void;
}) {
  return (
    <div className="retail-card flex flex-col items-center px-6 py-10 text-center">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <UtensilsCrossed className="h-8 w-8 text-primary" />
      </span>
      <h2 className="text-lg font-extrabold text-foreground">
        Nessun piano alimentare
      </h2>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Carica una foto del tuo piano settimanale: l'AI lo organizzerà in giorni e pasti.
      </p>
      <Button
        type="button"
        size="lg"
        className="mt-6 w-full max-w-xs"
        onClick={onUpload}
        disabled={uploading}
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analisi in corso...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Carica Piano Alimentare
          </>
        )}
      </Button>
      <Link
        to="/storico"
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary"
      >
        <History className="h-3.5 w-3.5" />
        Vedi storico spesa
      </Link>
    </div>
  );
}
