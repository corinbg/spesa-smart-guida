import {
  Apple,
  Beef,
  Croissant,
  CupSoda,
  Fish,
  Milk,
  Package,
  ShoppingBasket,
  Snowflake,
  Sparkles,
  Sandwich,
  type LucideIcon,
} from "lucide-react";

import type { RepartoGroup, ShoppingItem } from "@/lib/api";

export const CATEGORIE = [
  "Ortofrutta",
  "Macelleria",
  "Pescheria",
  "Latticini e Uova",
  "Salumi e Formaggi",
  "Pane e Pasticceria",
  "Dispensa",
  "Bevande",
  "Surgelati",
  "Cura Persona e Casa",
] as const;

export type Categoria = (typeof CATEGORIE)[number];

/** Ordine reparti per supermercato (base comune; da raffinare a mano). */
const LAYOUT_BASE = [
  "Ortofrutta",
  "Pane e Pasticceria",
  "Dispensa",
  "Bevande",
  "Cura Persona e Casa",
  "Salumi e Formaggi",
  "Latticini e Uova",
  "Macelleria",
  "Pescheria",
  "Surgelati",
] as const;

export const LAYOUT: Record<string, string[]> = {
  Iperal: [...LAYOUT_BASE],
  Esselunga: [...LAYOUT_BASE],
  Coop: [...LAYOUT_BASE],
  Conad: [...LAYOUT_BASE],
  Lidl: [...LAYOUT_BASE],
};

export const NOTE_REPARTO: Record<string, string> = {
  Ortofrutta: "Pesa la verdura prima di proseguire.",
  "Pane e Pasticceria": "Prendi il pane fresco verso la fine del reparto.",
  Dispensa: "Controlla scadenze e formati famiglia.",
  Bevande: "Le casse d'acqua sono spesso in fondo al corridoio.",
  "Cura Persona e Casa": "Detergenti e igiene nello stesso settore.",
  "Salumi e Formaggi": "Prendi un numero al banco se serve.",
  "Latticini e Uova": "Latte e yogurt di solito in fondo al banco frigo.",
  Macelleria: "Chiedi al banco se non trovi il taglio.",
  Pescheria: "Tieni il pesce fresco separato dagli altri prodotti.",
  Surgelati: "Ultimo giro, così non si scongela.",
};

export const EMOJI_REPARTO: Record<string, string> = {
  Ortofrutta: "🥬",
  "Pane e Pasticceria": "🥐",
  Dispensa: "🍝",
  Bevande: "🥤",
  "Cura Persona e Casa": "🧴",
  "Salumi e Formaggi": "🧀",
  "Latticini e Uova": "🥛",
  Macelleria: "🥩",
  Pescheria: "🐟",
  Surgelati: "🧊",
};

const UNCATEGORIZED = "Senza categoria";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Ortofrutta: Apple,
  Macelleria: Beef,
  Pescheria: Fish,
  "Latticini e Uova": Milk,
  "Salumi e Formaggi": Sandwich,
  "Pane e Pasticceria": Croissant,
  Dispensa: Package,
  Bevande: CupSoda,
  Surgelati: Snowflake,
  "Cura Persona e Casa": Sparkles,
  [UNCATEGORIZED]: ShoppingBasket,
};

const orderIndex = new Map<string, number>(
  CATEGORIE.map((c, i) => [c, i] as const),
);

export function getCategoryIcon(categoria: string): LucideIcon {
  const stripped = categoria.replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, "").trim();
  return CATEGORY_ICONS[stripped] ?? CATEGORY_ICONS[categoria] ?? ShoppingBasket;
}

export function groupItemsByCategory(items: ShoppingItem[]): { categoria: string; items: ShoppingItem[] }[] {
  const map = new Map<string, ShoppingItem[]>();

  for (const item of items) {
    const cat = item.categoria?.trim() || UNCATEGORIZED;
    const list = map.get(cat) ?? [];
    list.push(item);
    map.set(cat, list);
  }

  return [...map.entries()]
    .sort(([a], [b]) => {
      const ia = orderIndex.get(a) ?? Number.MAX_SAFE_INTEGER;
      const ib = orderIndex.get(b) ?? Number.MAX_SAFE_INTEGER;
      if (ia !== ib) return ia - ib;
      return a.localeCompare(b, "it");
    })
    .map(([categoria, groupItems]) => ({ categoria, items: groupItems }));
}

export function buildRoute(items: ShoppingItem[], supermercato: string): RepartoGroup[] {
  const layout = LAYOUT[supermercato] ?? LAYOUT_BASE;
  const layoutIndex = new Map(layout.map((c, i) => [c, i] as const));

  return groupItemsByCategory(items)
    .map(({ categoria, items: prodotti }) => {
      const emoji = EMOJI_REPARTO[categoria];
      return {
        reparto: emoji ? `${emoji} ${categoria}` : categoria,
        ordine: layoutIndex.get(categoria) ?? 999,
        note_reparto: NOTE_REPARTO[categoria] ?? null,
        prodotti,
      };
    })
    .sort((a, b) => a.ordine - b.ordine);
}
