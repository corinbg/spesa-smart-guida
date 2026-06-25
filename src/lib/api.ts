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

export async function addManualItem(input: { prodotto: string; quantita?: string }) {
  const { error } = await supabase.from(TABLE).insert({
    prodotto: input.prodotto,
    quantita: input.quantita || null,
    categoria: null,
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
const WEBHOOK_GUIDA = "https://n8n.n8n-boostia.uk/webhook/guida";

export async function uploadListImage(file: File): Promise<AiItem[]> {
  const fd = new FormData();
  fd.append("file", file, file.name);
  const res = await fetch(WEBHOOK_LISTA, { method: "POST", body: fd });
  if (!res.ok) throw new Error(`Errore upload (${res.status})`);
  const json = await res.json();
  const arr = Array.isArray(json) ? json : json?.items ?? json?.data ?? [];
  return arr as AiItem[];
}

export async function optimizeRoute(
  supermercato: string,
  items: ShoppingItem[],
): Promise<RepartoGroup[]> {
  const res = await fetch(WEBHOOK_GUIDA, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ supermercato, lista_prodotti: items }),
  });
  if (!res.ok) throw new Error(`Errore ottimizzazione (${res.status})`);
  const json = await res.json();
  const groups: RepartoGroup[] =
    json?.percorso_ottimizzato ?? json?.[0]?.percorso_ottimizzato ?? [];
  return [...groups].sort((a, b) => (a.ordine ?? 0) - (b.ordine ?? 0));
}
