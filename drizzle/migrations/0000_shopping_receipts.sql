CREATE TABLE public.shopping_receipts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), archived_at timestamptz NOT NULL DEFAULT now(), total_cents bigint CHECK (total_cents >= 0), supermarket text);
GRANT SELECT, INSERT ON public.shopping_receipts TO anon, authenticated;
GRANT ALL ON public.shopping_receipts TO service_role;
ALTER TABLE public.shopping_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shared receipts read" ON public.shopping_receipts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Shared receipts insert" ON public.shopping_receipts FOR INSERT TO anon, authenticated WITH CHECK (true);
ALTER TABLE public.shopping_items ADD COLUMN receipt_id uuid REFERENCES public.shopping_receipts(id);
CREATE INDEX shopping_items_receipt_idx ON public.shopping_items(receipt_id);
CREATE FUNCTION public.archive_shopping(p_total_cents bigint DEFAULT NULL, p_supermarket text DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE receipt uuid; stamp timestamptz := now(); ids uuid[];
BEGIN
IF p_total_cents IS NOT NULL AND p_total_cents < 0 THEN RAISE EXCEPTION 'Totale non valido'; END IF;
PERFORM pg_advisory_xact_lock(804731);
SELECT array_agg(id) INTO ids FROM public.shopping_items WHERE status = 'active';
IF ids IS NULL THEN RAISE EXCEPTION 'Nessun prodotto da archiviare'; END IF;
INSERT INTO public.shopping_receipts(total_cents, supermarket, archived_at) VALUES (p_total_cents, p_supermarket, stamp) RETURNING id INTO receipt;
UPDATE public.shopping_items SET status = 'archived', archived_at = stamp, receipt_id = receipt WHERE id = ANY(ids) AND status = 'active';
RETURN receipt;
END; $$;
REVOKE ALL ON FUNCTION public.archive_shopping(bigint,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.archive_shopping(bigint,text) TO anon, authenticated, service_role;
COMMENT ON TABLE public.meal_plan IS 'DEPRECATED: meal planning removed from app navigation; existing data preserved';