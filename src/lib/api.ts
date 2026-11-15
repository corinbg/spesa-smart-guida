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
  receipt_id?: string | null;
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

export async function archiveActive(input: { totalCents: number | null; supermarket?: string }) {
  const { error } = await supabase.rpc("archive_shopping", {
    p_total_cents: input.totalCents ?? undefined,
    p_supermarket: input.supermarket,
  });
  if (error) throw error;
}

export async function fetchReceipts() {
  const { data, error } = await supabase.from("shopping_receipts").select("*").order("archived_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
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

