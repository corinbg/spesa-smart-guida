import { supabase } from "@/integrations/supabase/client";

export type ShoppingItem = {
  id: string;
  prodotto: string;
  quantita: string | null;
  categoria: string | null;
  preso: boolean;
  extra: boolean;
  status: "active" | "archived";
  created_at: string;
  archived_at: string | null;
};

export type AiItem = {
  prodotto: string;
  quantita?: string | null;
  categoria?: string | null;
};

export type RepartoGroup = {
  reparto: string;
  ordine: number;
  note_reparto?: string | null;
  prodotti: ShoppingItem[];
};

const TABLE = "shopping_items" as const;

export async function fetchActive(): Promise<ShoppingItem[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ShoppingItem[];
}

export async function fetchArchived(): Promise<ShoppingItem[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("status", "archived")
    .order("archived_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ShoppingItem[];
}

export async function addManualItem(input: {
  prodotto: string;
  quantita?: string;
  categoria?: string | null;
}) {
  const { error } = await supabase.from(TABLE).insert({
    prodotto: input.prodotto,
    quantita: input.quantita || null,
    categoria: input.categoria?.trim() || null,
    extra: true,
    status: "active",
  });
  if (error) throw error;
}

export async function addAiItems(items: AiItem[]) {
  if (!items.length) return;
  const rows = items.map((i) => ({
    prodotto: i.prodotto,
    quantita: i.quantita ?? null,
    categoria: i.categoria ?? null,
    extra: false,
    status: "active" as const,
  }));
  const { error } = await supabase.from(TABLE).insert(rows);
  if (error) throw error;
}

export async function togglePreso(id: string, preso: boolean) {
  const { error } = await supabase.from(TABLE).update({ preso }).eq("id", id);
  if (error) throw error;
}

export async function deleteItem(id: string) {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

export async function updateItem(
  id: string,
  input: { prodotto: string; quantita?: string | null; categoria?: string | null },
) {
  const { error } = await supabase
    .from(TABLE)
    .update({
      prodotto: input.prodotto,
      quantita: input.quantita?.trim() || null,
      categoria: input.categoria?.trim() || null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function archiveActive() {
  const { error } = await supabase
    .from(TABLE)
    .update({ status: "archived", archived_at: new Date().toISOString() })
    .eq("status", "active");
  if (error) throw error;
}

const WEBHOOK_LISTA = "https://n8n.n8n-boostia.uk/webhook/listaspesa";

async function fileToCompressedDataUrl(
  file: File,
  maxDim = 1280,
  quality = 0.8,
): Promise<string> {
  // Fallback for non-image or environments without canvas
  if (!file.type.startsWith("image/") || typeof document === "undefined") {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error("image load failed"));
    im.src = dataUrl;
  });
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

async function appendCompressedOrOriginal(fd: FormData, file: File): Promise<string | null> {
  try {
    const dataUrl = await fileToCompressedDataUrl(file);
    const blob = await dataUrlToBlob(dataUrl);
    fd.append("file", blob, "upload.jpg");
    return dataUrl;
  } catch {
    fd.append("file", file, file.name);
    return null;
  }
}

export async function uploadListImage(file: File): Promise<AiItem[]> {
  const fd = new FormData();
  await appendCompressedOrOriginal(fd, file);
  const res = await fetch(WEBHOOK_LISTA, { method: "POST", body: fd });
  if (!res.ok) throw new Error(`Errore upload (${res.status})`);
  const json = await res.json();
  const arr = Array.isArray(json) ? json : json?.items ?? json?.data ?? [];
  return arr as AiItem[];
}

// ============ Meal Plan ============

export type Meal = {
  tipo: string;
  descrizione: string;
  macro: string;
};

export type MealPlanDay = {
  id: string;
  giorno: string;
  pasti: Meal[];
  image_url: string | null;
  created_at: string;
};

const MEAL_TABLE = "meal_plan" as const;

export const GIORNI_ORDER = [
  "Lunedì",
  "Martedì",
  "Mercoledì",
  "Giovedì",
  "Venerdì",
  "Sabato",
  "Domenica",
] as const;

function normalizeGiorno(g: string): string {
  const s = g.trim().toLowerCase();
  const map: Record<string, string> = {
    lunedi: "Lunedì",
    "lunedì": "Lunedì",
    martedi: "Martedì",
    "martedì": "Martedì",
    mercoledi: "Mercoledì",
    "mercoledì": "Mercoledì",
    giovedi: "Giovedì",
    "giovedì": "Giovedì",
    venerdi: "Venerdì",
    "venerdì": "Venerdì",
    sabato: "Sabato",
    domenica: "Domenica",
  };
  return map[s] ?? g;
}

export async function fetchMealPlan(): Promise<MealPlanDay[]> {
  const { data, error } = await supabase
    .from(MEAL_TABLE)
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as Array<{
    id: string;
    giorno: string;
    pasti: unknown;
    image_url: string | null;
    created_at: string;
  }>;
  const days: MealPlanDay[] = rows.map((r) => ({
    id: r.id,
    giorno: normalizeGiorno(r.giorno),
    pasti: Array.isArray(r.pasti) ? (r.pasti as Meal[]) : [],
    image_url: r.image_url ?? null,
    created_at: r.created_at,
  }));
  days.sort(
    (a, b) =>
      GIORNI_ORDER.indexOf(a.giorno as (typeof GIORNI_ORDER)[number]) -
      GIORNI_ORDER.indexOf(b.giorno as (typeof GIORNI_ORDER)[number]),
  );
  return days;
}

const WEBHOOK_PIANO = "https://n8n.n8n-boostia.uk/webhook/pianoalimentare";

export async function uploadMealPlanImage(file: File): Promise<MealPlanDay[]> {
  const fd = new FormData();
  const imageDataUrl = await appendCompressedOrOriginal(fd, file);
  const res = await fetch(WEBHOOK_PIANO, { method: "POST", body: fd });
  if (!res.ok) throw new Error(`Errore upload piano (${res.status})`);
  const webhookJson = await res.json();
  const root = Array.isArray(webhookJson) ? webhookJson[0] : webhookJson;
  const menu: Array<{ giorno: string; pasti: Meal[] }> =
    root?.menu ?? root?.data?.menu ?? [];
  if (!menu.length) return [];
  const rows = menu.map((d) => ({
    giorno: normalizeGiorno(d.giorno),
    pasti: (d.pasti ?? []) as unknown as Meal[],
    image_url: imageDataUrl,
  }));
  // Clear existing plan first
  await deleteMealPlan();
  const { error } = await supabase.from(MEAL_TABLE).insert(rows);
  if (error) throw error;
  return fetchMealPlan();
}

export async function deleteMealPlan() {
  const { error } = await supabase
    .from(MEAL_TABLE)
    .delete()
    .not("id", "is", null);
  if (error) throw error;
}
