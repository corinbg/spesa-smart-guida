
## Overview

A mobile-first Italian PWA-style web app with three tabs (Preparazione, Shopping Mode, Storico), minimalist design, dark/light mode toggle, and a fixed bottom navigation bar optimized for one-handed use. Data persists in Lovable Cloud; two n8n webhooks handle AI parsing and route optimization.

## 1. Backend (Lovable Cloud)

Enable Lovable Cloud, then create a single migration:

- Table `public.shopping_items`
  - `id uuid pk default gen_random_uuid()`
  - `prodotto text not null`
  - `quantita text`
  - `categoria text`
  - `preso boolean not null default false`
  - `extra boolean not null default false`
  - `status text not null default 'active'` with CHECK in ('active','archived')
  - `created_at timestamptz not null default now()`
  - `archived_at timestamptz` (set when archived, used for Storico grouping)
- Grants to `authenticated` and `service_role`; also `anon` since this app is single-user demo with no auth required by the spec.
- Enable RLS with permissive policies (no auth in spec) — public read/write. We'll note this trade-off; can be tightened later if auth is added.

No auth required by the spec, so we skip the `_authenticated/` layout.

## 2. Routes (TanStack Start)

- `src/routes/__root.tsx` — keep shell; add ThemeProvider (class-based dark mode via `next-themes`-style toggle stored in localStorage), QueryClientProvider already in place, Toaster (sonner), and a mobile container with bottom nav rendered inside the layout.
- `src/routes/index.tsx` — redirect to `/preparazione`.
- `src/routes/preparazione.tsx` — list management + AI upload + manual add + weekly reset.
- `src/routes/shopping.tsx` — supermarket select, optimize route, accordion of aisles with large checkboxes.
- `src/routes/storico.tsx` — archived items grouped by date.

Bottom nav component highlights active tab using `activeProps`.

## 3. Server Functions

Files under `src/lib/`:

- `shopping.functions.ts` — `listActive`, `listArchived`, `addManualItem`, `addAiItems(items[])`, `togglePreso(id, value)`, `archiveActive()`. All use server publishable Supabase client (no auth in spec).
- `webhooks.functions.ts`:
  - `uploadListImage` — accepts base64 file + filename + mimeType, rebuilds FormData server-side, POSTs to `https://n8n.n8n-boostia.uk/webhook/listaspesa`, returns parsed items array.
  - `optimizeRoute` — POSTs `{ supermercato, lista_prodotti }` to `https://n8n.n8n-boostia.uk/webhook/guida`, returns `percorso_ottimizzato`.

Doing the webhook calls server-side avoids any CORS/network surprises from the browser and keeps the client thin.

## 4. UI / Components

- `BottomNav` — three-tab fixed bar with icons (Lucide: ClipboardList, ShoppingCart, History) + Italian labels.
- `ThemeToggle` — sun/moon in top corner.
- `ItemRow` (Preparazione) — checkbox-less row showing prodotto, quantita, categoria badge, and a small tag: "AI" (default) or "Extra" (when `extra=true`); swipe/delete optional, kept simple with a trash icon.
- `AisleAccordion` (Shopping Mode) — shadcn `Accordion`, each section shows `reparto`, `ordine` chip, optional `note_reparto`, and tappable item rows with large (h-7 w-7) checkbox; checked items get `line-through opacity-50 transition`.
- `UploadButton` — file input, shows spinner while uploading; uses TanStack Query mutation.
- `OptimizeButton` — large primary CTA; spinner state.
- `EndWeekButton` — confirmation dialog before archiving.

All forms validated with `zod`. Toaster for success/error feedback (Italian copy).

## 5. Data Flow (TanStack Query)

- `useQuery(['items','active'])` → `listActive`
- `useQuery(['items','archived'])` → `listArchived`
- `useQuery(['route', supermercato])` enabled on demand
- Mutations invalidate the relevant keys; `togglePreso` does optimistic update so the checkbox feels instant.

## 6. Theming

Update `src/styles.css` with a refined minimalist palette (light + dark) — single accent (warm green for "fresh groceries" feel), large readable spacing, rounded-2xl cards, soft shadows. Mobile-first: max-w-md container centered, bottom nav fixed, content padded for the nav height.

## 7. Italian Copy (key strings)

- Tabs: Preparazione / Shopping Mode / Storico
- Buttons: "Carica foto lista", "Aggiungi manualmente", "Termina Spesa Settimanale", "Ottimizza Percorso"
- Empty states: "Nessun prodotto in lista", "Nessuna spesa archiviata"
- Toasts: "Lista importata", "Prodotto aggiunto", "Percorso pronto", "Spesa archiviata"

## Technical Notes

- Webhook upload uses base64 transport client→server, then server reconstructs `FormData` with a `Blob` for the actual POST.
- `togglePreso` is optimistic via `useMutation` `onMutate`.
- Storico groups by `date(archived_at ?? created_at)` client-side using `Intl.DateTimeFormat('it-IT')`.
- Dark mode toggles `.dark` on `<html>`; persisted in localStorage; SSR-safe via a tiny inline script in `__root.tsx` head.
- Single-user, no auth — RLS policies allow anon access (documented trade-off).

## Out of Scope

- Authentication / multi-user
- Item editing after creation (only add / toggle / archive)
- Offline support / installable PWA manifest (can add later)
