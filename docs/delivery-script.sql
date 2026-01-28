-- =====================================================
-- PIZZAPOS - SCRIPT SQL COMPLETO PARA DELIVERY
-- Copiar y pegar en SQL Editor de Supabase
-- =====================================================

-- =====================================================
-- PARTE 1: ENUMS NECESARIOS
-- =====================================================

-- Roles de la aplicación (incluye delivery)
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'cashier', 'kitchen', 'delivery');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Estados de órdenes
DO $$ BEGIN
    CREATE TYPE public.order_status AS ENUM ('open', 'preparing', 'ready', 'paid', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tipos de orden (incluye delivery)
DO $$ BEGIN
    CREATE TYPE public.order_type AS ENUM ('local', 'takeaway', 'delivery');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Métodos de pago
DO $$ BEGIN
    CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'yape', 'plin', 'transfer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tipos de movimiento de stock (ingredientes)
DO $$ BEGIN
    CREATE TYPE public.stock_move_type AS ENUM ('purchase', 'sale', 'adjustment', 'waste');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Tipos de movimiento de stock (productos)
DO $$ BEGIN
    CREATE TYPE public.product_stock_move_type AS ENUM ('purchase', 'sale', 'adjustment', 'waste', 'return');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Estado de sesión de caja
DO $$ BEGIN
    CREATE TYPE public.cash_session_status AS ENUM ('open', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- PARTE 2: TABLAS BASE
-- =====================================================

-- Sucursales/Tiendas
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Terminales/Cajas
CREATE TABLE IF NOT EXISTS public.terminals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PARTE 3: TABLAS DE CLIENTES Y DIRECCIONES (DELIVERY)
-- =====================================================

-- Clientes
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Direcciones de clientes (múltiples por cliente)
CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    label TEXT DEFAULT 'Casa',
    address TEXT NOT NULL,
    reference TEXT,
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PARTE 4: USUARIOS Y ROLES
-- =====================================================

-- Roles de usuario (vinculado a auth.users)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'cashier',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Empleados (perfil interno - repartidores incluidos)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PARTE 5: SESIONES DE CAJA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.cash_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    terminal_id UUID REFERENCES public.terminals(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    status cash_session_status DEFAULT 'open',
    opening_amount DECIMAL(10,2) DEFAULT 0,
    closing_amount DECIMAL(10,2),
    opened_at TIMESTAMPTZ DEFAULT now(),
    closed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PARTE 6: ÓRDENES Y PAGOS
-- =====================================================

-- Órdenes (con soporte para delivery)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number SERIAL,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    terminal_id UUID REFERENCES public.terminals(id) ON DELETE SET NULL,
    table_id UUID,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_address_id UUID REFERENCES public.customer_addresses(id) ON DELETE SET NULL,
    cash_session_id UUID REFERENCES public.cash_sessions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_type order_type DEFAULT 'local',
    status order_status DEFAULT 'open',
    subtotal DECIMAL(10,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Items de orden
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID,
    product_variant_id UUID,
    product_name TEXT NOT NULL,
    variant_name TEXT,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    modifiers_total DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Pagos
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    cash_session_id UUID REFERENCES public.cash_sessions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    method payment_method NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reference TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PARTE 7: ASIGNACIONES DE DELIVERY (TABLA PRINCIPAL)
-- =====================================================

-- Asignaciones de delivery (repartidor a orden)
CREATE TABLE IF NOT EXISTS public.delivery_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
    driver_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PARTE 8: INDEXES PARA DELIVERY
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_orders_order_type ON public.orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON public.customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order ON public.delivery_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_driver ON public.delivery_assignments(driver_user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_status ON public.delivery_assignments(delivered_at);

-- =====================================================
-- PARTE 9: FUNCIONES HELPER
-- =====================================================

-- Función para verificar si un usuario tiene un rol específico
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Función para verificar si es admin o manager
CREATE OR REPLACE FUNCTION public.is_admin_or_manager(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role IN ('admin', 'manager')
    )
$$;

-- Función para verificar si puede operar en caja
CREATE OR REPLACE FUNCTION public.can_operate_pos(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role IN ('admin', 'manager', 'cashier')
    )
$$;

-- Función para verificar si es repartidor
CREATE OR REPLACE FUNCTION public.is_delivery_driver(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = 'delivery'
    )
$$;

-- =====================================================
-- PARTE 10: VISTAS PARA DELIVERY
-- =====================================================

-- Vista: Órdenes de delivery con información completa
CREATE OR REPLACE VIEW public.v_delivery_orders AS
SELECT 
    o.id,
    o.order_number,
    o.status,
    o.total,
    o.notes,
    o.created_at,
    c.id as customer_id,
    c.name as customer_name,
    c.phone as customer_phone,
    ca.id as address_id,
    ca.address,
    ca.reference as address_reference,
    ca.label as address_label,
    da.id as assignment_id,
    da.driver_user_id,
    da.assigned_at,
    da.picked_up_at,
    da.delivered_at,
    e.first_name as driver_first_name,
    e.last_name as driver_last_name,
    e.phone as driver_phone
FROM public.orders o
LEFT JOIN public.customers c ON c.id = o.customer_id
LEFT JOIN public.customer_addresses ca ON ca.id = o.customer_address_id
LEFT JOIN public.delivery_assignments da ON da.order_id = o.id
LEFT JOIN public.employees e ON e.user_id = da.driver_user_id
WHERE o.order_type = 'delivery'
ORDER BY o.created_at DESC;

-- Vista: Resumen de deliveries por día
CREATE OR REPLACE VIEW public.v_delivery_summary AS
SELECT 
    DATE(o.created_at) as delivery_date,
    COUNT(*) as total_deliveries,
    COUNT(*) FILTER (WHERE o.status = 'paid') as completed,
    COUNT(*) FILTER (WHERE o.status = 'open') as pending,
    COUNT(*) FILTER (WHERE o.status = 'preparing') as preparing,
    COUNT(*) FILTER (WHERE o.status = 'ready') as in_transit,
    COUNT(*) FILTER (WHERE o.status = 'cancelled') as cancelled,
    SUM(o.total) FILTER (WHERE o.status = 'paid') as total_sales
FROM public.orders o
WHERE o.order_type = 'delivery'
GROUP BY DATE(o.created_at)
ORDER BY delivery_date DESC;

-- Vista: Repartidores disponibles
CREATE OR REPLACE VIEW public.v_available_drivers AS
SELECT 
    e.id as employee_id,
    e.user_id,
    e.first_name,
    e.last_name,
    e.phone,
    e.active,
    (
        SELECT COUNT(*) 
        FROM public.delivery_assignments da
        JOIN public.orders o ON o.id = da.order_id
        WHERE da.driver_user_id = e.user_id
          AND o.status IN ('preparing', 'ready')
    ) as active_deliveries
FROM public.employees e
JOIN public.user_roles ur ON ur.user_id = e.user_id
WHERE ur.role = 'delivery'
  AND e.active = true
ORDER BY active_deliveries ASC, e.first_name;

-- =====================================================
-- PARTE 11: RLS POLICIES PARA DELIVERY
-- =====================================================

-- Habilitar RLS en tablas de delivery
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;

-- Políticas para clientes
DROP POLICY IF EXISTS "Authenticated users can read customers" ON public.customers;
CREATE POLICY "Authenticated users can read customers" 
ON public.customers FOR SELECT 
TO authenticated USING (true);

DROP POLICY IF EXISTS "POS users can manage customers" ON public.customers;
CREATE POLICY "POS users can manage customers" 
ON public.customers FOR ALL 
TO authenticated USING (public.can_operate_pos(auth.uid()));

-- Políticas para direcciones de clientes
DROP POLICY IF EXISTS "Authenticated users can read customer_addresses" ON public.customer_addresses;
CREATE POLICY "Authenticated users can read customer_addresses" 
ON public.customer_addresses FOR SELECT 
TO authenticated USING (true);

DROP POLICY IF EXISTS "POS users can manage customer_addresses" ON public.customer_addresses;
CREATE POLICY "POS users can manage customer_addresses" 
ON public.customer_addresses FOR ALL 
TO authenticated USING (public.can_operate_pos(auth.uid()));

-- Políticas para asignaciones de delivery
DROP POLICY IF EXISTS "Authenticated users can read delivery_assignments" ON public.delivery_assignments;
CREATE POLICY "Authenticated users can read delivery_assignments" 
ON public.delivery_assignments FOR SELECT 
TO authenticated USING (true);

DROP POLICY IF EXISTS "Managers can manage delivery_assignments" ON public.delivery_assignments;
CREATE POLICY "Managers can manage delivery_assignments" 
ON public.delivery_assignments FOR ALL 
TO authenticated USING (
    public.is_admin_or_manager(auth.uid()) 
    OR public.can_operate_pos(auth.uid())
);

DROP POLICY IF EXISTS "Drivers can update own assignments" ON public.delivery_assignments;
CREATE POLICY "Drivers can update own assignments" 
ON public.delivery_assignments FOR UPDATE 
TO authenticated USING (
    driver_user_id = auth.uid() 
    AND public.is_delivery_driver(auth.uid())
);

-- =====================================================
-- PARTE 12: TRIGGER PARA CREAR ASIGNACIÓN AUTOMÁTICA
-- =====================================================

-- Función para crear asignación de delivery automáticamente
CREATE OR REPLACE FUNCTION public.create_delivery_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.order_type = 'delivery' THEN
        INSERT INTO public.delivery_assignments (order_id)
        VALUES (NEW.id)
        ON CONFLICT (order_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger para crear asignación automáticamente
DROP TRIGGER IF EXISTS trg_create_delivery_assignment ON public.orders;
CREATE TRIGGER trg_create_delivery_assignment
AFTER INSERT ON public.orders
FOR EACH ROW
WHEN (NEW.order_type = 'delivery')
EXECUTE FUNCTION public.create_delivery_assignment();

-- =====================================================
-- PARTE 13: DATOS INICIALES
-- =====================================================

-- Insertar tienda por defecto si no existe
INSERT INTO public.stores (name, address, phone, active)
SELECT 'Tienda Principal', 'Av. Principal 123', '999999999', true
WHERE NOT EXISTS (SELECT 1 FROM public.stores LIMIT 1);

-- Insertar terminal por defecto si no existe
INSERT INTO public.terminals (store_id, name, active)
SELECT s.id, 'Caja 1', true
FROM public.stores s
WHERE s.name = 'Tienda Principal'
  AND NOT EXISTS (SELECT 1 FROM public.terminals LIMIT 1);

-- Cliente genérico para ventas rápidas
INSERT INTO public.customers (name, phone, notes)
SELECT 'Cliente Genérico', NULL, 'Cliente por defecto para ventas rápidas'
WHERE NOT EXISTS (SELECT 1 FROM public.customers WHERE name = 'Cliente Genérico');

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ejecutar esta consulta para verificar que todo está correcto:
-- SELECT 
--     (SELECT COUNT(*) FROM public.stores) as stores,
--     (SELECT COUNT(*) FROM public.terminals) as terminals,
--     (SELECT COUNT(*) FROM public.customers) as customers,
--     (SELECT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'app_role')) as app_role_exists,
--     (SELECT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'order_type')) as order_type_exists;
