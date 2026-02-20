-- =====================================================
-- SCRIPT: Permitir a todos los autenticados gestionar ingredients y combos
-- Ejecutar en Supabase SQL Editor > Run SQL
-- =====================================================

-- INGREDIENTS
DROP POLICY IF EXISTS "Admin/Manager can manage ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Admins can manage ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Anyone can view ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Authenticated can view ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "All authenticated can select ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "All authenticated can insert ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "All authenticated can update ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "All authenticated can delete ingredients" ON public.ingredients;

ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can select ingredients"
ON public.ingredients FOR SELECT TO authenticated USING (true);

CREATE POLICY "All authenticated can insert ingredients"
ON public.ingredients FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "All authenticated can update ingredients"
ON public.ingredients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "All authenticated can delete ingredients"
ON public.ingredients FOR DELETE TO authenticated USING (true);

-- PRODUCT_RECIPES
DROP POLICY IF EXISTS "All authenticated can select product_recipes" ON public.product_recipes;
DROP POLICY IF EXISTS "All authenticated can insert product_recipes" ON public.product_recipes;
DROP POLICY IF EXISTS "All authenticated can update product_recipes" ON public.product_recipes;
DROP POLICY IF EXISTS "All authenticated can delete product_recipes" ON public.product_recipes;

ALTER TABLE public.product_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can select product_recipes"
ON public.product_recipes FOR SELECT TO authenticated USING (true);

CREATE POLICY "All authenticated can insert product_recipes"
ON public.product_recipes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "All authenticated can update product_recipes"
ON public.product_recipes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "All authenticated can delete product_recipes"
ON public.product_recipes FOR DELETE TO authenticated USING (true);

-- VERIFICACIÓN
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('ingredients', 'product_recipes')
ORDER BY tablename, cmd;
