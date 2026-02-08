-- =====================================================
-- SCRIPT: Permitir a TODOS los roles gestionar Combos e Insumos
-- Ejecutar en Supabase SQL Editor > Run SQL
-- =====================================================

-- =====================================================
-- PASO 1: COMBOS - Abrir a todos los autenticados
-- =====================================================

-- Eliminar políticas existentes de combos
DROP POLICY IF EXISTS "Admin/Manager can manage combos" ON public.combos;
DROP POLICY IF EXISTS "Admins can manage combos" ON public.combos;
DROP POLICY IF EXISTS "Anyone can view combos" ON public.combos;
DROP POLICY IF EXISTS "Authenticated can view combos" ON public.combos;
DROP POLICY IF EXISTS "All roles can manage combos" ON public.combos;
DROP POLICY IF EXISTS "All authenticated can select combos" ON public.combos;
DROP POLICY IF EXISTS "All authenticated can insert combos" ON public.combos;
DROP POLICY IF EXISTS "All authenticated can update combos" ON public.combos;
DROP POLICY IF EXISTS "All authenticated can delete combos" ON public.combos;

-- Asegurar RLS habilitado
ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;

-- Crear políticas abiertas para todos los autenticados
CREATE POLICY "All authenticated can select combos"
ON public.combos FOR SELECT TO authenticated
USING (true);

CREATE POLICY "All authenticated can insert combos"
ON public.combos FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "All authenticated can update combos"
ON public.combos FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "All authenticated can delete combos"
ON public.combos FOR DELETE TO authenticated
USING (true);

-- =====================================================
-- PASO 2: COMBO_ITEMS - Abrir a todos los autenticados
-- =====================================================

DROP POLICY IF EXISTS "Admin/Manager can manage combo items" ON public.combo_items;
DROP POLICY IF EXISTS "Admins can manage combo_items" ON public.combo_items;
DROP POLICY IF EXISTS "Anyone can view combo_items" ON public.combo_items;
DROP POLICY IF EXISTS "Authenticated can view combo_items" ON public.combo_items;
DROP POLICY IF EXISTS "All roles can manage combo_items" ON public.combo_items;
DROP POLICY IF EXISTS "All authenticated can select combo_items" ON public.combo_items;
DROP POLICY IF EXISTS "All authenticated can insert combo_items" ON public.combo_items;
DROP POLICY IF EXISTS "All authenticated can update combo_items" ON public.combo_items;
DROP POLICY IF EXISTS "All authenticated can delete combo_items" ON public.combo_items;

ALTER TABLE public.combo_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can select combo_items"
ON public.combo_items FOR SELECT TO authenticated
USING (true);

CREATE POLICY "All authenticated can insert combo_items"
ON public.combo_items FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "All authenticated can update combo_items"
ON public.combo_items FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "All authenticated can delete combo_items"
ON public.combo_items FOR DELETE TO authenticated
USING (true);

-- =====================================================
-- PASO 3: SUPPLIES (Insumos) - Abrir a todos los autenticados
-- =====================================================

DROP POLICY IF EXISTS "Admin/Manager can manage supplies" ON public.supplies;
DROP POLICY IF EXISTS "Admins can manage supplies" ON public.supplies;
DROP POLICY IF EXISTS "Anyone can view supplies" ON public.supplies;
DROP POLICY IF EXISTS "Authenticated can view supplies" ON public.supplies;
DROP POLICY IF EXISTS "All roles can manage supplies" ON public.supplies;
DROP POLICY IF EXISTS "All authenticated can select supplies" ON public.supplies;
DROP POLICY IF EXISTS "All authenticated can insert supplies" ON public.supplies;
DROP POLICY IF EXISTS "All authenticated can update supplies" ON public.supplies;
DROP POLICY IF EXISTS "All authenticated can delete supplies" ON public.supplies;

ALTER TABLE public.supplies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can select supplies"
ON public.supplies FOR SELECT TO authenticated
USING (true);

CREATE POLICY "All authenticated can insert supplies"
ON public.supplies FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "All authenticated can update supplies"
ON public.supplies FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "All authenticated can delete supplies"
ON public.supplies FOR DELETE TO authenticated
USING (true);

-- =====================================================
-- PASO 4: STOCK_MOVES (Movimientos de insumos) - Abrir a todos
-- =====================================================

DROP POLICY IF EXISTS "Admin/Manager can manage stock_moves" ON public.stock_moves;
DROP POLICY IF EXISTS "Admins can manage stock_moves" ON public.stock_moves;
DROP POLICY IF EXISTS "Anyone can view stock_moves" ON public.stock_moves;
DROP POLICY IF EXISTS "Authenticated can view stock_moves" ON public.stock_moves;
DROP POLICY IF EXISTS "All roles can manage stock_moves" ON public.stock_moves;
DROP POLICY IF EXISTS "All authenticated can select stock_moves" ON public.stock_moves;
DROP POLICY IF EXISTS "All authenticated can insert stock_moves" ON public.stock_moves;
DROP POLICY IF EXISTS "All authenticated can update stock_moves" ON public.stock_moves;
DROP POLICY IF EXISTS "All authenticated can delete stock_moves" ON public.stock_moves;

ALTER TABLE public.stock_moves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can select stock_moves"
ON public.stock_moves FOR SELECT TO authenticated
USING (true);

CREATE POLICY "All authenticated can insert stock_moves"
ON public.stock_moves FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "All authenticated can update stock_moves"
ON public.stock_moves FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "All authenticated can delete stock_moves"
ON public.stock_moves FOR DELETE TO authenticated
USING (true);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
SELECT 
  schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('combos', 'combo_items', 'supplies', 'stock_moves')
ORDER BY tablename, cmd;
