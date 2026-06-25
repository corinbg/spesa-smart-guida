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

import type { ShoppingItem } from "@/lib/api";

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
  return CATEGORY_ICONS[categoria] ?? ShoppingBasket;
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
