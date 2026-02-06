import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type OrderType = 'local' | 'takeaway' | 'delivery';
export type OrderStatus = 'open' | 'preparing' | 'ready' | 'paid' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'yape' | 'plin' | 'transfer' | 'pos';

export interface CreateOrderData {
  store_id?: string | null;
  terminal_id: string | null;
  table_id?: string | null;
  customer_id?: string | null;
  cash_session_id: string | null;
  user_id: string | null;
  order_type: OrderType;
  status: OrderStatus;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  notes?: string | null;
}

export interface CreateOrderItem {
  product_id: string | null;
  combo_id?: string | null;
  product_variant_id?: string | null;
  product_name: string;
  variant_name?: string | null;
  quantity: number;
  unit_price: number;
  modifiers_total?: number;
  total: number;
  notes?: string | null;
}

export interface Order {
  id: string;
  order_number: number;
  store_id: string | null;
  terminal_id: string | null;
  table_id: string | null;
  customer_id: string | null;
  cash_session_id: string | null;
  user_id: string | null;
  order_type: OrderType;
  status: OrderStatus;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  modifiers_total: number;
  total: number;
  notes: string | null;
}

export interface Payment {
  id: string;
  order_id: string;
  cash_session_id: string | null;
  user_id: string | null;
  method: PaymentMethod;
  amount: number;
  reference: string | null;
  created_at: string;
}

// Fetch orders
export function useOrders(status?: OrderStatus) {
  return useQuery({
    queryKey: ['orders', status],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Order[];
    },
  });
}

// Fetch order with items
export function useOrderWithItems(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      return { ...order, items } as Order & { items: OrderItem[] };
    },
    enabled: !!orderId,
  });
}

// Create order
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      order,
      items,
    }: {
      order: CreateOrderData;
      items: CreateOrderItem[];
    }) => {
      // Create order
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert(order)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items with defaults
      const orderItems = items.map((item) => ({
        order_id: newOrder.id,
        product_id: item.product_id,
        combo_id: item.combo_id || null,
        product_variant_id: item.product_variant_id || null,
        product_name: item.product_name,
        variant_name: item.variant_name || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        modifiers_total: item.modifiers_total || 0,
        total: item.total,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return newOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// Update order status
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// Create payment and update order status to 'paid'
export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: Omit<Payment, 'id' | 'created_at'> & { orderType?: string }) => {
      // Create the payment
      const { data, error } = await supabase
        .from('payments')
        .insert({
          order_id: payment.order_id,
          cash_session_id: payment.cash_session_id,
          user_id: payment.user_id,
          method: payment.method,
          amount: payment.amount,
          reference: payment.reference,
        })
        .select()
        .single();

      if (error) throw error;

      // For delivery orders, keep status as 'open' (Pendiente) to enter delivery workflow
      // For other order types, mark as 'paid' immediately
      if (payment.orderType !== 'delivery') {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: 'paid', updated_at: new Date().toISOString() })
          .eq('id', payment.order_id);

        if (updateError) {
          console.error('Error updating order status:', updateError);
        }
      } else {
        // For delivery orders, ensure there's a delivery_assignment record
        // and force the order status to remain 'open' (Pendiente).
        // NOTE: Some DB setups auto-mark orders as 'paid' when a payment is inserted.
        // For delivery we must keep the operational status as 'open' until delivered.
        const { data: existingAssignment, error: existingAssignmentError } = await supabase
          .from('delivery_assignments')
          .select('id')
          .eq('order_id', payment.order_id)
          .maybeSingle();

        if (existingAssignmentError) {
          console.error('Error checking delivery assignment:', existingAssignmentError);
        }

        if (!existingAssignment) {
          const { error: assignmentError } = await supabase
            .from('delivery_assignments')
            .insert({ order_id: payment.order_id });

          if (assignmentError) {
            console.error('Error creating delivery assignment:', assignmentError);
          }
        }

        const { error: keepOpenError } = await supabase
          .from('orders')
          .update({ status: 'open', updated_at: new Date().toISOString() })
          .eq('id', payment.order_id);

        if (keepOpenError) {
          console.error('Error forcing delivery order to open:', keepOpenError);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['cash-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['cash-session-summary'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      // Invalidar stock para que el POS se actualice inmediatamente
      queryClient.invalidateQueries({ queryKey: ['product-stock'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      // Invalidar delivery orders para que aparezcan en la página de delivery
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
    },
  });
}

// Fetch payments by session
export function usePaymentsBySession(sessionId: string | null) {
  return useQuery({
    queryKey: ['payments', 'session', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          order:orders(order_number, total)
        `)
        .eq('cash_session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });
}
