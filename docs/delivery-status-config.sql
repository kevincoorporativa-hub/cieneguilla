 -- =====================================================
 -- PIZZAPOS - CONFIGURACIÓN DE ESTADOS DE DELIVERY
 -- Script para actualizar el flujo de estados de delivery
 -- Copiar y pegar en SQL Editor de Supabase
 -- =====================================================
 
 -- =====================================================
 -- ESTADOS DE DELIVERY:
 -- 'open'      = Pendiente (orden recién creada, esperando preparación)
 -- 'preparing' = En preparación (cocina trabajando en el pedido)
 -- 'ready'     = En camino (repartidor lleva el pedido)
 -- 'paid'      = Entregado (pedido completado exitosamente)
 -- 'cancelled' = Cancelado (orden cancelada)
 -- =====================================================
 
 -- =====================================================
 -- PARTE 1: FUNCIÓN PARA ACTUALIZAR ESTADO DE DELIVERY
 -- =====================================================
 
 -- Función para avanzar estado de delivery con validación
 CREATE OR REPLACE FUNCTION public.advance_delivery_status(
     p_order_id UUID,
     p_new_status TEXT
 )
 RETURNS BOOLEAN
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
 AS $$
 DECLARE
     v_current_status TEXT;
     v_order_type TEXT;
 BEGIN
     -- Get current status and order type
     SELECT status, order_type INTO v_current_status, v_order_type
     FROM public.orders
     WHERE id = p_order_id;
     
     -- Validate order exists and is delivery type
     IF v_order_type IS NULL THEN
         RAISE EXCEPTION 'Order not found';
     END IF;
     
     IF v_order_type != 'delivery' THEN
         RAISE EXCEPTION 'Order is not a delivery order';
     END IF;
     
     -- Validate status transitions
     IF v_current_status = 'open' AND p_new_status NOT IN ('preparing', 'cancelled') THEN
         RAISE EXCEPTION 'From open status, can only move to preparing or cancelled';
     END IF;
     
     IF v_current_status = 'preparing' AND p_new_status NOT IN ('ready', 'cancelled') THEN
         RAISE EXCEPTION 'From preparing status, can only move to ready (en camino) or cancelled';
     END IF;
     
     IF v_current_status = 'ready' AND p_new_status NOT IN ('paid', 'cancelled') THEN
         RAISE EXCEPTION 'From ready status, can only move to paid (entregado) or cancelled';
     END IF;
     
     IF v_current_status IN ('paid', 'cancelled') THEN
         RAISE EXCEPTION 'Cannot change status of completed or cancelled orders';
     END IF;
     
     -- Update the status
     UPDATE public.orders
     SET status = p_new_status,
         updated_at = now()
     WHERE id = p_order_id;
     
     RETURN TRUE;
 END;
 $$;
 
 -- =====================================================
 -- PARTE 2: TRIGGER PARA ACTUALIZAR TIMESTAMPS EN DELIVERY
 -- =====================================================
 
 -- Función para actualizar timestamps de delivery_assignments automáticamente
 CREATE OR REPLACE FUNCTION public.update_delivery_timestamps()
 RETURNS TRIGGER
 LANGUAGE plpgsql
 SECURITY DEFINER
 AS $$
 BEGIN
     -- Cuando cambia a 'ready' (en camino), actualizar picked_up_at
     IF NEW.status = 'ready' AND OLD.status = 'preparing' THEN
         UPDATE public.delivery_assignments
         SET picked_up_at = now()
         WHERE order_id = NEW.id
           AND picked_up_at IS NULL;
     END IF;
     
     -- Cuando cambia a 'paid' (entregado), actualizar delivered_at
     IF NEW.status = 'paid' AND OLD.status = 'ready' THEN
         UPDATE public.delivery_assignments
         SET delivered_at = now()
         WHERE order_id = NEW.id
           AND delivered_at IS NULL;
     END IF;
     
     RETURN NEW;
 END;
 $$;
 
 -- Crear trigger para actualizar timestamps
 DROP TRIGGER IF EXISTS trg_update_delivery_timestamps ON public.orders;
 CREATE TRIGGER trg_update_delivery_timestamps
 AFTER UPDATE OF status ON public.orders
 FOR EACH ROW
 WHEN (NEW.order_type = 'delivery')
 EXECUTE FUNCTION public.update_delivery_timestamps();
 
 -- =====================================================
 -- PARTE 3: VISTA MEJORADA DE DELIVERY ORDERS
 -- =====================================================
 
 -- Vista para obtener el estado actual del delivery con tiempos
 CREATE OR REPLACE VIEW public.v_delivery_orders_detail AS
 SELECT 
     o.id,
     o.order_number,
     o.status,
     o.total,
     o.notes as order_notes,
     o.created_at,
     o.updated_at,
     -- Cliente
     c.id as customer_id,
     c.name as customer_name,
     c.phone as customer_phone,
     -- Dirección
     ca.id as address_id,
     ca.address,
     ca.reference as address_reference,
     ca.label as address_label,
     -- Asignación de delivery
     da.id as assignment_id,
     da.driver_user_id,
     da.assigned_at,
     da.picked_up_at,
     da.delivered_at,
     da.notes as delivery_notes,
     -- Repartidor
     e.first_name as driver_first_name,
     e.last_name as driver_last_name,
     e.phone as driver_phone,
     -- Tiempos calculados
     CASE 
         WHEN da.picked_up_at IS NOT NULL AND o.created_at IS NOT NULL 
         THEN EXTRACT(EPOCH FROM (da.picked_up_at - o.created_at))/60
         ELSE NULL 
     END as minutes_to_pickup,
     CASE 
         WHEN da.delivered_at IS NOT NULL AND da.picked_up_at IS NOT NULL 
         THEN EXTRACT(EPOCH FROM (da.delivered_at - da.picked_up_at))/60
         ELSE NULL 
     END as minutes_in_transit,
     CASE 
         WHEN da.delivered_at IS NOT NULL AND o.created_at IS NOT NULL 
         THEN EXTRACT(EPOCH FROM (da.delivered_at - o.created_at))/60
         ELSE NULL 
     END as total_minutes
 FROM public.orders o
 LEFT JOIN public.customers c ON c.id = o.customer_id
 LEFT JOIN public.customer_addresses ca ON ca.id = o.customer_address_id
 LEFT JOIN public.delivery_assignments da ON da.order_id = o.id
 LEFT JOIN public.employees e ON e.user_id = da.driver_user_id
 WHERE o.order_type = 'delivery'
 ORDER BY o.created_at DESC;
 
 -- =====================================================
 -- PARTE 4: ÍNDICES ADICIONALES PARA PERFORMANCE
 -- =====================================================
 
 -- Índice para filtrar por fecha de creación eficientemente
 CREATE INDEX IF NOT EXISTS idx_orders_created_at_delivery 
 ON public.orders(created_at) 
 WHERE order_type = 'delivery';
 
 -- Índice compuesto para filtros comunes de delivery
 CREATE INDEX IF NOT EXISTS idx_orders_delivery_status_date 
 ON public.orders(order_type, status, created_at DESC)
 WHERE order_type = 'delivery';
 
 -- =====================================================
 -- VERIFICACIÓN
 -- =====================================================
 -- Ejecutar después para confirmar:
 -- SELECT 
 --     (SELECT COUNT(*) FROM public.orders WHERE order_type = 'delivery') as total_deliveries,
 --     (SELECT COUNT(*) FROM public.orders WHERE order_type = 'delivery' AND status = 'open') as pending,
 --     (SELECT COUNT(*) FROM public.orders WHERE order_type = 'delivery' AND status = 'preparing') as preparing,
 --     (SELECT COUNT(*) FROM public.orders WHERE order_type = 'delivery' AND status = 'ready') as in_transit,
 --     (SELECT COUNT(*) FROM public.orders WHERE order_type = 'delivery' AND status = 'paid') as delivered;