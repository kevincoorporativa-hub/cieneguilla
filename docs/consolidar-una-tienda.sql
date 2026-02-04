-- =====================================================
-- SCRIPT: CONSOLIDAR A UNA SOLA TIENDA + RESET STOCK 10 UNIDADES
-- Pegar y ejecutar en el SQL Editor de tu backend (Lovable Cloud > Run SQL)
-- =====================================================

-- PASO 1: Identificar la tienda principal (la primera creada)
-- PASO 2: Migrar terminales, stock, movimientos a esa tienda
-- PASO 3: Eliminar tiendas duplicadas
-- PASO 4: Resetear stock a 10 unidades

DO $$
DECLARE
    v_main_store_id UUID;
    v_main_store_name TEXT;
    v_product RECORD;
BEGIN
    -- 1) Obtener la tienda principal (primera creada)
    SELECT id, name INTO v_main_store_id, v_main_store_name
    FROM public.stores
    WHERE active = true
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_main_store_id IS NULL THEN
        RAISE EXCEPTION 'No hay tiendas activas. Crea una tienda primero.';
    END IF;

    RAISE NOTICE '✅ Tienda principal: % (ID: %)', v_main_store_name, v_main_store_id;

    -- 2) Migrar terminales de otras tiendas a la principal
    UPDATE public.terminals
    SET store_id = v_main_store_id
    WHERE store_id != v_main_store_id;
    RAISE NOTICE '  Terminales migrados a tienda principal';

    -- 3) Migrar mesas de otras tiendas a la principal
    UPDATE public.tables
    SET store_id = v_main_store_id
    WHERE store_id != v_main_store_id;
    RAISE NOTICE '  Mesas migradas a tienda principal';

    -- 4) Migrar stock de otras tiendas: sumar al stock de la principal o crear
    -- Primero eliminar duplicados consolidando
    FOR v_product IN 
        SELECT product_id, SUM(quantity) as total_qty
        FROM public.product_stock
        WHERE store_id != v_main_store_id
        GROUP BY product_id
    LOOP
        -- Actualizar o insertar en tienda principal
        INSERT INTO public.product_stock (product_id, store_id, quantity, updated_at)
        VALUES (v_product.product_id, v_main_store_id, v_product.total_qty, now())
        ON CONFLICT (product_id, store_id) 
        DO UPDATE SET 
            quantity = public.product_stock.quantity + EXCLUDED.quantity,
            updated_at = now();
    END LOOP;
    
    -- Eliminar stock de otras tiendas
    DELETE FROM public.product_stock WHERE store_id != v_main_store_id;
    RAISE NOTICE '  Stock consolidado en tienda principal';

    -- 5) Migrar movimientos de stock a tienda principal
    UPDATE public.product_stock_moves
    SET store_id = v_main_store_id
    WHERE store_id != v_main_store_id;
    RAISE NOTICE '  Movimientos de stock migrados';

    -- 6) Migrar stock de ingredientes
    UPDATE public.ingredient_stock
    SET store_id = v_main_store_id
    WHERE store_id != v_main_store_id;

    UPDATE public.stock_moves
    SET store_id = v_main_store_id
    WHERE store_id != v_main_store_id;
    RAISE NOTICE '  Stock de ingredientes migrado';

    -- 7) Actualizar órdenes que apuntan a otras tiendas
    UPDATE public.orders
    SET store_id = v_main_store_id
    WHERE store_id IS NOT NULL AND store_id != v_main_store_id;
    RAISE NOTICE '  Órdenes actualizadas';

    -- 8) Migrar empleados
    UPDATE public.employees
    SET store_id = v_main_store_id
    WHERE store_id IS NOT NULL AND store_id != v_main_store_id;
    RAISE NOTICE '  Empleados migrados';

    -- 9) Eliminar tiendas extras
    DELETE FROM public.stores WHERE id != v_main_store_id;
    RAISE NOTICE '🗑️ Tiendas duplicadas eliminadas';

    -- 10) RESETEAR STOCK A 10 UNIDADES para todos los productos
    -- Primero asegurar que todos los productos con track_stock tengan registro
    INSERT INTO public.product_stock (product_id, store_id, quantity, updated_at)
    SELECT p.id, v_main_store_id, 10, now()
    FROM public.products p
    WHERE p.active = true 
      AND p.track_stock = true
      AND NOT EXISTS (
          SELECT 1 FROM public.product_stock ps 
          WHERE ps.product_id = p.id AND ps.store_id = v_main_store_id
      );

    -- Actualizar todos a 10
    UPDATE public.product_stock
    SET quantity = 10, updated_at = now()
    WHERE store_id = v_main_store_id;

    -- Registrar ajuste en kardex
    INSERT INTO public.product_stock_moves (product_id, store_id, move_type, quantity, notes)
    SELECT 
        ps.product_id, 
        v_main_store_id, 
        'adjustment', 
        10 - COALESCE(ps.quantity, 0),
        'Reset de stock a 10 unidades (consolidación de tiendas)'
    FROM public.product_stock ps
    WHERE ps.store_id = v_main_store_id;

    RAISE NOTICE '📦 Stock reseteado a 10 unidades para todos los productos';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ LISTO! Solo queda la tienda: %', v_main_store_name;
    RAISE NOTICE '   Todos los productos tienen 10 unidades';
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- VERIFICACIÓN: Ver resultado final
-- =====================================================

-- Tiendas restantes
SELECT id, name, active FROM public.stores;

-- Stock actual
SELECT 
    p.name AS producto,
    s.name AS tienda,
    ps.quantity AS stock
FROM public.product_stock ps
JOIN public.products p ON p.id = ps.product_id
JOIN public.stores s ON s.id = ps.store_id
WHERE p.active = true
ORDER BY p.name;
