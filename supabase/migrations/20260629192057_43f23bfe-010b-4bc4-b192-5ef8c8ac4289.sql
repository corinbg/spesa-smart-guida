CREATE TABLE public.meal_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  giorno text NOT NULL,
  pasti jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_plan TO anon, authenticated;
GRANT ALL ON public.meal_plan TO service_role;

ALTER TABLE public.meal_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read meal plan" ON public.meal_plan FOR SELECT USING (true);
CREATE POLICY "Public insert meal plan" ON public.meal_plan FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update meal plan" ON public.meal_plan FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete meal plan" ON public.meal_plan FOR DELETE USING (true);