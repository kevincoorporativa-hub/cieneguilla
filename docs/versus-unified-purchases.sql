-- =====================================================
-- SCRIPT: Versus - Compras Unificadas (Insumos + Productos)
-- Fecha: 2026-02-08
-- =====================================================
-- Este script asegura que tanto los ingresos de INSUMOS (stock_moves)
-- como los ingresos de PRODUCTOS (product_stock_moves) se consideren
-- compras y se puedan consultar en el módulo Versus de Reportes.
-- =====================================================

-- =====================================================
-- 1. Vista unificada de compras: v_all_purchases
-- Combina compras de insumos y productos en una sola vista
-- =====================================================
DROP VIEW IF EXISTS v_all_purchases;

CREATE VIEW v_all_purchases AS
  -- Compras de INSUMOS (stock_moves)
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

  -- Compras de PRODUCTOS (product_stock_moves)
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
-- 2. Trigger para actualizar cost_price de productos
-- al registrar una compra (ya debería existir, se recrea por seguridad)
-- =====================================================
CREATE OR REPLACE FUNCTION fn_update_product_cost_price()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo actualizar cuando es una compra con costo unitario
  IF NEW.move_type = 'purchase' AND NEW.unit_cost IS NOT NULL AND NEW.unit_cost > 0 THEN
    UPDATE products
    SET cost_price = NEW.unit_cost
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger existente si hay
DROP TRIGGER IF EXISTS trg_update_product_cost_price ON product_stock_moves;

-- Crear trigger
CREATE TRIGGER trg_update_product_cost_price
  AFTER INSERT ON product_stock_moves
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_product_cost_price();

-- =====================================================
-- 3. Asegurar que la columna cost_price existe en products
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
-- 4. Vista de rentabilidad unificada (recetas + cost_price)
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
-- Notas:
-- • El ingreso de insumos (stock_moves con move_type='purchase') 
--   se muestra como compra tipo "Insumo"
-- • El ingreso de productos (product_stock_moves con move_type='purchase')
--   se muestra como compra tipo "Producto"
-- • El trigger actualiza automáticamente el cost_price del producto
--   con el último precio de compra registrado
-- • La vista v_product_recipe_cost calcula rentabilidad para TODOS
--   los productos (con receta usa costo de ingredientes, sin receta
--   usa cost_price)
-- =====================================================
