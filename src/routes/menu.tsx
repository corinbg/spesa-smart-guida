import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  Upload,
  Settings,
  Trash2,
  Sparkles,
  History,
  UtensilsCrossed,
  ImageIcon,
  ZoomIn,
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
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { PinchZoomImage } from "@/components/PinchZoomImage";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
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
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

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

  const hasPlan = orderedDays.length > 0;
  const planImageUrl = useMemo(
    () => orderedDays.find((d) => d.image_url)?.image_url ?? null,
    [orderedDays],
  );

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
                className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
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
            {planImageUrl && <PlanImagePreview src={planImageUrl} />}
            <p className="px-1 text-sm text-muted-foreground">
              Oggi è <span className="font-bold text-foreground">{todayName}</span>.
              Scorri lateralmente per vedere gli altri giorni.
            </p>
            <DayMealsCarousel days={orderedDays} todayName={todayName} />

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

function DayMealsCarousel({
  days,
  todayName,
}: {
  days: MealPlanDay[];
  todayName: string;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const todayIndex = useMemo(
    () => Math.max(0, days.findIndex((d) => d.giorno === todayName)),
    [days, todayName],
  );

  const [selectedIndex, setSelectedIndex] = useState(todayIndex);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => setSelectedIndex(api.selectedScrollSnap());
    api.on("select", onSelect);
    onSelect();

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  useEffect(() => {
    tabRefs.current[selectedIndex]?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }, [selectedIndex]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {days.map((day, i) => {
          const isToday = day.giorno === todayName;
          const isSelected = i === selectedIndex;

          return (
            <button
              key={day.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              onClick={() => api?.scrollTo(i)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-extrabold transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "bg-accent text-accent-foreground",
                isToday && !isSelected && "ring-2 ring-primary/40",
              )}
            >
              {day.giorno.slice(0, 3)}
            </button>
          );
        })}
      </div>

      <Carousel setApi={setApi} opts={{ startIndex: todayIndex }} className="w-full">
        <CarouselContent className="-ml-0">
          {days.map((day) => (
            <CarouselItem key={day.id} className="pl-0">
              <DayMealsPanel day={day} isToday={day.giorno === todayName} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}

function DayMealsPanel({ day, isToday }: { day: MealPlanDay; isToday: boolean }) {
  return (
    <div className={cn("retail-card overflow-hidden border-0 px-4 py-4", isToday && "glow-today")}>
      <div className="mb-4 flex items-center gap-3">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold",
            isToday
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
              : "bg-accent text-accent-foreground",
          )}
        >
          {day.giorno.slice(0, 3)}
        </span>
        <div>
          <p className="text-base font-extrabold text-foreground">{day.giorno}</p>
          <p className="text-xs text-muted-foreground">
            {day.pasti.length} past{day.pasti.length === 1 ? "o" : "i"}
            {isToday && " · oggi"}
          </p>
        </div>
      </div>
      <ul className="space-y-3">
        {day.pasti.map((m, i) => (
          <MealCard key={i} meal={m} />
        ))}
      </ul>
    </div>
  );
}

function MealCard({ meal }: { meal: Meal }) {
  return (
    <li className="relative rounded-2xl bg-card p-4 pr-3 shadow-sm ring-1 ring-primary/10">
      <p className="text-sm font-extrabold text-primary">
        {emojiForTipo(meal.tipo)} {meal.tipo}
      </p>
      <p className="mt-1 pr-2 whitespace-pre-line text-sm font-medium text-foreground/85 leading-snug">
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
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 shadow-md shadow-primary/15">
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

function PlanImagePreview({ src }: { src: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="retail-card group relative block w-full overflow-hidden p-0 text-left"
        aria-label="Ingrandisci immagine piano alimentare"
      >
        <img
          src={src}
          alt="Piano alimentare caricato"
          className="block max-h-56 w-full object-cover transition-transform group-active:scale-[1.02]"
        />
        <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8 text-[11px] font-bold text-white">
          <ZoomIn className="h-3.5 w-3.5" />
          Tocca per ingrandire
        </span>
        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
          <ImageIcon className="h-3 w-3" />
          Piano originale
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="fixed inset-0 left-0 top-0 flex h-[100dvh] max-h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 border-0 bg-black/95 p-0 sm:rounded-none [&>button]:right-3 [&>button]:top-[calc(0.75rem+env(safe-area-inset-top))] [&>button]:z-10 [&>button]:text-white [&>button]:opacity-90 [&>button]:hover:opacity-100"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">Piano alimentare originale</DialogTitle>
          <div className="relative min-h-0 flex-1 pt-[calc(3rem+env(safe-area-inset-top))]">
            {open && <PinchZoomImage src={src} alt="Piano alimentare caricato" />}
            <p className="pointer-events-none absolute inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] text-center text-xs text-white/45">
              Pizzica per ingrandire · doppio tap per zoom
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
