
CREATE TABLE public.shopping_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prodotto TEXT NOT NULL,
  quantita TEXT,
  categoria TEXT,
  preso BOOLEAN NOT NULL DEFAULT false,
  extra BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopping_items TO anon, authenticated;
GRANT ALL ON public.shopping_items TO service_role;

ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read shopping items" ON public.shopping_items FOR SELECT USING (true);
CREATE POLICY "Public insert shopping items" ON public.shopping_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update shopping items" ON public.shopping_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete shopping items" ON public.shopping_items FOR DELETE USING (true);

CREATE INDEX idx_shopping_items_status ON public.shopping_items(status);
CREATE INDEX idx_shopping_items_created_at ON public.shopping_items(created_at DESC);
