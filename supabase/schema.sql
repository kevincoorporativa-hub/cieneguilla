-- =====================================================
-- PIZZAPOS - SCRIPT SQL COMPLETO PARA SUPABASE
-- Copiar y pegar en SQL Editor de Supabase
-- =====================================================

-- =====================================================
-- PARTE 1: ENUMS
-- =====================================================

-- Roles de la aplicación
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'cashier', 'kitchen', 'delivery');

-- Estados de órdenes
CREATE TYPE public.order_status AS ENUM ('open', 'preparing', 'ready', 'paid', 'cancelled');

-- Tipos de orden
CREATE TYPE public.order_type AS ENUM ('local', 'takeaway', 'delivery');

-- Métodos de pago
CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'yape', 'plin', 'transfer');

-- Tipos de movimiento de stock
CREATE TYPE public.stock_move_type AS ENUM ('purchase', 'sale', 'adjustment', 'waste');

-- Estado de sesión de caja
CREATE TYPE public.cash_session_status AS ENUM ('open', 'closed');

-- =====================================================
-- PARTE 2: TABLAS BASE
-- =====================================================

-- Sucursales/Tiendas
CREATE TABLE public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Terminales/Cajas
CREATE TABLE public.terminals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Mesas
CREATE TABLE public.tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    capacity INT DEFAULT 4,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PARTE 3: USUARIOS Y ROLES
-- =====================================================

-- Roles de usuario (vinculado a auth.users)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'cashier',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Empleados (perfil interno)
CREATE TABLE public.employees (
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
-- PARTE 4: CATÁLOGO / PRODUCTOS
-- =====================================================

-- Categorías
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT DEFAULT '#3b82f6',
    sort_order INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Productos
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    image_url TEXT,
    active BOOLEAN DEFAULT true,
    track_stock BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Variantes de producto (tamaños)
CREATE TABLE public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL, -- 'Personal', 'Mediana', 'Familiar'
    price DECIMAL(10,2) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Grupos de modificadores
CREATE TABLE public.modifier_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- 'Extras', 'Salsas', 'Ingredientes extra'
    required BOOLEAN DEFAULT false,
    min_selections INT DEFAULT 0,
    max_selections INT DEFAULT 10,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Modificadores individuales
CREATE TABLE public.modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.modifier_groups(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Relación productos-grupos de modificadores
CREATE TABLE public.product_modifier_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    modifier_group_id UUID REFERENCES public.modifier_groups(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (product_id, modifier_group_id)
);

-- =====================================================
-- PARTE 5: CLIENTES Y DELIVERY
-- =====================================================

-- Clientes
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Direcciones de clientes
CREATE TABLE public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    label TEXT DEFAULT 'Casa', -- 'Casa', 'Trabajo', etc.
    address TEXT NOT NULL,
    reference TEXT,
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PARTE 6: CAJA (CASH SESSIONS)
-- =====================================================

-- Sesiones de caja
CREATE TABLE public.cash_sessions (
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
-- PARTE 7: ÓRDENES Y PAGOS
-- =====================================================

-- Órdenes
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number SERIAL,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    terminal_id UUID REFERENCES public.terminals(id) ON DELETE SET NULL,
    table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
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
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    variant_name TEXT,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    modifiers_total DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Modificadores por item
CREATE TABLE public.order_item_modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE NOT NULL,
    modifier_id UUID REFERENCES public.modifiers(id) ON DELETE SET NULL,
    modifier_name TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    quantity INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Pagos
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    cash_session_id UUID REFERENCES public.cash_sessions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    method payment_method NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reference TEXT, -- Número de operación para Yape/Plin/Tarjeta
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Asignaciones de delivery
CREATE TABLE public.delivery_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    driver_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    notes TEXT
);

-- =====================================================
-- PARTE 8: INVENTARIO
-- =====================================================

-- Ingredientes
CREATE TABLE public.ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    unit TEXT NOT NULL, -- 'kg', 'unidad', 'litro', 'gramos'
    min_stock DECIMAL(10,3) DEFAULT 0,
    cost_per_unit DECIMAL(10,2) DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Stock actual de ingredientes
CREATE TABLE public.ingredient_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE NOT NULL UNIQUE,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    quantity DECIMAL(10,3) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Recetas (consumo por producto)
CREATE TABLE public.product_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    product_variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE NOT NULL,
    quantity DECIMAL(10,3) NOT NULL, -- cantidad consumida
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (product_id, product_variant_id, ingredient_id)
);

-- Movimientos de stock
CREATE TABLE public.stock_moves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE NOT NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    move_type stock_move_type NOT NULL,
    quantity DECIMAL(10,3) NOT NULL, -- positivo entrada, negativo salida
    reference_id UUID, -- order_id o adjustment_id
    notes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PARTE 9: INDEXES
-- =====================================================

CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
CREATE INDEX idx_orders_store ON public.orders(store_id);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_payments_order ON public.payments(order_id);
CREATE INDEX idx_payments_session ON public.payments(cash_session_id);
CREATE INDEX idx_cash_sessions_terminal ON public.cash_sessions(terminal_id);
CREATE INDEX idx_cash_sessions_status ON public.cash_sessions(status);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_stock_moves_ingredient ON public.stock_moves(ingredient_id);
CREATE INDEX idx_delivery_assignments_driver ON public.delivery_assignments(driver_user_id);

-- =====================================================
-- PARTE 10: FUNCIONES HELPER
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

-- Función para verificar si puede operar en caja (admin, manager, cashier)
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

-- Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM public.user_roles
    WHERE user_id = auth.uid()
    LIMIT 1
$$;

-- =====================================================
-- PARTE 11: TRIGGERS Y FUNCIONES DE NEGOCIO
-- =====================================================

-- Función para recalcular totales de orden
CREATE OR REPLACE FUNCTION public.recalculate_order_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_subtotal DECIMAL(10,2);
    v_discount DECIMAL(10,2);
    v_total DECIMAL(10,2);
    v_order_record RECORD;
BEGIN
    -- Obtener el order_id correcto
    IF TG_OP = 'DELETE' THEN
        SELECT * INTO v_order_record FROM public.orders WHERE id = OLD.order_id;
    ELSE
        SELECT * INTO v_order_record FROM public.orders WHERE id = NEW.order_id;
    END IF;
    
    -- Calcular subtotal
    SELECT COALESCE(SUM(total), 0) INTO v_subtotal
    FROM public.order_items
    WHERE order_id = v_order_record.id;
    
    -- Calcular descuento
    v_discount := v_subtotal * (v_order_record.discount_percent / 100);
    
    -- Calcular total
    v_total := v_subtotal - v_discount;
    
    -- Actualizar orden
    UPDATE public.orders
    SET subtotal = v_subtotal,
        discount_amount = v_discount,
        total = v_total,
        updated_at = now()
    WHERE id = v_order_record.id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger para recalcular totales cuando cambian los items
CREATE TRIGGER trg_recalculate_order_totals
AFTER INSERT OR UPDATE OR DELETE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_order_totals();

-- Función para descontar stock cuando se paga una orden
CREATE OR REPLACE FUNCTION public.deduct_stock_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_recipe RECORD;
BEGIN
    -- Obtener la orden
    SELECT * INTO v_order FROM public.orders WHERE id = NEW.order_id;
    
    -- Solo procesar si la orden no estaba ya pagada
    IF v_order.status != 'paid' THEN
        -- Marcar orden como pagada
        UPDATE public.orders SET status = 'paid', updated_at = now() WHERE id = NEW.order_id;
        
        -- Para cada item de la orden
        FOR v_item IN SELECT * FROM public.order_items WHERE order_id = NEW.order_id
        LOOP
            -- Para cada ingrediente en la receta
            FOR v_recipe IN 
                SELECT pr.*, i.name as ingredient_name
                FROM public.product_recipes pr
                JOIN public.ingredients i ON i.id = pr.ingredient_id
                WHERE pr.product_id = v_item.product_id
                  AND (pr.product_variant_id IS NULL OR pr.product_variant_id = v_item.product_variant_id)
            LOOP
                -- Descontar del stock
                UPDATE public.ingredient_stock
                SET quantity = quantity - (v_recipe.quantity * v_item.quantity),
                    updated_at = now()
                WHERE ingredient_id = v_recipe.ingredient_id
                  AND store_id = v_order.store_id;
                
                -- Registrar movimiento
                INSERT INTO public.stock_moves (ingredient_id, store_id, move_type, quantity, reference_id, notes, user_id)
                VALUES (
                    v_recipe.ingredient_id,
                    v_order.store_id,
                    'sale',
                    -(v_recipe.quantity * v_item.quantity),
                    NEW.order_id,
                    'Venta orden #' || v_order.order_number,
                    NEW.user_id
                );
            END LOOP;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger para descontar stock al registrar pago
CREATE TRIGGER trg_deduct_stock_on_payment
AFTER INSERT ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.deduct_stock_on_payment();

-- Función para crear perfil de empleado automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Crear rol por defecto (cashier)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'cashier');
    
    -- Crear empleado básico
    INSERT INTO public.employees (user_id, first_name, last_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'Usuario'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'Nuevo'),
        NEW.email
    );
    
    RETURN NEW;
END;
$$;

-- Trigger para nuevos usuarios
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Triggers de updated_at
CREATE TRIGGER trg_stores_updated BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- PARTE 12: VIEWS PARA REPORTES
-- =====================================================

-- Vista: Ventas por día
CREATE OR REPLACE VIEW public.v_sales_by_day AS
SELECT 
    DATE(created_at) as sale_date,
    COUNT(*) as total_orders,
    SUM(total) as total_sales,
    ROUND(AVG(total), 2) as average_ticket,
    COUNT(*) FILTER (WHERE order_type = 'local') as local_orders,
    COUNT(*) FILTER (WHERE order_type = 'takeaway') as takeaway_orders,
    COUNT(*) FILTER (WHERE order_type = 'delivery') as delivery_orders
FROM public.orders
WHERE status = 'paid'
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- Vista: Ventas por método de pago
CREATE OR REPLACE VIEW public.v_sales_by_payment_method AS
SELECT 
    p.method,
    COUNT(*) as payment_count,
    SUM(p.amount) as total_amount,
    DATE(p.created_at) as payment_date
FROM public.payments p
JOIN public.orders o ON o.id = p.order_id
WHERE o.status = 'paid'
GROUP BY p.method, DATE(p.created_at)
ORDER BY payment_date DESC, total_amount DESC;

-- Vista: Productos más vendidos
CREATE OR REPLACE VIEW public.v_top_products AS
SELECT 
    oi.product_id,
    oi.product_name,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.total) as total_sales,
    COUNT(DISTINCT oi.order_id) as order_count
FROM public.order_items oi
JOIN public.orders o ON o.id = oi.order_id
WHERE o.status = 'paid'
GROUP BY oi.product_id, oi.product_name
ORDER BY total_quantity DESC
LIMIT 10;

-- Vista: Ventas por categoría
CREATE OR REPLACE VIEW public.v_sales_by_category AS
SELECT 
    c.id as category_id,
    c.name as category_name,
    COUNT(DISTINCT oi.order_id) as order_count,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.total) as total_sales
FROM public.order_items oi
JOIN public.products p ON p.id = oi.product_id
JOIN public.categories c ON c.id = p.category_id
JOIN public.orders o ON o.id = oi.order_id
WHERE o.status = 'paid'
GROUP BY c.id, c.name
ORDER BY total_sales DESC;

-- Vista: Resumen de sesiones de caja
CREATE OR REPLACE VIEW public.v_cash_session_summary AS
SELECT 
    cs.id as session_id,
    cs.terminal_id,
    t.name as terminal_name,
    e.first_name || ' ' || e.last_name as cashier_name,
    cs.status,
    cs.opening_amount,
    cs.closing_amount,
    cs.opened_at,
    cs.closed_at,
    COALESCE(SUM(p.amount) FILTER (WHERE p.method = 'cash'), 0) as cash_total,
    COALESCE(SUM(p.amount) FILTER (WHERE p.method = 'card'), 0) as card_total,
    COALESCE(SUM(p.amount) FILTER (WHERE p.method = 'yape'), 0) as yape_total,
    COALESCE(SUM(p.amount) FILTER (WHERE p.method = 'plin'), 0) as plin_total,
    COALESCE(SUM(p.amount), 0) as total_sales,
    COUNT(DISTINCT p.order_id) as orders_count
FROM public.cash_sessions cs
JOIN public.terminals t ON t.id = cs.terminal_id
LEFT JOIN public.employees e ON e.user_id = cs.user_id
LEFT JOIN public.payments p ON p.cash_session_id = cs.id
GROUP BY cs.id, t.name, e.first_name, e.last_name;

-- Vista: Stock actual con alertas
CREATE OR REPLACE VIEW public.v_current_stock AS
SELECT 
    i.id as ingredient_id,
    i.name as ingredient_name,
    i.unit,
    i.min_stock,
    COALESCE(ist.quantity, 0) as current_quantity,
    CASE 
        WHEN COALESCE(ist.quantity, 0) <= 0 THEN 'out_of_stock'
        WHEN COALESCE(ist.quantity, 0) <= i.min_stock THEN 'low_stock'
        ELSE 'ok'
    END as stock_status,
    ist.store_id,
    s.name as store_name
FROM public.ingredients i
LEFT JOIN public.ingredient_stock ist ON ist.ingredient_id = i.id
LEFT JOIN public.stores s ON s.id = ist.store_id
WHERE i.active = true
ORDER BY stock_status DESC, i.name;

-- Vista: Órdenes abiertas (para cocina)
CREATE OR REPLACE VIEW public.v_open_orders AS
SELECT 
    o.id,
    o.order_number,
    o.order_type,
    o.status,
    o.table_id,
    t.name as table_name,
    o.notes,
    o.created_at,
    EXTRACT(EPOCH FROM (now() - o.created_at))/60 as minutes_waiting,
    json_agg(
        json_build_object(
            'id', oi.id,
            'product_name', oi.product_name,
            'variant_name', oi.variant_name,
            'quantity', oi.quantity,
            'notes', oi.notes
        )
    ) as items
FROM public.orders o
LEFT JOIN public.tables t ON t.id = o.table_id
LEFT JOIN public.order_items oi ON oi.order_id = o.id
WHERE o.status IN ('open', 'preparing')
GROUP BY o.id, t.name
ORDER BY o.created_at ASC;

-- =====================================================
-- PARTE 13: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredient_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_moves ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS: STORES
-- =====================================================
CREATE POLICY "Everyone can view stores" ON public.stores
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/Manager can manage stores" ON public.stores
    FOR ALL TO authenticated
    USING (public.is_admin_or_manager(auth.uid()))
    WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS: TERMINALS
-- =====================================================
CREATE POLICY "Everyone can view terminals" ON public.terminals
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/Manager can manage terminals" ON public.terminals
    FOR ALL TO authenticated
    USING (public.is_admin_or_manager(auth.uid()))
    WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS: TABLES
-- =====================================================
CREATE POLICY "Everyone can view tables" ON public.tables
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/Manager can manage tables" ON public.tables
    FOR ALL TO authenticated
    USING (public.is_admin_or_manager(auth.uid()))
    WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS: USER_ROLES
-- =====================================================
CREATE POLICY "Users can view own role" ON public.user_roles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin can manage roles" ON public.user_roles
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- POLÍTICAS RLS: EMPLOYEES
-- =====================================================
CREATE POLICY "Users can view own profile" ON public.employees
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Users can update own profile" ON public.employees
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can manage employees" ON public.employees
    FOR ALL TO authenticated
    USING (public.is_admin_or_manager(auth.uid()))
    WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS: CATÁLOGO (Solo lectura para todos, escritura admin/manager)
-- =====================================================
CREATE POLICY "Everyone can view categories" ON public.categories
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/Manager can manage categories" ON public.categories
    FOR ALL TO authenticated
    USING (public.is_admin_or_manager(auth.uid()))
    WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Everyone can view products" ON public.products
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/Manager can manage products" ON public.products
    FOR ALL TO authenticated
    USING (public.is_admin_or_manager(auth.uid()))
    WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Everyone can view variants" ON public.product_variants
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/Manager can manage variants" ON public.product_variants
    FOR ALL TO authenticated
    USING (public.is_admin_or_manager(auth.uid()))
    WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Everyone can view modifier_groups" ON public.modifier_groups
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/Manager can manage modifier_groups" ON public.modifier_groups
    FOR ALL TO authenticated
    USING (public.is_admin_or_manager(auth.uid()))
    WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Everyone can view modifiers" ON public.modifiers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/Manager can manage modifiers" ON public.modifiers
    FOR ALL TO authenticated
    USING (public.is_admin_or_manager(auth.uid()))
    WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Everyone can view product_modifier_groups" ON public.product_modifier_groups
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/Manager can manage product_modifier_groups" ON public.product_modifier_groups
    FOR ALL TO authenticated
    USING (public.is_admin_or_manager(auth.uid()))
    WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS: CLIENTES
-- =====================================================
CREATE POLICY "POS users can view customers" ON public.customers
    FOR SELECT TO authenticated
    USING (public.can_operate_pos(auth.uid()));

CREATE POLICY "POS users can manage customers" ON public.customers
    FOR ALL TO authenticated
    USING (public.can_operate_pos(auth.uid()))
    WITH CHECK (public.can_operate_pos(auth.uid()));

CREATE POLICY "POS users can view addresses" ON public.customer_addresses
    FOR SELECT TO authenticated
    USING (public.can_operate_pos(auth.uid()));

CREATE POLICY "POS users can manage addresses" ON public.customer_addresses
    FOR ALL TO authenticated
    USING (public.can_operate_pos(auth.uid()))
    WITH CHECK (public.can_operate_pos(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS: CASH SESSIONS
-- =====================================================
CREATE POLICY "Cashiers can view own sessions" ON public.cash_sessions
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Cashiers can create sessions" ON public.cash_sessions
    FOR INSERT TO authenticated
    WITH CHECK (public.can_operate_pos(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Cashiers can close own sessions" ON public.cash_sessions
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid() OR public.is_admin_or_manager(auth.uid()))
    WITH CHECK (user_id = auth.uid() OR public.is_admin_or_manager(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS: ORDERS
-- =====================================================
CREATE POLICY "POS and Kitchen can view orders" ON public.orders
    FOR SELECT TO authenticated
    USING (
        public.can_operate_pos(auth.uid()) 
        OR public.has_role(auth.uid(), 'kitchen')
        OR public.has_role(auth.uid(), 'delivery')
    );

CREATE POLICY "POS can create orders" ON public.orders
    FOR INSERT TO authenticated
    WITH CHECK (public.can_operate_pos(auth.uid()));

CREATE POLICY "POS can update orders" ON public.orders
    FOR UPDATE TO authenticated
    USING (public.can_operate_pos(auth.uid()))
    WITH CHECK (public.can_operate_pos(auth.uid()));

CREATE POLICY "Admin can delete orders" ON public.orders
    FOR DELETE TO authenticated
    USING (public.is_admin_or_manager(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS: ORDER ITEMS
-- =====================================================
CREATE POLICY "POS and Kitchen can view order_items" ON public.order_items
    FOR SELECT TO authenticated
    USING (
        public.can_operate_pos(auth.uid()) 
        OR public.has_role(auth.uid(), 'kitchen')
    );

CREATE POLICY "POS can manage order_items" ON public.order_items
    FOR ALL TO authenticated
    USING (public.can_operate_pos(auth.uid()))
    WITH CHECK (public.can_operate_pos(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS: ORDER ITEM MODIFIERS
-- =====================================================
CREATE POLICY "POS and Kitchen can view modifiers" ON public.order_item_modifiers
    FOR SELECT TO authenticated
    USING (
        public.can_operate_pos(auth.uid()) 
        OR public.has_role(auth.uid(), 'kitchen')
    );

CREATE POLICY "POS can manage item modifiers" ON public.order_item_modifiers
    FOR ALL TO authenticated
    USING (public.can_operate_pos(auth.uid()))
    WITH CHECK (public.can_operate_pos(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS: PAYMENTS
-- =====================================================
CREATE POLICY "Cashiers view own payments, admin all" ON public.payments
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Cashiers can create payments" ON public.payments
    FOR INSERT TO authenticated
    WITH CHECK (public.can_operate_pos(auth.uid()));

CREATE POLICY "Admin can manage payments" ON public.payments
    FOR ALL TO authenticated
    USING (public.is_admin_or_manager(auth.uid()))
    WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS: DELIVERY ASSIGNMENTS
-- =====================================================
CREATE POLICY "Drivers see own assignments" ON public.delivery_assignments
    FOR SELECT TO authenticated
    USING (
        driver_user_id = auth.uid() 
        OR public.is_admin_or_manager(auth.uid())
        OR public.can_operate_pos(auth.uid())
    );

CREATE POLICY "POS can manage assignments" ON public.delivery_assignments
    FOR ALL TO authenticated
    USING (public.can_operate_pos(auth.uid()))
    WITH CHECK (public.can_operate_pos(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS: INVENTARIO (Solo admin/manager)
-- =====================================================
CREATE POLICY "Admin/Manager can view ingredients" ON public.ingredients
    FOR SELECT TO authenticated
    USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin/Manager can manage ingredients" ON public.ingredients
    FOR ALL TO authenticated
    USING (public.is_admin_or_manager(auth.uid()))
    WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin/Manager can view stock" ON public.ingredient_stock
    FOR SELECT TO authenticated
    USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin/Manager can manage stock" ON public.ingredient_stock
    FOR ALL TO authenticated
    USING (public.is_admin_or_manager(auth.uid()))
    WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin/Manager can view recipes" ON public.product_recipes
    FOR SELECT TO authenticated
    USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin/Manager can manage recipes" ON public.product_recipes
    FOR ALL TO authenticated
    USING (public.is_admin_or_manager(auth.uid()))
    WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin/Manager can view stock_moves" ON public.stock_moves
    FOR SELECT TO authenticated
    USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Admin/Manager can manage stock_moves" ON public.stock_moves
    FOR ALL TO authenticated
    USING (public.is_admin_or_manager(auth.uid()))
    WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- =====================================================
-- PARTE 14: DATOS DE EJEMPLO (SEED)
-- =====================================================

-- Insertar tienda
INSERT INTO public.stores (id, name, address, phone) VALUES
('11111111-1111-1111-1111-111111111111', 'PizzaPOS Central', 'Av. Principal 123, Lima', '01-234-5678');

-- Insertar terminal
INSERT INTO public.terminals (id, store_id, name) VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Caja 1');

-- Insertar mesa
INSERT INTO public.tables (id, store_id, name, capacity) VALUES
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Mesa 1', 4);

-- Insertar categorías
INSERT INTO public.categories (id, name, description, icon, color, sort_order) VALUES
('c1111111-1111-1111-1111-111111111111', 'Pizzas', 'Nuestras deliciosas pizzas artesanales', '🍕', '#ef4444', 1),
('c2222222-2222-2222-2222-222222222222', 'Bebidas', 'Refrescos y gaseosas', '🥤', '#3b82f6', 2),
('c3333333-3333-3333-3333-333333333333', 'Cócteles', 'Bebidas preparadas', '🍹', '#8b5cf6', 3),
('c4444444-4444-4444-4444-444444444444', 'Combos', 'Promociones especiales', '🎁', '#22c55e', 4),
('c5555555-5555-5555-5555-555555555555', 'Extras', 'Complementos y adicionales', '➕', '#f59e0b', 5);

-- Insertar productos (Pizzas)
INSERT INTO public.products (id, category_id, name, description, base_price, track_stock) VALUES
('p1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Pizza Margarita', 'Salsa de tomate, mozzarella y albahaca fresca', 28.00, true),
('p2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'Pizza Pepperoni', 'Salsa de tomate, mozzarella y pepperoni', 32.00, true),
('p3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'Pizza Hawaiana', 'Jamón, piña y mozzarella', 35.00, true),
('p4444444-4444-4444-4444-444444444444', 'c1111111-1111-1111-1111-111111111111', 'Pizza Suprema', 'Pepperoni, jamón, pimiento, champiñones, aceitunas', 42.00, true),
('p5555555-5555-5555-5555-555555555555', 'c1111111-1111-1111-1111-111111111111', 'Pizza BBQ', 'Pollo, cebolla, mozzarella y salsa BBQ', 38.00, true),
('p6666666-6666-6666-6666-666666666666', 'c1111111-1111-1111-1111-111111111111', 'Pizza Vegetariana', 'Pimiento, champiñones, aceitunas, tomate, cebolla', 30.00, true);

-- Bebidas
INSERT INTO public.products (id, category_id, name, description, base_price) VALUES
('p7777777-7777-7777-7777-777777777777', 'c2222222-2222-2222-2222-222222222222', 'Coca Cola', 'Gaseosa 500ml', 5.00),
('p8888888-8888-8888-8888-888888888888', 'c2222222-2222-2222-2222-222222222222', 'Inca Kola', 'Gaseosa 500ml', 5.00),
('p9999999-9999-9999-9999-999999999999', 'c2222222-2222-2222-2222-222222222222', 'Agua Mineral', 'Botella 500ml', 3.00);

-- Combo
INSERT INTO public.products (id, category_id, name, description, base_price) VALUES
('pa111111-1111-1111-1111-111111111111', 'c4444444-4444-4444-4444-444444444444', 'Combo Familiar', 'Pizza familiar + 2 gaseosas 1.5L', 65.00);

-- Variantes de pizza
INSERT INTO public.product_variants (id, product_id, name, price) VALUES
-- Margarita
('v1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111', 'Personal', 18.00),
('v1111111-1111-1111-1111-111111111112', 'p1111111-1111-1111-1111-111111111111', 'Mediana', 28.00),
('v1111111-1111-1111-1111-111111111113', 'p1111111-1111-1111-1111-111111111111', 'Familiar', 42.00),
-- Pepperoni
('v2222222-2222-2222-2222-222222222221', 'p2222222-2222-2222-2222-222222222222', 'Personal', 22.00),
('v2222222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222', 'Mediana', 32.00),
('v2222222-2222-2222-2222-222222222223', 'p2222222-2222-2222-2222-222222222222', 'Familiar', 48.00),
-- Hawaiana
('v3333333-3333-3333-3333-333333333331', 'p3333333-3333-3333-3333-333333333333', 'Personal', 24.00),
('v3333333-3333-3333-3333-333333333332', 'p3333333-3333-3333-3333-333333333333', 'Mediana', 35.00),
('v3333333-3333-3333-3333-333333333333', 'p3333333-3333-3333-3333-333333333333', 'Familiar', 52.00);

-- Grupo de modificadores
INSERT INTO public.modifier_groups (id, name, min_selections, max_selections) VALUES
('mg111111-1111-1111-1111-111111111111', 'Extras', 0, 5);

-- Modificadores (extras)
INSERT INTO public.modifiers (id, group_id, name, price) VALUES
('m1111111-1111-1111-1111-111111111111', 'mg111111-1111-1111-1111-111111111111', 'Extra queso', 3.00),
('m2222222-2222-2222-2222-222222222222', 'mg111111-1111-1111-1111-111111111111', 'Extra pepperoni', 4.00),
('m3333333-3333-3333-3333-333333333333', 'mg111111-1111-1111-1111-111111111111', 'Aceitunas extra', 2.00),
('m4444444-4444-4444-4444-444444444444', 'mg111111-1111-1111-1111-111111111111', 'Champiñones extra', 3.00),
('m5555555-5555-5555-5555-555555555555', 'mg111111-1111-1111-1111-111111111111', 'Jamón extra', 4.00);

-- Asociar modificadores a pizzas
INSERT INTO public.product_modifier_groups (product_id, modifier_group_id) VALUES
('p1111111-1111-1111-1111-111111111111', 'mg111111-1111-1111-1111-111111111111'),
('p2222222-2222-2222-2222-222222222222', 'mg111111-1111-1111-1111-111111111111'),
('p3333333-3333-3333-3333-333333333333', 'mg111111-1111-1111-1111-111111111111'),
('p4444444-4444-4444-4444-444444444444', 'mg111111-1111-1111-1111-111111111111'),
('p5555555-5555-5555-5555-555555555555', 'mg111111-1111-1111-1111-111111111111'),
('p6666666-6666-6666-6666-666666666666', 'mg111111-1111-1111-1111-111111111111');

-- Cliente de ejemplo
INSERT INTO public.customers (id, name, phone, email) VALUES
('cu111111-1111-1111-1111-111111111111', 'Carlos Rodríguez', '999-888-777', 'carlos@email.com');

-- Dirección del cliente
INSERT INTO public.customer_addresses (id, customer_id, label, address, reference, is_default) VALUES
('ca111111-1111-1111-1111-111111111111', 'cu111111-1111-1111-1111-111111111111', 'Casa', 'Jr. Las Flores 456, San Isidro', 'Frente al parque', true);

-- Ingredientes
INSERT INTO public.ingredients (id, name, unit, min_stock, cost_per_unit) VALUES
('i1111111-1111-1111-1111-111111111111', 'Masa de pizza', 'unidad', 10, 3.00),
('i2222222-2222-2222-2222-222222222222', 'Salsa de tomate', 'kg', 2, 8.00),
('i3333333-3333-3333-3333-333333333333', 'Queso mozzarella', 'kg', 3, 25.00),
('i4444444-4444-4444-4444-444444444444', 'Pepperoni', 'kg', 1, 35.00),
('i5555555-5555-5555-5555-555555555555', 'Jamón', 'kg', 1, 20.00),
('i6666666-6666-6666-6666-666666666666', 'Piña', 'kg', 1, 8.00),
('i7777777-7777-7777-7777-777777777777', 'Albahaca', 'kg', 0.2, 15.00);

-- Stock inicial
INSERT INTO public.ingredient_stock (ingredient_id, store_id, quantity) VALUES
('i1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 50),
('i2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 10),
('i3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 15),
('i4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 5),
('i5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 4),
('i6666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 3),
('i7777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 0.5);

-- Recetas (consumo por pizza mediana)
INSERT INTO public.product_recipes (product_id, product_variant_id, ingredient_id, quantity) VALUES
-- Pizza Margarita Mediana
('p1111111-1111-1111-1111-111111111111', 'v1111111-1111-1111-1111-111111111112', 'i1111111-1111-1111-1111-111111111111', 1),
('p1111111-1111-1111-1111-111111111111', 'v1111111-1111-1111-1111-111111111112', 'i2222222-2222-2222-2222-222222222222', 0.15),
('p1111111-1111-1111-1111-111111111111', 'v1111111-1111-1111-1111-111111111112', 'i3333333-3333-3333-3333-333333333333', 0.25),
('p1111111-1111-1111-1111-111111111111', 'v1111111-1111-1111-1111-111111111112', 'i7777777-7777-7777-7777-777777777777', 0.02),
-- Pizza Pepperoni Mediana
('p2222222-2222-2222-2222-222222222222', 'v2222222-2222-2222-2222-222222222222', 'i1111111-1111-1111-1111-111111111111', 1),
('p2222222-2222-2222-2222-222222222222', 'v2222222-2222-2222-2222-222222222222', 'i2222222-2222-2222-2222-222222222222', 0.15),
('p2222222-2222-2222-2222-222222222222', 'v2222222-2222-2222-2222-222222222222', 'i3333333-3333-3333-3333-333333333333', 0.25),
('p2222222-2222-2222-2222-222222222222', 'v2222222-2222-2222-2222-222222222222', 'i4444444-4444-4444-4444-444444444444', 0.1),
-- Pizza Hawaiana Mediana
('p3333333-3333-3333-3333-333333333333', 'v3333333-3333-3333-3333-333333333332', 'i1111111-1111-1111-1111-111111111111', 1),
('p3333333-3333-3333-3333-333333333333', 'v3333333-3333-3333-3333-333333333332', 'i2222222-2222-2222-2222-222222222222', 0.15),
('p3333333-3333-3333-3333-333333333333', 'v3333333-3333-3333-3333-333333333332', 'i3333333-3333-3333-3333-333333333333', 0.25),
('p3333333-3333-3333-3333-333333333333', 'v3333333-3333-3333-3333-333333333332', 'i5555555-5555-5555-5555-555555555555', 0.1),
('p3333333-3333-3333-3333-333333333333', 'v3333333-3333-3333-3333-333333333332', 'i6666666-6666-6666-6666-666666666666', 0.15);

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

-- =====================================================
-- NOTAS DE USO:
-- =====================================================
-- 
-- 1. CREAR USUARIO ADMIN:
--    - Ve a Authentication > Users en Supabase Dashboard
--    - Click "Add user" > ingresa email y contraseña
--    - Copia el UUID del usuario creado
--    - Ejecuta este SQL reemplazando el UUID:
--
--    UPDATE public.user_roles SET role = 'admin' 
--    WHERE user_id = 'TU-UUID-AQUI';
--
-- 2. CREAR OTROS USUARIOS:
--    - Mismo proceso, pero no cambies el rol (quedan como 'cashier')
--    - Para cambiar rol: 
--    UPDATE public.user_roles SET role = 'manager' WHERE user_id = 'UUID';
--
-- 3. PROBAR EL SISTEMA:
--    - Login con tu usuario admin
--    - Crea una orden desde el POS
--    - Añade productos
--    - Procesa el pago
--    - Revisa los reportes
--
-- =====================================================
