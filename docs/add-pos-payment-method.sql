-- ============================================================
-- SCRIPT: Agregar método de pago POS y mejorar reportes
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Agregar 'pos' al enum de métodos de pago
-- Nota: PostgreSQL no permite IF NOT EXISTS para ADD VALUE, 
-- así que usamos un bloque DO para verificar si ya existe
DO $$ 
BEGIN
    -- Verificar si 'pos' ya existe en el enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'pos' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_method')
    ) THEN
        ALTER TYPE public.payment_method ADD VALUE 'pos';
    END IF;
END $$;

-- 2. Actualizar la vista de resumen de sesiones de caja
-- Incluye todos los métodos de pago separados (cash, pos, card, transfer, yape, plin)
DROP VIEW IF EXISTS public.v_cash_session_summary;

CREATE VIEW public.v_cash_session_summary AS
SELECT 
    cs.id as session_id,
    cs.terminal_id,
    t.name as terminal_name,
    COALESCE(e.first_name || ' ' || e.last_name, 'Cajero') as cashier_name,
    cs.status,
    cs.opening_amount,
    cs.closing_amount,
    cs.opened_at,
    cs.closed_at,
    COALESCE(SUM(p.amount) FILTER (WHERE p.method = 'cash'), 0) as cash_total,
    COALESCE(SUM(p.amount) FILTER (WHERE p.method = 'pos'), 0) as pos_total,
    COALESCE(SUM(p.amount) FILTER (WHERE p.method = 'card'), 0) as card_total,
    COALESCE(SUM(p.amount) FILTER (WHERE p.method = 'yape'), 0) as yape_total,
    COALESCE(SUM(p.amount) FILTER (WHERE p.method = 'plin'), 0) as plin_total,
    COALESCE(SUM(p.amount) FILTER (WHERE p.method = 'transfer'), 0) as transfer_total,
    COALESCE(SUM(p.amount), 0) as total_sales,
    COUNT(DISTINCT p.order_id) as orders_count
FROM public.cash_sessions cs
JOIN public.terminals t ON t.id = cs.terminal_id
LEFT JOIN public.employees e ON e.user_id = cs.user_id
LEFT JOIN public.payments p ON p.cash_session_id = cs.id
GROUP BY cs.id, cs.terminal_id, t.name, e.first_name, e.last_name, 
         cs.status, cs.opening_amount, cs.closing_amount, cs.opened_at, cs.closed_at;

-- 3. Actualizar la vista de ventas por método de pago
DROP VIEW IF EXISTS public.v_sales_by_payment_method;

CREATE VIEW public.v_sales_by_payment_method AS
SELECT 
    p.method,
    COUNT(*) as payment_count,
    COALESCE(SUM(p.amount), 0) as total_amount,
    DATE(p.created_at AT TIME ZONE 'America/Lima') as payment_date
FROM public.payments p
JOIN public.orders o ON o.id = p.order_id
WHERE o.status = 'paid'
GROUP BY p.method, DATE(p.created_at AT TIME ZONE 'America/Lima')
ORDER BY payment_date DESC, total_amount DESC;

-- 4. Otorgar permisos a usuarios autenticados
GRANT SELECT ON public.v_cash_session_summary TO authenticated;
GRANT SELECT ON public.v_sales_by_payment_method TO authenticated;

-- 5. Verificar que el enum se actualizó correctamente
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_method')
ORDER BY enumsortorder;

-- ============================================================
-- RESULTADO ESPERADO después de ejecutar:
-- cash, card, yape, plin, transfer, pos
-- ============================================================
