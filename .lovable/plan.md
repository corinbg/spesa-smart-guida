## Weekly Meal Plan — new homepage

### 1. Database
New migration creating `public.meal_plan`:
- `id uuid pk default gen_random_uuid()`
- `giorno text not null` (Lunedì…Domenica)
- `pasti jsonb not null` (array of meals: `{ tipo, descrizione, macro }`)
- `created_at timestamptz default now()`
- Grants for `anon` + `authenticated` + `service_role` (matching existing `shopping_items` public-access pattern)
- RLS enabled with public read/insert/update/delete policies (same model used today for `shopping_items`)

### 2. API layer (`src/lib/api.ts`)
Add:
- `type Meal = { tipo: string; descrizione: string; macro: string }`
- `type MealPlanDay = { id: string; giorno: string; pasti: Meal[]; created_at: string }`
- `fetchMealPlan()` → returns days ordered Lun→Dom
- `uploadMealPlanImage(file)` → POST multipart to `https://n8n.n8n-boostia.uk/webhook/pianoalimentare`, normalize `{ menu: [...] }`, insert rows
- `deleteMealPlan()` → delete all rows

### 3. Routing & navigation
- New route `src/routes/menu.tsx` = homepage
- `src/routes/index.tsx` redirect changes from `/preparazione` → `/menu`
- Update `BottomNav.tsx` tabs to:
  1. Menu → `/menu` (UtensilsCrossed icon)
  2. Spesa → `/preparazione` (ClipboardList icon)
  3. In Negozio → `/shopping` (ShoppingCart icon)
- Keep `/storico` reachable (link from a small "Storico" entry in the Spesa header, since the bottom bar only shows 3 tabs per the spec). I will move the Storico entry point into the Spesa page header to avoid losing access.

### 4. Menu page UX
- TanStack Query `useQuery(['meal_plan'], fetchMealPlan)`
- Header row: page title "Il tuo menu" + small settings/refresh icon (gear) on the right → opens AlertDialog with "Elimina Piano Attuale"
- **Empty state**: centered card, friendly copy in Italian, big primary button "Carica Piano Alimentare" opening a hidden `<input type="file" accept="image/*" capture="environment">`. Spinner while uploading. Toast on success/error.
- **Populated state**: shadcn `Accordion type="single" collapsible` with one item per day (Lun…Dom). `defaultValue` computed from `new Date().getDay()` mapping `0→Domenica, 1→Lunedì, …`. Days missing from DB are skipped.
- Each accordion content renders the 5 meals chronologically (order from `pasti` array) as white `Card`s with subtle shadow:
  - Bold green meal type with emoji (☕ Colazione, 🥐 Spuntino, 🍝 Pranzo, 🍎 Merenda, 🍽️ Cena) — emoji picked from `tipo` via a small map
  - `descrizione` in dark gray
  - Macros badge bottom-right: bg `bg-muted`, bold uppercase text, rounded

### 5. Styling
Reuse existing tokens (primary green, `bg-card`, `shadow`, `rounded-xl`). No new colors. Mobile-first, max-w-md, safe-area padding consistent with current pages.

### Files touched
- `supabase/migrations/<new>.sql` (new)
- `src/lib/api.ts` (extend)
- `src/routes/menu.tsx` (new)
- `src/routes/index.tsx` (redirect target)
- `src/components/BottomNav.tsx` (tabs + icons + labels)
- `src/routes/preparazione.tsx` (add small "Storico" link in header so /storico stays reachable)

### Out of scope
- No changes to existing Preparazione/Shopping/Storico logic beyond the header link.
- No auth — keeps current public-access model.
