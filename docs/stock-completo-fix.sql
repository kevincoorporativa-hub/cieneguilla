-- =====================================================
-- SCRIPT COMPLETO: CONSOLIDAR TIENDA + RESET STOCK 10 UNIDADES
-- Copiar y pegar en Supabase SQL Editor > Run SQL
-- =====================================================

DO $$
DECLARE
    v_main_store_id UUID;
    v_product RECORD;
    v_old_qty DECIMAL;
BEGIN
    -- =====================================================
    -- PASO 1: IDENTIFICAR TIENDA PRINCIPAL
    -- =====================================================
    SELECT id INTO v_main_store_id 
    FROM public.stores 
    WHERE active = true 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    IF v_main_store_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró ninguna tienda activa';
    END IF;
    
    RAISE NOTICE '✅ Tienda principal: %', v_main_store_id;
    
    -- =====================================================
    -- PASO 2: MIGRAR ENTIDADES A TIENDA PRINCIPAL
    -- =====================================================
    
    -- Migrar terminales
    UPDATE public.terminals 
    SET store_id = v_main_store_id 
    WHERE store_id != v_main_store_id OR store_id IS NULL;
    RAISE NOTICE '✅ Terminales migrados';
    
    -- Migrar mesas
    UPDATE public.tables 
    SET store_id = v_main_store_id 
    WHERE store_id != v_main_store_id OR store_id IS NULL;
    RAISE NOTICE '✅ Mesas migradas';
    
    -- Migrar órdenes
    UPDATE public.orders 
    SET store_id = v_main_store_id 
    WHERE store_id != v_main_store_id OR store_id IS NULL;
    RAISE NOTICE '✅ Órdenes migradas';
    
    -- Migrar empleados
    UPDATE public.employees 
    SET store_id = v_main_store_id 
    WHERE store_id != v_main_store_id OR store_id IS NULL;
    RAISE NOTICE '✅ Empleados migrados';
    
    -- Migrar stock de ingredientes
    UPDATE public.ingredient_stock 
    SET store_id = v_main_store_id 
    WHERE store_id != v_main_store_id;
    RAISE NOTICE '✅ Stock de ingredientes migrado';
    
    -- Migrar movimientos de stock de productos
    UPDATE public.product_stock_moves 
    SET store_id = v_main_store_id 
    WHERE store_id != v_main_store_id OR store_id IS NULL;
    RAISE NOTICE '✅ Movimientos de stock migrados';
    
    -- =====================================================
    -- PASO 3: CONSOLIDAR STOCK DE PRODUCTOS
    -- =====================================================
    
    -- Eliminar registros de stock de otras tiendas (ya consolidados)
    DELETE FROM public.product_stock 
    WHERE store_id != v_main_store_id;
    RAISE NOTICE '✅ Stock de otras tiendas eliminado';
    
    -- =====================================================
    -- PASO 4: ELIMINAR TIENDAS DUPLICADAS
    -- =====================================================
    DELETE FROM public.stores 
    WHERE id != v_main_store_id;
    RAISE NOTICE '✅ Tiendas duplicadas eliminadas';
    
    -- =====================================================
    -- PASO 5: RESET STOCK A 10 UNIDADES PARA TODOS LOS PRODUCTOS
    -- =====================================================
    
    FOR v_product IN 
        SELECT id, name, track_stock 
        FROM public.products 
        WHERE active = true AND track_stock = true
    LOOP
        -- Obtener stock actual
        SELECT COALESCE(quantity, 0) INTO v_old_qty
        FROM public.product_stock
        WHERE product_id = v_product.id AND store_id = v_main_store_id;
        
        IF v_old_qty IS NULL THEN
            v_old_qty := 0;
        END IF;
        
        -- Insertar o actualizar stock a 10 unidades
        INSERT INTO public.product_stock (product_id, store_id, quantity, updated_at)
        VALUES (v_product.id, v_main_store_id, 10, now())
        ON CONFLICT (product_id, store_id) 
        DO UPDATE SET quantity = 10, updated_at = now();
        
        -- Registrar movimiento en Kardex
        INSERT INTO public.product_stock_moves (
            product_id,
            store_id,
            movement_type,
            quantity,
            stock_before,
            stock_after,
            reason,
            created_at
        ) VALUES (
            v_product.id,
            v_main_store_id,
            'adjustment',
            10 - v_old_qty,
            v_old_qty,
            10,
            'Reset global de stock a 10 unidades',
            now()
        );
        
        RAISE NOTICE '📦 %: % → 10 unidades', v_product.name, v_old_qty;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ COMPLETADO: Todo el stock se ha reiniciado a 10 unidades';
    RAISE NOTICE '============================================';
    
END $$;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================
SELECT 
    p.name as producto,
    ps.quantity as stock_actual,
    p.track_stock as trackea_stock,
    s.name as tienda
FROM public.products p
LEFT JOIN public.product_stock ps ON ps.product_id = p.id
LEFT JOIN public.stores s ON s.id = ps.store_id
WHERE p.active = true AND p.track_stock = true
ORDER BY p.name;
