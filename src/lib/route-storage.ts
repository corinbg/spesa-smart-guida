import type { RepartoGroup } from "@/lib/api";

const STORAGE_KEY = "spesa-smart-percorso";
const TTL_MS = 2 * 60 * 60 * 1000;

export type SavedRoute = {
  percorso_ottimizzato: RepartoGroup[];
  supermercato: string;
  timestamp: number;
};

export function saveRoute(supermercato: string, percorso: RepartoGroup[]) {
  const data: SavedRoute = {
    percorso_ottimizzato: percorso,
    supermercato,
    timestamp: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadRoute(): SavedRoute | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedRoute;
    if (!data.percorso_ottimizzato?.length || Date.now() - data.timestamp > TTL_MS) {
      clearRoute();
      return null;
    }
    return data;
  } catch {
    clearRoute();
    return null;
  }
}

export function clearRoute() {
  localStorage.removeItem(STORAGE_KEY);
}
