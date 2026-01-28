-- =====================================================
-- PIZZAPOS - SCRIPT SQL COMPLETO PARA SUPABASE
-- Ejecutar en SQL Editor de Supabase
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

-- Tipos de movimiento de stock (ingredientes)
CREATE TYPE public.stock_move_type AS ENUM ('purchase', 'sale', 'adjustment', 'waste');

-- Tipos de movimiento de stock (productos)
CREATE TYPE public.product_stock_move_type AS ENUM ('purchase', 'sale', 'adjustment', 'waste', 'return');

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

-- Productos (con campos de inventario y vencimiento)
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    image_url TEXT,
    active BOOLEAN DEFAULT true,
    track_stock BOOLEAN DEFAULT false,
    min_stock INT DEFAULT 5,
    expires BOOLEAN DEFAULT false,
    expiration_date DATE,
    entry_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Variantes de producto (tamaños)
CREATE TABLE public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Grupos de modificadores
CREATE TABLE public.modifier_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
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
-- PARTE 5: INVENTARIO DE PRODUCTOS
-- =====================================================

-- Stock actual de productos por tienda
CREATE TABLE public.product_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    quantity DECIMAL(10,3) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (product_id, store_id)
);

-- Movimientos de stock de productos (Kardex)
CREATE TABLE public.product_stock_moves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    move_type product_stock_move_type NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_cost DECIMAL(10,2),
    reference_id UUID,
    notes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PARTE 6: CLIENTES Y DELIVERY
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
    label TEXT DEFAULT 'Casa',
    address TEXT NOT NULL,
    reference TEXT,
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PARTE 7: CAJA (CASH SESSIONS)
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
-- PARTE 8: ÓRDENES Y PAGOS
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
    reference TEXT,
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
-- PARTE 9: INVENTARIO DE INGREDIENTES/INSUMOS
-- =====================================================

-- Ingredientes
CREATE TABLE public.ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
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
    quantity DECIMAL(10,3) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (product_id, product_variant_id, ingredient_id)
);

-- Movimientos de stock de ingredientes
CREATE TABLE public.stock_moves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE NOT NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    move_type stock_move_type NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    reference_id UUID,
    notes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PARTE 10: COMBOS
-- =====================================================

-- Combos
CREATE TABLE public.combos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    active BOOLEAN DEFAULT true,
    is_temporary BOOLEAN DEFAULT false,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Items de combo
CREATE TABLE public.combo_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_id UUID REFERENCES public.combos(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PARTE 11: INDEXES
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
CREATE INDEX idx_products_expires ON public.products(expires, expiration_date);
CREATE INDEX idx_product_stock_product ON public.product_stock(product_id);
CREATE INDEX idx_product_stock_moves_product ON public.product_stock_moves(product_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_stock_moves_ingredient ON public.stock_moves(ingredient_id);
CREATE INDEX idx_delivery_assignments_driver ON public.delivery_assignments(driver_user_id);

-- =====================================================
-- PARTE 12: FUNCIONES HELPER
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
-- PARTE 13: TRIGGERS Y FUNCIONES DE NEGOCIO
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
    IF TG_OP = 'DELETE' THEN
        SELECT * INTO v_order_record FROM public.orders WHERE id = OLD.order_id;
    ELSE
        SELECT * INTO v_order_record FROM public.orders WHERE id = NEW.order_id;
    END IF;
    
    SELECT COALESCE(SUM(total), 0) INTO v_subtotal
    FROM public.order_items
    WHERE order_id = v_order_record.id;
    
    v_discount := v_subtotal * (v_order_record.discount_percent / 100);
    v_total := v_subtotal - v_discount;
    
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

CREATE TRIGGER trg_recalculate_order_totals
AFTER INSERT OR UPDATE OR DELETE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_order_totals();

-- Función para descontar stock de productos cuando se paga
CREATE OR REPLACE FUNCTION public.deduct_product_stock_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = NEW.order_id;
    
    IF v_order.status != 'paid' THEN
        UPDATE public.orders SET status = 'paid', updated_at = now() WHERE id = NEW.order_id;
        
        FOR v_item IN SELECT oi.*, p.track_stock 
                      FROM public.order_items oi
                      JOIN public.products p ON p.id = oi.product_id
                      WHERE oi.order_id = NEW.order_id
        LOOP
            IF v_item.track_stock THEN
                -- Actualizar stock
                UPDATE public.product_stock
                SET quantity = quantity - v_item.quantity,
                    updated_at = now()
                WHERE product_id = v_item.product_id
                  AND store_id = v_order.store_id;
                
                -- Registrar movimiento
                INSERT INTO public.product_stock_moves 
                    (product_id, store_id, move_type, quantity, reference_id, notes, user_id)
                VALUES (
                    v_item.product_id,
                    v_order.store_id,
                    'sale',
                    -v_item.quantity,
                    NEW.order_id,
                    'Venta orden #' || v_order.order_number,
                    NEW.user_id
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

-- Función para descontar stock de ingredientes
CREATE OR REPLACE FUNCTION public.deduct_ingredient_stock_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_recipe RECORD;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = NEW.order_id;
    
    FOR v_item IN SELECT * FROM public.order_items WHERE order_id = NEW.order_id
    LOOP
        FOR v_recipe IN 
            SELECT pr.*, i.name as ingredient_name
            FROM public.product_recipes pr
            JOIN public.ingredients i ON i.id = pr.ingredient_id
            WHERE pr.product_id = v_item.product_id
              AND (pr.product_variant_id IS NULL OR pr.product_variant_id = v_item.product_variant_id)
        LOOP
            UPDATE public.ingredient_stock
            SET quantity = quantity - (v_recipe.quantity * v_item.quantity),
                updated_at = now()
            WHERE ingredient_id = v_recipe.ingredient_id
              AND store_id = v_order.store_id;
            
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
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_deduct_ingredient_stock_on_payment
AFTER INSERT ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.deduct_ingredient_stock_on_payment();

-- Función para crear perfil de empleado automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'cashier');
    
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

CREATE TRIGGER trg_stores_updated BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- PARTE 14: VIEWS PARA REPORTES
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

-- Vista: Stock actual con alertas (ingredientes)
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

-- Vista: Stock actual de productos con alertas
CREATE OR REPLACE VIEW public.v_product_stock_status AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.min_stock,
    p.expires,
    p.expiration_date,
    p.entry_date,
    COALESCE(ps.quantity, 0) as current_quantity,
    CASE 
        WHEN COALESCE(ps.quantity, 0) <= 0 THEN 'out_of_stock'
        WHEN COALESCE(ps.quantity, 0) <= p.min_stock THEN 'low_stock'
        ELSE 'ok'
    END as stock_status,
    CASE 
        WHEN p.expires AND p.expiration_date IS NOT NULL THEN
            CASE 
                WHEN p.expiration_date < CURRENT_DATE THEN 'expired'
                WHEN p.expiration_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'expiring_soon'
                WHEN p.expiration_date <= CURRENT_DATE + INTERVAL '20 days' THEN 'expiring_warning'
                ELSE 'ok'
            END
        ELSE 'no_expiry'
    END as expiry_status,
    ps.store_id,
    s.name as store_name
FROM public.products p
LEFT JOIN public.product_stock ps ON ps.product_id = p.id
LEFT JOIN public.stores s ON s.id = ps.store_id
WHERE p.active = true AND p.track_stock = true
ORDER BY stock_status DESC, p.name;

-- Vista: Productos por vencer
CREATE OR REPLACE VIEW public.v_expiring_products AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.expiration_date,
    p.entry_date,
    COALESCE(ps.quantity, 0) as current_quantity,
    (p.expiration_date - CURRENT_DATE) as days_until_expiry,
    CASE 
        WHEN p.expiration_date < CURRENT_DATE THEN 'expired'
        WHEN p.expiration_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'critical'
        WHEN p.expiration_date <= CURRENT_DATE + INTERVAL '14 days' THEN 'warning'
        ELSE 'ok'
    END as urgency,
    ps.store_id,
    s.name as store_name
FROM public.products p
LEFT JOIN public.product_stock ps ON ps.product_id = p.id
LEFT JOIN public.stores s ON s.id = ps.store_id
WHERE p.active = true 
  AND p.expires = true 
  AND p.expiration_date IS NOT NULL
  AND p.expiration_date <= CURRENT_DATE + INTERVAL '20 days'
ORDER BY p.expiration_date ASC;

-- =====================================================
-- PARTE 15: RLS POLICIES
-- =====================================================

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
ALTER TABLE public.product_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_stock_moves ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_items ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura para usuarios autenticados
CREATE POLICY "Authenticated users can read stores" ON public.stores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read terminals" ON public.terminals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read tables" ON public.tables FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read product_variants" ON public.product_variants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read modifier_groups" ON public.modifier_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read modifiers" ON public.modifiers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read product_modifier_groups" ON public.product_modifier_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read product_stock" ON public.product_stock FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read product_stock_moves" ON public.product_stock_moves FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read customer_addresses" ON public.customer_addresses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read ingredients" ON public.ingredients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read ingredient_stock" ON public.ingredient_stock FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read product_recipes" ON public.product_recipes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read combos" ON public.combos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read combo_items" ON public.combo_items FOR SELECT TO authenticated USING (true);

-- Políticas para roles de usuario
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));

-- Políticas para empleados
CREATE POLICY "Users can read own employee profile" ON public.employees FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admins can manage employees" ON public.employees FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));

-- Políticas para órdenes
CREATE POLICY "POS users can read orders" ON public.orders FOR SELECT TO authenticated USING (public.can_operate_pos(auth.uid()));
CREATE POLICY "POS users can create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (public.can_operate_pos(auth.uid()));
CREATE POLICY "POS users can update orders" ON public.orders FOR UPDATE TO authenticated USING (public.can_operate_pos(auth.uid()));

-- Políticas para items de orden
CREATE POLICY "POS users can read order_items" ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "POS users can create order_items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (public.can_operate_pos(auth.uid()));
CREATE POLICY "POS users can update order_items" ON public.order_items FOR UPDATE TO authenticated USING (public.can_operate_pos(auth.uid()));

-- Políticas para pagos
CREATE POLICY "POS users can read payments" ON public.payments FOR SELECT TO authenticated USING (public.can_operate_pos(auth.uid()));
CREATE POLICY "POS users can create payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (public.can_operate_pos(auth.uid()));

-- Políticas para sesiones de caja
CREATE POLICY "POS users can read cash_sessions" ON public.cash_sessions FOR SELECT TO authenticated USING (public.can_operate_pos(auth.uid()));
CREATE POLICY "POS users can create cash_sessions" ON public.cash_sessions FOR INSERT TO authenticated WITH CHECK (public.can_operate_pos(auth.uid()));
CREATE POLICY "POS users can update own cash_sessions" ON public.cash_sessions FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin_or_manager(auth.uid()));

-- Políticas para delivery
CREATE POLICY "Authenticated users can read delivery_assignments" ON public.delivery_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage delivery_assignments" ON public.delivery_assignments FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));

-- Políticas para stock moves
CREATE POLICY "Authenticated users can read stock_moves" ON public.stock_moves FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage stock_moves" ON public.stock_moves FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));

-- Políticas para order_item_modifiers
CREATE POLICY "Authenticated users can read order_item_modifiers" ON public.order_item_modifiers FOR SELECT TO authenticated USING (true);
CREATE POLICY "POS users can manage order_item_modifiers" ON public.order_item_modifiers FOR ALL TO authenticated USING (public.can_operate_pos(auth.uid()));

-- Políticas para gestión (admin/manager)
CREATE POLICY "Admins can manage stores" ON public.stores FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admins can manage terminals" ON public.terminals FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admins can manage tables" ON public.tables FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admins can manage products" ON public.products FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admins can manage product_variants" ON public.product_variants FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admins can manage modifier_groups" ON public.modifier_groups FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admins can manage modifiers" ON public.modifiers FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admins can manage product_modifier_groups" ON public.product_modifier_groups FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admins can manage product_stock" ON public.product_stock FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admins can manage product_stock_moves" ON public.product_stock_moves FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admins can manage customers" ON public.customers FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admins can manage customer_addresses" ON public.customer_addresses FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admins can manage ingredients" ON public.ingredients FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admins can manage ingredient_stock" ON public.ingredient_stock FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admins can manage product_recipes" ON public.product_recipes FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admins can manage combos" ON public.combos FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admins can manage combo_items" ON public.combo_items FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));

-- =====================================================
-- PARTE 16: DATOS INICIALES (SEED)
-- =====================================================

-- Insertar tienda por defecto
INSERT INTO public.stores (id, name, address, phone) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Sucursal Principal', 'Av. Principal 123, Lima', '01-234-5678');

-- Insertar terminal por defecto
INSERT INTO public.terminals (id, store_id, name) 
VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Caja 1');

-- Insertar categorías
INSERT INTO public.categories (name, icon, color, sort_order) VALUES
('Pizzas', 'pizza', '#ef4444', 1),
('Bebidas', 'cup-soda', '#3b82f6', 2),
('Postres', 'cake', '#ec4899', 3),
('Combos', 'package', '#8b5cf6', 4);

-- Insertar productos de ejemplo
INSERT INTO public.products (name, category_id, base_price, track_stock, expires, entry_date) VALUES
('Pizza Margherita', (SELECT id FROM public.categories WHERE name = 'Pizzas'), 35.00, false, false, CURRENT_DATE),
('Pizza Pepperoni', (SELECT id FROM public.categories WHERE name = 'Pizzas'), 40.00, false, false, CURRENT_DATE),
('Pizza Hawaiana', (SELECT id FROM public.categories WHERE name = 'Pizzas'), 38.00, false, false, CURRENT_DATE),
('Coca Cola 500ml', (SELECT id FROM public.categories WHERE name = 'Bebidas'), 5.00, true, true, CURRENT_DATE),
('Inca Kola 500ml', (SELECT id FROM public.categories WHERE name = 'Bebidas'), 5.00, true, true, CURRENT_DATE),
('Agua San Luis 625ml', (SELECT id FROM public.categories WHERE name = 'Bebidas'), 3.00, true, true, CURRENT_DATE),
('Brownie', (SELECT id FROM public.categories WHERE name = 'Postres'), 8.00, true, true, CURRENT_DATE),
('Cheesecake', (SELECT id FROM public.categories WHERE name = 'Postres'), 12.00, true, true, CURRENT_DATE);

-- Actualizar fechas de vencimiento para productos que vencen
UPDATE public.products SET expiration_date = CURRENT_DATE + INTERVAL '30 days' WHERE expires = true;
