-- ============================================================
-- Script: Aumentar precisión decimal para pizzería (gramos)
-- Ejecutar en: Supabase SQL Editor (Cloud View → Run SQL)
-- ============================================================

-- 1. Ingredientes: cost_per_unit necesita alta precisión (ej: 0.00005 por gramo)
ALTER TABLE public.ingredients 
  ALTER COLUMN cost_per_unit TYPE DECIMAL(15,6) USING cost_per_unit::DECIMAL(15,6);

ALTER TABLE public.ingredients 
  ALTER COLUMN min_stock TYPE DECIMAL(15,3) USING min_stock::DECIMAL(15,3);

-- 2. Stock de ingredientes: cantidad en gramos puede ser grande
ALTER TABLE public.ingredient_stock 
  ALTER COLUMN quantity TYPE DECIMAL(15,3) USING quantity::DECIMAL(15,3);

-- 3. Movimientos de stock (insumos): costos y cantidades con alta precisión
ALTER TABLE public.stock_moves 
  ALTER COLUMN quantity TYPE DECIMAL(15,3) USING quantity::DECIMAL(15,3);

ALTER TABLE public.stock_moves 
  ALTER COLUMN unit_cost TYPE DECIMAL(15,6) USING unit_cost::DECIMAL(15,6);

ALTER TABLE public.stock_moves 
  ALTER COLUMN total_cost TYPE DECIMAL(15,4) USING total_cost::DECIMAL(15,4);

-- 4. Recetas: quantity_needed puede ser decimal grande (gramos por porción)
ALTER TABLE public.product_recipes 
  ALTER COLUMN quantity_needed TYPE DECIMAL(15,3) USING quantity_needed::DECIMAL(15,3);

-- 5. Stock de productos
ALTER TABLE public.product_stock 
  ALTER COLUMN quantity TYPE DECIMAL(15,3) USING quantity::DECIMAL(15,3);

-- 6. Movimientos de productos
ALTER TABLE public.product_stock_moves 
  ALTER COLUMN quantity TYPE DECIMAL(15,3) USING quantity::DECIMAL(15,3);

ALTER TABLE public.product_stock_moves 
  ALTER COLUMN unit_cost TYPE DECIMAL(15,6) USING unit_cost::DECIMAL(15,6);

-- 7. Actualizar la vista v_product_recipe_cost para reflejar la nueva precisión
DROP VIEW IF EXISTS public.v_product_recipe_cost;
CREATE VIEW public.v_product_recipe_cost AS
SELECT
    p.id AS product_id,
    p.nombre AS product_name,
    p.precio AS base_price,
    COALESCE(SUM(pr.quantity_needed * i.cost_per_unit), 0) AS recipe_cost,
    p.precio - COALESCE(SUM(pr.quantity_needed * i.cost_per_unit), 0) AS profit,
    CASE 
        WHEN p.precio > 0 THEN 
            ((p.precio - COALESCE(SUM(pr.quantity_needed * i.cost_per_unit), 0)) / p.precio) * 100
        ELSE 0
    END AS margin_percent,
    COUNT(pr.id) AS ingredient_count
FROM public.products p
LEFT JOIN public.product_recipes pr ON pr.product_id = p.id
LEFT JOIN public.ingredients i ON i.id = pr.ingredient_id
WHERE p.active = true
GROUP BY p.id, p.nombre, p.precio;

-- ✅ Script completado. Ahora los decimales soportan hasta 6 posiciones para costos.
