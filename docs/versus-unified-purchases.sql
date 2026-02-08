-- =====================================================
-- SCRIPT COMPLETO: Versus - Compras Unificadas + Rentabilidad
-- Fecha: 2026-02-08
-- =====================================================
-- Copiar y pegar TODO este script en Supabase → SQL Editor → Run
-- =====================================================

-- =====================================================
-- 1. Asegurar columna cost_price en products
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'cost_price'
  ) THEN
    ALTER TABLE products ADD COLUMN cost_price numeric DEFAULT 0;
  END IF;
END $$;

-- =====================================================
-- 2. Vista unificada de compras: v_all_purchases
-- Combina compras de insumos (stock_moves) + productos (product_stock_moves)
-- =====================================================
DROP VIEW IF EXISTS v_all_purchases;

CREATE VIEW v_all_purchases AS
  -- Compras de INSUMOS
  SELECT
    sm.id,
    'insumo'::text AS source,
    i.name AS item_name,
    i.category,
    sm.quantity::numeric AS quantity,
    COALESCE(sm.unit_cost, 0)::numeric AS unit_cost,
    COALESCE(sm.total_cost, 0)::numeric AS total_cost,
    sm.supplier,
    sm.purchase_date,
    sm.created_at,
    sm.notes,
    sm.store_id
  FROM stock_moves sm
  JOIN ingredients i ON i.id = sm.ingredient_id
  WHERE sm.move_type = 'purchase'

  UNION ALL

  -- Compras de PRODUCTOS (gaseosas, cervezas, etc.)
  SELECT
    psm.id,
    'producto'::text AS source,
    p.name AS item_name,
    COALESCE(p.category, 'general') AS category,
    psm.quantity::numeric AS quantity,
    COALESCE(psm.unit_cost, 0)::numeric AS unit_cost,
    (COALESCE(psm.unit_cost, 0) * psm.quantity)::numeric AS total_cost,
    NULL::text AS supplier,
    NULL::date AS purchase_date,
    psm.created_at,
    psm.notes,
    psm.store_id
  FROM product_stock_moves psm
  JOIN products p ON p.id = psm.product_id
  WHERE psm.move_type = 'purchase';

-- =====================================================
-- 3. Trigger: actualizar cost_price del producto
--    al registrar una compra con costo unitario
-- =====================================================
CREATE OR REPLACE FUNCTION fn_update_product_cost_price()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.move_type = 'purchase' AND NEW.unit_cost IS NOT NULL AND NEW.unit_cost > 0 THEN
    UPDATE products
    SET cost_price = NEW.unit_cost
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_product_cost_price ON product_stock_moves;

CREATE TRIGGER trg_update_product_cost_price
  AFTER INSERT ON product_stock_moves
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_product_cost_price();

-- =====================================================
-- 4. Vista de rentabilidad unificada: v_product_recipe_cost
--    Para productos CON receta: usa costo de ingredientes
--    Para productos SIN receta: usa cost_price (último precio de compra)
-- =====================================================
DROP VIEW IF EXISTS v_product_recipe_cost;

CREATE VIEW v_product_recipe_cost AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.base_price,
  p.category,
  COUNT(pr.id) AS ingredient_count,
  CASE
    WHEN COUNT(pr.id) > 0 THEN COALESCE(SUM(pr.quantity_needed * i.cost_per_unit), 0)
    ELSE COALESCE(p.cost_price, 0)
  END AS recipe_cost,
  CASE
    WHEN COUNT(pr.id) > 0 THEN p.base_price - COALESCE(SUM(pr.quantity_needed * i.cost_per_unit), 0)
    ELSE p.base_price - COALESCE(p.cost_price, 0)
  END AS profit,
  CASE
    WHEN p.base_price > 0 THEN
      CASE
        WHEN COUNT(pr.id) > 0
          THEN ((p.base_price - COALESCE(SUM(pr.quantity_needed * i.cost_per_unit), 0)) / p.base_price * 100)
        ELSE ((p.base_price - COALESCE(p.cost_price, 0)) / p.base_price * 100)
      END
    ELSE 0
  END AS margin_percent
FROM products p
LEFT JOIN product_recipes pr ON pr.product_id = p.id
LEFT JOIN ingredients i ON i.id = pr.ingredient_id
GROUP BY p.id, p.name, p.base_price, p.category, p.cost_price;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
-- Resumen:
-- ✅ cost_price en products (para productos sin receta)
-- ✅ v_all_purchases (compras de insumos + productos unificadas)
-- ✅ trg_update_product_cost_price (auto-actualiza cost_price)
-- ✅ v_product_recipe_cost (rentabilidad: recetas o cost_price)
-- =====================================================
