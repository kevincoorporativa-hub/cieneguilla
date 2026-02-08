-- =====================================================
-- SCRIPT COMPLETO: SISTEMA DE RECETAS PARA PIZZERÍA
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- =====================================================
-- Este script:
--   1. Agrega has_recipes a categories
--   2. Recrea la tabla product_recipes (limpia)
--   3. Crea función auxiliar para descontar insumos
--   4. Actualiza el trigger de pago para usar recetas
--   5. Crea vista de costo de receta por producto
--   6. Crea función de porciones disponibles
-- =====================================================

-- =====================================================
-- 1. COLUMNA has_recipes EN CATEGORÍAS
-- =====================================================

ALTER TABLE public.categories 
  ADD COLUMN IF NOT EXISTS has_recipes BOOLEAN DEFAULT false;

-- =====================================================
-- 2. TABLA DE RECETAS (Producto → Insumos)
--    Se eliminan dependencias primero para recrear limpio
-- =====================================================

-- Eliminar vista que depende de product_recipes
DROP VIEW IF EXISTS public.v_product_recipe_cost CASCADE;

-- Eliminar funciones que dependen de product_recipes
DROP FUNCTION IF EXISTS public.get_recipe_available_servings(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.deduct_ingredients_for_product(UUID, INT, UUID, UUID, INT, TEXT, BOOLEAN, UUID) CASCADE;

-- Eliminar trigger antes de recrear la función del trigger
DROP TRIGGER IF EXISTS trg_deduct_product_stock_on_payment ON public.payments;

-- Recrear tabla limpia
DROP TABLE IF EXISTS public.product_recipes CASCADE;

CREATE TABLE public.product_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    quantity_needed DECIMAL NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_id, ingredient_id)
);

CREATE INDEX IF NOT EXISTS idx_product_recipes_product ON public.product_recipes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_recipes_ingredient ON public.product_recipes(ingredient_id);

-- RLS
ALTER TABLE public.product_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_recipes" ON public.product_recipes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_recipes" ON public.product_recipes
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_recipes" ON public.product_recipes
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "auth_delete_recipes" ON public.product_recipes
    FOR DELETE TO authenticated USING (true);

-- =====================================================
-- 3. FUNCIÓN AUXILIAR: Descontar insumos por receta
-- =====================================================

CREATE OR REPLACE FUNCTION public.deduct_ingredients_for_product(
    p_product_id UUID,
    p_quantity INT,
    p_store_id UUID,
    p_order_id UUID,
    p_order_number INT,
    p_product_name TEXT,
    p_track_stock BOOLEAN,
    p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_recipe RECORD;
    v_has_recipe BOOLEAN;
    v_ingredient_qty DECIMAL;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM public.product_recipes WHERE product_id = p_product_id
    ) INTO v_has_recipe;

    IF v_has_recipe THEN
        FOR v_recipe IN
            SELECT pr.ingredient_id, pr.quantity_needed, i.name as ingredient_name
            FROM public.product_recipes pr
            JOIN public.ingredients i ON i.id = pr.ingredient_id
            WHERE pr.product_id = p_product_id
        LOOP
            v_ingredient_qty := v_recipe.quantity_needed * p_quantity;

            IF EXISTS (
                SELECT 1 FROM public.ingredient_stock 
                WHERE ingredient_id = v_recipe.ingredient_id 
                AND store_id = p_store_id
            ) THEN
                UPDATE public.ingredient_stock
                SET quantity = GREATEST(0, quantity - v_ingredient_qty),
                    updated_at = now()
                WHERE ingredient_id = v_recipe.ingredient_id
                  AND store_id = p_store_id;
            ELSE
                INSERT INTO public.ingredient_stock (ingredient_id, store_id, quantity)
                VALUES (v_recipe.ingredient_id, p_store_id, 0);
            END IF;

            INSERT INTO public.stock_moves 
                (ingredient_id, store_id, move_type, quantity, reference_id, notes, user_id, unit_cost, total_cost)
            VALUES (
                v_recipe.ingredient_id,
                p_store_id,
                'sale',
                -v_ingredient_qty,
                p_order_id,
                format('Venta #%s — %s x%s (insumo: %s)', 
                    p_order_number, p_product_name, p_quantity, v_recipe.ingredient_name),
                p_user_id,
                0, 0
            );
        END LOOP;

    ELSIF p_track_stock = true THEN
        IF EXISTS (
            SELECT 1 FROM public.product_stock 
            WHERE product_id = p_product_id 
            AND store_id = p_store_id
        ) THEN
            UPDATE public.product_stock
            SET quantity = GREATEST(0, quantity - p_quantity),
                updated_at = now()
            WHERE product_id = p_product_id
              AND store_id = p_store_id;
        ELSE
            INSERT INTO public.product_stock (product_id, store_id, quantity)
            VALUES (p_product_id, p_store_id, 0);
        END IF;
        
        INSERT INTO public.product_stock_moves 
            (product_id, store_id, move_type, quantity, reference_id, notes, user_id)
        VALUES (
            p_product_id,
            p_store_id,
            'sale',
            -p_quantity,
            p_order_id,
            format('Venta #%s — %s x%s', p_order_number, p_product_name, p_quantity),
            p_user_id
        );
    END IF;
END;
$$;

-- =====================================================
-- 4. TRIGGER MEJORADO: DESCONTAR AL PAGAR
-- =====================================================

CREATE OR REPLACE FUNCTION public.deduct_product_stock_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_combo_component RECORD;
    v_store_id UUID;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = NEW.order_id;
    
    IF v_order.store_id IS NULL AND v_order.terminal_id IS NOT NULL THEN
        SELECT store_id INTO v_store_id 
        FROM public.terminals WHERE id = v_order.terminal_id;
    ELSE
        v_store_id := v_order.store_id;
    END IF;

    IF v_store_id IS NULL THEN
        SELECT id INTO v_store_id FROM public.stores WHERE active = true LIMIT 1;
    END IF;
    
    IF v_order.status != 'paid' THEN
        UPDATE public.orders 
        SET status = 'paid', updated_at = now() 
        WHERE id = NEW.order_id;
        
        FOR v_item IN 
            SELECT oi.*, p.track_stock, p.name as product_name
            FROM public.order_items oi
            LEFT JOIN public.products p ON p.id = oi.product_id
            WHERE oi.order_id = NEW.order_id
        LOOP
            IF v_item.combo_id IS NOT NULL THEN
                FOR v_combo_component IN
                    SELECT ci.product_id, ci.quantity, p.name as product_name, p.track_stock
                    FROM public.combo_items ci
                    JOIN public.products p ON p.id = ci.product_id
                    WHERE ci.combo_id = v_item.combo_id
                LOOP
                    PERFORM deduct_ingredients_for_product(
                        v_combo_component.product_id,
                        v_combo_component.quantity * v_item.quantity,
                        v_store_id, NEW.order_id, v_order.order_number,
                        v_combo_component.product_name, v_combo_component.track_stock, NEW.user_id
                    );
                END LOOP;
            
            ELSIF v_item.product_id IS NOT NULL THEN
                PERFORM deduct_ingredients_for_product(
                    v_item.product_id, v_item.quantity,
                    v_store_id, NEW.order_id, v_order.order_number,
                    v_item.product_name, v_item.track_stock, NEW.user_id
                );
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_deduct_product_stock_on_payment
AFTER INSERT ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.deduct_product_stock_on_payment();

-- =====================================================
-- 5. VISTA: Costo de receta por producto
-- =====================================================

CREATE OR REPLACE VIEW public.v_product_recipe_cost AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.base_price,
    COALESCE(SUM(pr.quantity_needed * i.cost_per_unit), 0) as recipe_cost,
    p.base_price - COALESCE(SUM(pr.quantity_needed * i.cost_per_unit), 0) as profit,
    CASE 
        WHEN p.base_price > 0 THEN 
            ROUND(((p.base_price - COALESCE(SUM(pr.quantity_needed * i.cost_per_unit), 0)) / p.base_price * 100)::numeric, 1)
        ELSE 0 
    END as margin_percent,
    COUNT(pr.id) as ingredient_count
FROM public.products p
LEFT JOIN public.product_recipes pr ON pr.product_id = p.id
LEFT JOIN public.ingredients i ON i.id = pr.ingredient_id
WHERE p.active = true
GROUP BY p.id, p.name, p.base_price;

GRANT SELECT ON public.v_product_recipe_cost TO authenticated;

-- =====================================================
-- 6. FUNCIÓN: Porciones disponibles por receta
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_recipe_available_servings(
    p_product_id UUID,
    p_store_id UUID
)
RETURNS INT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_recipe RECORD;
    v_min_servings INT := 999999;
    v_ingredient_stock DECIMAL;
    v_possible INT;
    v_has_recipe BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM public.product_recipes WHERE product_id = p_product_id
    ) INTO v_has_recipe;

    IF NOT v_has_recipe THEN
        RETURN -1;
    END IF;

    FOR v_recipe IN
        SELECT pr.ingredient_id, pr.quantity_needed
        FROM public.product_recipes pr
        WHERE pr.product_id = p_product_id
          AND pr.quantity_needed > 0
    LOOP
        SELECT COALESCE(quantity, 0) INTO v_ingredient_stock
        FROM public.ingredient_stock
        WHERE ingredient_id = v_recipe.ingredient_id
          AND store_id = p_store_id;

        IF v_ingredient_stock IS NULL THEN
            v_ingredient_stock := 0;
        END IF;

        v_possible := FLOOR(v_ingredient_stock / v_recipe.quantity_needed);
        
        IF v_possible < v_min_servings THEN
            v_min_servings := v_possible;
        END IF;
    END LOOP;

    IF v_min_servings = 999999 THEN
        RETURN 0;
    END IF;

    RETURN v_min_servings;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_recipe_available_servings TO authenticated;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
