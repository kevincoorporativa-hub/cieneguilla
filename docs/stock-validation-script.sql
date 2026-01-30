-- =====================================================
-- SCRIPT: VALIDACIÓN DE STOCK Y DESCUENTO AUTOMÁTICO
-- Copiar y ejecutar en Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. VISTA PARA STOCK ACTUAL DE PRODUCTOS
-- =====================================================

CREATE OR REPLACE VIEW public.v_product_stock AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.track_stock,
    p.min_stock,
    COALESCE(ps.quantity, 0) as current_stock,
    ps.store_id,
    s.name as store_name,
    CASE 
        WHEN NOT p.track_stock THEN 'no_tracking'
        WHEN COALESCE(ps.quantity, 0) <= 0 THEN 'out_of_stock'
        WHEN COALESCE(ps.quantity, 0) <= p.min_stock THEN 'low_stock'
        ELSE 'ok'
    END as stock_status
FROM public.products p
LEFT JOIN public.product_stock ps ON ps.product_id = p.id
LEFT JOIN public.stores s ON s.id = ps.store_id
WHERE p.active = true;

-- =====================================================
-- 2. FUNCIÓN PARA VALIDAR STOCK ANTES DE VENDER
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_product_stock(
    p_product_id UUID,
    p_quantity INT,
    p_store_id UUID DEFAULT NULL
)
RETURNS TABLE(
    can_sell BOOLEAN,
    available_stock DECIMAL,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_product RECORD;
    v_current_stock DECIMAL;
BEGIN
    -- Obtener información del producto
    SELECT id, name, track_stock, min_stock
    INTO v_product
    FROM public.products
    WHERE id = p_product_id AND active = true;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 0::DECIMAL, 'Producto no encontrado'::TEXT;
        RETURN;
    END IF;

    -- Si el producto no requiere tracking de stock, permitir venta
    IF NOT v_product.track_stock THEN
        RETURN QUERY SELECT true, 999::DECIMAL, NULL::TEXT;
        RETURN;
    END IF;

    -- Obtener stock actual
    SELECT COALESCE(ps.quantity, 0) INTO v_current_stock
    FROM public.products p
    LEFT JOIN public.product_stock ps ON ps.product_id = p.id
        AND (p_store_id IS NULL OR ps.store_id = p_store_id)
    WHERE p.id = p_product_id;

    -- Validar si hay suficiente stock
    IF v_current_stock < p_quantity THEN
        IF v_current_stock <= 0 THEN
            RETURN QUERY SELECT 
                false, 
                v_current_stock, 
                format('%s sin stock disponible', v_product.name)::TEXT;
        ELSE
            RETURN QUERY SELECT 
                false, 
                v_current_stock, 
                format('Solo hay %s unidades de %s disponibles', v_current_stock::INT, v_product.name)::TEXT;
        END IF;
        RETURN;
    END IF;

    RETURN QUERY SELECT true, v_current_stock, NULL::TEXT;
END;
$$;

-- =====================================================
-- 3. FUNCIÓN MEJORADA PARA DESCONTAR STOCK AL PAGAR
-- =====================================================

-- Primero eliminamos el trigger existente para recrearlo
DROP TRIGGER IF EXISTS trg_deduct_product_stock_on_payment ON public.payments;

-- Recrear la función mejorada
CREATE OR REPLACE FUNCTION public.deduct_product_stock_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_store_id UUID;
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
    
    -- Solo descontar stock si la orden aún no estaba pagada
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
            -- Solo descontar si el producto trackea stock
            IF v_item.track_stock = true AND v_item.product_id IS NOT NULL THEN
                -- Verificar si existe registro de stock para este producto/tienda
                IF EXISTS (
                    SELECT 1 FROM public.product_stock 
                    WHERE product_id = v_item.product_id 
                    AND store_id = v_store_id
                ) THEN
                    -- Actualizar stock existente
                    UPDATE public.product_stock
                    SET quantity = GREATEST(0, quantity - v_item.quantity),
                        updated_at = now()
                    WHERE product_id = v_item.product_id
                      AND store_id = v_store_id;
                ELSE
                    -- Crear registro de stock con valor negativo (para registrar el déficit)
                    INSERT INTO public.product_stock (product_id, store_id, quantity)
                    VALUES (v_item.product_id, v_store_id, 0);
                END IF;
                
                -- Registrar movimiento en el kardex
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

-- =====================================================
-- 4. FUNCIÓN PARA OBTENER STOCK DE UN PRODUCTO
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_product_stock(
    p_product_id UUID,
    p_store_id UUID DEFAULT NULL
)
RETURNS DECIMAL
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_stock DECIMAL;
    v_track_stock BOOLEAN;
BEGIN
    -- Verificar si el producto trackea stock
    SELECT track_stock INTO v_track_stock
    FROM public.products
    WHERE id = p_product_id;

    IF NOT v_track_stock THEN
        RETURN 999; -- Stock ilimitado para productos sin tracking
    END IF;

    -- Obtener stock
    SELECT COALESCE(quantity, 0) INTO v_stock
    FROM public.product_stock
    WHERE product_id = p_product_id
      AND (p_store_id IS NULL OR store_id = p_store_id)
    LIMIT 1;

    RETURN COALESCE(v_stock, 0);
END;
$$;

-- =====================================================
-- 5. PERMISOS (RLS ya debe estar habilitado)
-- =====================================================

-- Permitir lectura de stock a usuarios autenticados
GRANT SELECT ON public.v_product_stock TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_product_stock TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_stock TO authenticated;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
