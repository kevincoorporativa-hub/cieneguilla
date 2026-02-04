-- =====================================================
-- SCRIPT: RESETEAR STOCK A 10 UNIDADES PARA TODOS LOS PRODUCTOS
-- Pegar y ejecutar en el SQL Editor de tu backend (Lovable Cloud > Run SQL)
-- =====================================================

-- PASO 1: Obtener todas las tiendas activas
-- PASO 2: Para cada producto con track_stock=true, insertar/actualizar stock=10 en CADA tienda
-- PASO 3: Registrar movimiento de ajuste en el kardex

-- =====================================================
-- EJECUTAR ESTE SCRIPT COMPLETO
-- =====================================================

DO $$
DECLARE
    v_store RECORD;
    v_product RECORD;
    v_existing_stock DECIMAL;
BEGIN
    -- Iterar por cada tienda activa
    FOR v_store IN SELECT id, name FROM public.stores WHERE active = true
    LOOP
        RAISE NOTICE 'Procesando tienda: %', v_store.name;
        
        -- Iterar por cada producto que trackea stock
        FOR v_product IN 
            SELECT id, name 
            FROM public.products 
            WHERE active = true AND track_stock = true
        LOOP
            -- Verificar stock actual
            SELECT quantity INTO v_existing_stock
            FROM public.product_stock
            WHERE product_id = v_product.id AND store_id = v_store.id;
            
            IF v_existing_stock IS NULL THEN
                -- No existe registro, crear con 10 unidades
                INSERT INTO public.product_stock (product_id, store_id, quantity, updated_at)
                VALUES (v_product.id, v_store.id, 10, now());
                
                -- Registrar movimiento de ajuste
                INSERT INTO public.product_stock_moves 
                    (product_id, store_id, move_type, quantity, notes)
                VALUES 
                    (v_product.id, v_store.id, 'adjustment', 10, 
                     'Reset inicial de stock a 10 unidades');
                     
                RAISE NOTICE '  [CREADO] % -> 10 unidades en %', v_product.name, v_store.name;
            ELSE
                -- Existe registro, actualizar a 10
                UPDATE public.product_stock
                SET quantity = 10, updated_at = now()
                WHERE product_id = v_product.id AND store_id = v_store.id;
                
                -- Registrar movimiento de ajuste (diferencia)
                INSERT INTO public.product_stock_moves 
                    (product_id, store_id, move_type, quantity, notes)
                VALUES 
                    (v_product.id, v_store.id, 'adjustment', 10 - v_existing_stock, 
                     format('Reset de stock: %s -> 10 unidades', v_existing_stock::INT));
                     
                RAISE NOTICE '  [ACTUALIZADO] % -> 10 unidades (antes: %)', v_product.name, v_existing_stock;
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '✅ Stock reseteado a 10 unidades para todos los productos en todas las tiendas';
END $$;

-- =====================================================
-- VERIFICACIÓN: Ver el stock actual después del reset
-- =====================================================

SELECT 
    p.name AS producto,
    s.name AS tienda,
    ps.quantity AS stock_actual
FROM public.product_stock ps
JOIN public.products p ON p.id = ps.product_id
JOIN public.stores s ON s.id = ps.store_id
WHERE p.active = true AND p.track_stock = true
ORDER BY p.name, s.name;
