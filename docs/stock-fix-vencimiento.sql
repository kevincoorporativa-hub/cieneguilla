-- =====================================================
-- SCRIPT: FIX DE STOCK (POR TIENDA) + VENCIMIENTO (NO BLOQUEA VENTA)
-- Pegar y ejecutar en el SQL Editor de tu backend.
--
-- Objetivo:
-- 1) Asegurar columna expiration_date en product_stock_moves
-- 2) Tener vistas/funciones útiles para consultar stock por tienda
-- 3) Re-crear el trigger de descuento de stock al registrar pagos
--
-- NOTA IMPORTANTE:
-- - Este script NO bloquea ventas por vencimiento. El vencimiento queda como alerta/indicador.
-- - Es idempotente: se puede ejecutar varias veces.
-- =====================================================

-- =====================================================
-- 1) PRODUCT_STOCK_MOVES: asegurar columna de vencimiento
-- =====================================================

ALTER TABLE public.product_stock_moves
  ADD COLUMN IF NOT EXISTS expiration_date DATE;

CREATE INDEX IF NOT EXISTS idx_product_stock_moves_expiration
  ON public.product_stock_moves (expiration_date)
  WHERE expiration_date IS NOT NULL;

-- =====================================================
-- 2) VISTAS: stock por tienda + vencimiento más cercano (referencial)
-- =====================================================

CREATE OR REPLACE VIEW public.v_product_stock_by_store AS
SELECT
  p.id                 AS product_id,
  p.name               AS product_name,
  p.active,
  p.track_stock,
  p.min_stock,
  COALESCE(ps.quantity, 0) AS current_stock,
  ps.store_id,
  s.name               AS store_name
FROM public.products p
LEFT JOIN public.product_stock ps ON ps.product_id = p.id
LEFT JOIN public.stores s ON s.id = ps.store_id
WHERE p.active = true;

-- Vencimiento más cercano por producto/tienda (tomado de ingresos con expiration_date)
-- OJO: si manejas lotes completos, necesitarías un sistema FIFO/Lote para descontar por lote.
CREATE OR REPLACE VIEW public.v_product_nearest_expiration AS
SELECT
  m.product_id,
  m.store_id,
  MIN(m.expiration_date) AS nearest_expiration_date
FROM public.product_stock_moves m
WHERE m.expiration_date IS NOT NULL
  AND m.quantity > 0
GROUP BY m.product_id, m.store_id;

-- =====================================================
-- 3) FUNCIÓN: validar stock (NO considera vencimiento)
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
SET search_path = public
AS $$
DECLARE
  v_product RECORD;
  v_current_stock DECIMAL;
BEGIN
  SELECT id, name, track_stock
  INTO v_product
  FROM public.products
  WHERE id = p_product_id AND active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::DECIMAL, 'Producto no encontrado'::TEXT;
    RETURN;
  END IF;

  IF NOT v_product.track_stock THEN
    RETURN QUERY SELECT true, 999::DECIMAL, NULL::TEXT;
    RETURN;
  END IF;

  SELECT COALESCE(ps.quantity, 0)
  INTO v_current_stock
  FROM public.product_stock ps
  WHERE ps.product_id = p_product_id
    AND (p_store_id IS NULL OR ps.store_id = p_store_id)
  LIMIT 1;

  IF COALESCE(v_current_stock, 0) < p_quantity THEN
    IF COALESCE(v_current_stock, 0) <= 0 THEN
      RETURN QUERY SELECT false, COALESCE(v_current_stock, 0), format('%s sin stock disponible', v_product.name)::TEXT;
    ELSE
      RETURN QUERY SELECT false, COALESCE(v_current_stock, 0), format('Solo hay %s unidades de %s disponibles', COALESCE(v_current_stock, 0)::INT, v_product.name)::TEXT;
    END IF;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, COALESCE(v_current_stock, 0), NULL::TEXT;
END;
$$;

-- =====================================================
-- 4) TRIGGER: descontar stock al pagar (atómico)
-- =====================================================

DROP TRIGGER IF EXISTS trg_deduct_product_stock_on_payment ON public.payments;

CREATE OR REPLACE FUNCTION public.deduct_product_stock_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_store_id UUID;
BEGIN
  -- Obtener la orden
  SELECT * INTO v_order FROM public.orders WHERE id = NEW.order_id;

  -- Resolver store_id
  IF v_order.store_id IS NOT NULL THEN
    v_store_id := v_order.store_id;
  ELSIF v_order.terminal_id IS NOT NULL THEN
    SELECT store_id INTO v_store_id FROM public.terminals WHERE id = v_order.terminal_id;
  END IF;

  -- Fallback: primera tienda activa
  IF v_store_id IS NULL THEN
    SELECT id INTO v_store_id FROM public.stores WHERE active = true LIMIT 1;
  END IF;

  -- Solo descontar stock si la orden aún no estaba pagada
  IF v_order.status != 'paid' THEN
    UPDATE public.orders
    SET status = 'paid', updated_at = now()
    WHERE id = NEW.order_id;

    FOR v_item IN
      SELECT oi.*, p.track_stock, p.name AS product_name
      FROM public.order_items oi
      LEFT JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.order_id
    LOOP
      IF v_item.track_stock = true AND v_item.product_id IS NOT NULL THEN
        -- Upsert stock row si falta
        INSERT INTO public.product_stock (product_id, store_id, quantity)
        VALUES (v_item.product_id, v_store_id, 0)
        ON CONFLICT (product_id, store_id) DO NOTHING;

        -- Descontar sin permitir negativo
        UPDATE public.product_stock
        SET quantity = GREATEST(0, quantity - v_item.quantity),
            updated_at = now()
        WHERE product_id = v_item.product_id
          AND store_id = v_store_id;

        -- Kardex
        INSERT INTO public.product_stock_moves
          (product_id, store_id, move_type, quantity, reference_id, notes, user_id)
        VALUES
          (v_item.product_id, v_store_id, 'sale', -v_item.quantity, NEW.order_id,
           format('Venta orden #%s - %s x%s', v_order.order_number, v_item.product_name, v_item.quantity),
           NEW.user_id);
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
-- 5) PERMISOS
-- =====================================================

GRANT SELECT ON public.v_product_stock_by_store TO authenticated;
GRANT SELECT ON public.v_product_nearest_expiration TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_product_stock TO authenticated;

-- =====================================================
-- FIN
-- =====================================================
