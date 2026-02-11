import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TicketItem {
  id: string;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Ticket {
  id: string;
  order_number: number;
  created_at: string;
  customer_name: string | null;
  customer_dni: string | null;
  total: number;
  payment_method: string | null;
  user_email: string | null;
  order_type: 'local' | 'takeaway' | 'delivery';
  status: string;
  items: TicketItem[];
}

// Fetch tickets (orders with status 'paid')
export function useTickets(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['tickets', startDate, endDate],
    queryFn: async () => {
      // Get paid orders directly
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          created_at,
          total,
          order_type,
          status,
          customer_id,
          user_id,
          store_id
        `)
        .eq('status', 'paid')
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: orders, error: ordersError } = await query.limit(200);

      if (ordersError) throw ordersError;
      if (!orders || orders.length === 0) return [];

      // Get order IDs for additional queries
      const orderIds = orders.map(o => o.id);
      const customerIds = orders.map(o => o.customer_id).filter(Boolean);

      // Get payments for these orders
      const { data: orderPayments } = await supabase
        .from('payments')
        .select('order_id, method')
        .in('order_id', orderIds);

      // Get customers
      const { data: customers } = customerIds.length > 0
        ? await supabase
            .from('customers')
            .select('id, name, dni')
            .in('id', customerIds)
        : { data: [] };

      // Get order items
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('id, order_id, product_name, variant_name, quantity, unit_price, total')
        .in('order_id', orderIds);

      // Get employees for user emails
      const userIds = orders.map(o => o.user_id).filter(Boolean);
      const { data: employees } = userIds.length > 0
        ? await supabase
            .from('employees')
            .select('user_id, first_name, last_name')
            .in('user_id', userIds)
        : { data: [] };

      // Build tickets
      const tickets: Ticket[] = orders.map(order => {
        const payment = orderPayments?.find(p => p.order_id === order.id);
        const customer = customers?.find(c => c.id === order.customer_id);
        const employee = employees?.find(e => e.user_id === order.user_id);
        const items = orderItems?.filter(i => i.order_id === order.id) || [];

        return {
          id: order.id,
          order_number: order.order_number,
          created_at: order.created_at,
          customer_name: customer?.name || null,
          customer_dni: customer?.dni || null,
          total: Number(order.total),
          payment_method: payment?.method || null,
          user_email: employee ? `${employee.first_name} ${employee.last_name}` : null,
          order_type: order.order_type as Ticket['order_type'],
          status: order.status,
          items: items.map(i => ({
            id: i.id,
            product_name: i.product_name,
            variant_name: i.variant_name,
            quantity: i.quantity,
            unit_price: Number(i.unit_price),
            total: Number(i.total),
          })),
        };
      });

      return tickets;
    },
  });
}

// Get ticket summary for period
export function useTicketSummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['ticket-summary', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('total')
        .eq('status', 'paid');

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const totalSales = data?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
      const ticketCount = data?.length || 0;

      return { totalSales, ticketCount };
    },
  });
}
