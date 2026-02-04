-- =====================================================
-- SCRIPT COMPLETO: DESCUENTO DE STOCK PARA COMBOS
-- Ejecutar en Supabase SQL Editor > Run SQL
-- =====================================================

-- =====================================================
-- PASO 1: AGREGAR COLUMNA combo_id A order_items
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'order_items' 
        AND column_name = 'combo_id'
    ) THEN
        ALTER TABLE public.order_items 
        ADD COLUMN combo_id UUID REFERENCES public.combos(id) ON DELETE SET NULL;
        
        RAISE NOTICE '✅ Columna combo_id agregada a order_items';
    ELSE
        RAISE NOTICE '⏭️ Columna combo_id ya existe';
    END IF;
END $$;

-- Crear índice para combo_id
CREATE INDEX IF NOT EXISTS idx_order_items_combo ON public.order_items(combo_id);

-- =====================================================
-- PASO 2: RECREAR TRIGGER PARA DESCONTAR STOCK DE COMBOS
-- =====================================================

-- Eliminar trigger existente
DROP TRIGGER IF EXISTS trg_deduct_product_stock_on_payment ON public.payments;

-- Recrear la función mejorada que maneja PRODUCTOS y COMBOS
CREATE OR REPLACE FUNCTION public.deduct_product_stock_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_combo_item RECORD;
    v_store_id UUID;
    v_product RECORD;
BEGIN
    -- Obtener la orden
    SELECT * INTO v_order FROM public.orders WHERE id = NEW.order_id;
    
    -- Obtener store_id del terminal si no está en la orden
    IF v_order.store_id IS NULL AND v_order.terminal_id IS NOT NULL THEN
        SELECT store_id INTO v_store_id 
        FROM public.terminals 
        WHERE id = v_order.terminal_id;
    ELSE
        v_store_id := v_order.store_id;
    END IF;

    -- Si no hay store_id, usar la primera tienda activa
    IF v_store_id IS NULL THEN
        SELECT id INTO v_store_id FROM public.stores WHERE active = true LIMIT 1;
    END IF;
    
    -- Solo procesar si la orden aún no estaba pagada
    IF v_order.status != 'paid' THEN
        -- Actualizar estado de la orden
        UPDATE public.orders 
        SET status = 'paid', updated_at = now() 
        WHERE id = NEW.order_id;
        
        -- Iterar por cada item de la orden
        FOR v_item IN 
            SELECT oi.*, p.track_stock, p.name as product_name
            FROM public.order_items oi
            LEFT JOIN public.products p ON p.id = oi.product_id
            WHERE oi.order_id = NEW.order_id
        LOOP
            -- =====================================================
            -- CASO 1: Es un PRODUCTO individual
            -- =====================================================
            IF v_item.product_id IS NOT NULL AND v_item.track_stock = true THEN
                -- Actualizar stock
                INSERT INTO public.product_stock (product_id, store_id, quantity, updated_at)
                VALUES (v_item.product_id, v_store_id, -v_item.quantity, now())
                ON CONFLICT (product_id, store_id)
                DO UPDATE SET 
                    quantity = GREATEST(0, public.product_stock.quantity - v_item.quantity),
                    updated_at = now();
                
                -- Registrar movimiento en Kardex
                INSERT INTO public.product_stock_moves 
                    (product_id, store_id, move_type, quantity, reference_id, notes, user_id)
                VALUES (
                    v_item.product_id,
                    v_store_id,
                    'sale',
                    -v_item.quantity,
                    NEW.order_id,
                    format('Venta orden #%s - %s x%s', v_order.order_number, v_item.product_name, v_item.quantity),
                    NEW.user_id
                );
                
            -- =====================================================
            -- CASO 2: Es un COMBO - descontar stock de cada componente
            -- =====================================================
            ELSIF v_item.combo_id IS NOT NULL THEN
                -- Iterar por cada producto del combo
                FOR v_combo_item IN 
                    SELECT 
                        ci.product_id,
                        ci.quantity as combo_qty,
                        p.name as product_name,
                        p.track_stock
                    FROM public.combo_items ci
                    JOIN public.products p ON p.id = ci.product_id
                    WHERE ci.combo_id = v_item.combo_id
                LOOP
                    -- Solo descontar si el producto trackea stock
                    IF v_combo_item.track_stock = true THEN
                        -- Cantidad total a descontar = cantidad_en_combo * cantidad_vendida
                        DECLARE
                            v_total_qty INT := v_combo_item.combo_qty * v_item.quantity;
                        BEGIN
                            -- Actualizar stock
                            INSERT INTO public.product_stock (product_id, store_id, quantity, updated_at)
                            VALUES (v_combo_item.product_id, v_store_id, -v_total_qty, now())
                            ON CONFLICT (product_id, store_id)
                            DO UPDATE SET 
                                quantity = GREATEST(0, public.product_stock.quantity - v_total_qty),
                                updated_at = now();
                            
                            -- Registrar movimiento en Kardex
                            INSERT INTO public.product_stock_moves 
                                (product_id, store_id, move_type, quantity, reference_id, notes, user_id)
                            VALUES (
                                v_combo_item.product_id,
                                v_store_id,
                                'sale',
                                -v_total_qty,
                                NEW.order_id,
                                format('Venta combo "%s" orden #%s - %s x%s', 
                                    v_item.product_name, v_order.order_number, 
                                    v_combo_item.product_name, v_total_qty),
                                NEW.user_id
                            );
                        END;
                    END IF;
                END LOOP;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Recrear el trigger
CREATE TRIGGER trg_deduct_product_stock_on_payment
AFTER INSERT ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.deduct_product_stock_on_payment();

RAISE NOTICE '✅ Trigger actualizado para manejar combos';

-- =====================================================
-- PASO 3: RESET STOCK A 10 UNIDADES (OPCIONAL)
-- Descomenta si quieres reiniciar el stock
-- =====================================================
/*
DO $$
DECLARE
    v_main_store_id UUID;
    v_product RECORD;
    v_old_qty DECIMAL(10,3);
BEGIN
    SELECT id INTO v_main_store_id FROM public.stores WHERE active = true ORDER BY created_at ASC LIMIT 1;
    
    FOR v_product IN SELECT id, name FROM public.products WHERE active = true AND track_stock = true
    LOOP
        SELECT COALESCE(ps.quantity, 0) INTO v_old_qty
        FROM public.product_stock ps WHERE ps.product_id = v_product.id AND ps.store_id = v_main_store_id;
        
        INSERT INTO public.product_stock (product_id, store_id, quantity, updated_at)
        VALUES (v_product.id, v_main_store_id, 10, now())
        ON CONFLICT (product_id, store_id) DO UPDATE SET quantity = 10, updated_at = now();
        
        INSERT INTO public.product_stock_moves (product_id, store_id, move_type, quantity, notes, created_at)
        VALUES (v_product.id, v_main_store_id, 'adjustment', 10 - COALESCE(v_old_qty, 0), 'Reset stock a 10', now());
    END LOOP;
END $$;
*/

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
SELECT 'Columna combo_id' as verificacion, 
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'order_items' AND column_name = 'combo_id'
       ) THEN '✅ OK' ELSE '❌ Falta' END as estado
UNION ALL
SELECT 'Trigger de stock', 
       CASE WHEN EXISTS (
           SELECT 1 FROM pg_trigger WHERE tgname = 'trg_deduct_product_stock_on_payment'
       ) THEN '✅ OK' ELSE '❌ Falta' END;
