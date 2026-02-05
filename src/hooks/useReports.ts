import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TopCombo {
  combo_id: string;
  combo_name: string;
  total_quantity: number;
  total_sales: number;
  order_count: number;
}

export interface DeliverySummary {
  total_orders: number;
  total_sales: number;
  average_ticket: number;
  completed_orders: number;
  cancelled_orders: number;
  pending_orders: number;
}

export interface HourlySales {
  hour: number;
  total_orders: number;
  total_sales: number;
}

export interface SalesByDay {
  sale_date: string;
  total_orders: number;
  total_sales: number;
  average_ticket: number;
  local_orders: number;
  takeaway_orders: number;
  delivery_orders: number;
}

export interface SalesByPaymentMethod {
  method: string;
  payment_count: number;
  total_amount: number;
  payment_date: string;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_sales: number;
  order_count: number;
}

export interface SalesByCategory {
  category_id: string;
  category_name: string;
  order_count: number;
  total_quantity: number;
  total_sales: number;
}

export interface CurrentStock {
  ingredient_id: string;
  ingredient_name: string;
  unit: string;
  min_stock: number;
  current_quantity: number;
  stock_status: 'ok' | 'low_stock' | 'out_of_stock';
  store_id: string;
  store_name: string;
}

// Sales by day
export function useSalesByDay(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['reports', 'sales-by-day', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('v_sales_by_day')
        .select('*')
        .order('sale_date', { ascending: false });

      if (startDate) {
        query = query.gte('sale_date', startDate);
      }
      if (endDate) {
        query = query.lte('sale_date', endDate);
      }

      const { data, error } = await query.limit(30);
      if (error) throw error;
      return data as SalesByDay[];
    },
  });
}

// Sales by payment method
export function useSalesByPaymentMethod(date?: string) {
  return useQuery({
    queryKey: ['reports', 'sales-by-payment-method', date],
    queryFn: async () => {
      let query = supabase
        .from('v_sales_by_payment_method')
        .select('*')
        .order('payment_date', { ascending: false });

      if (date) {
        query = query.eq('payment_date', date);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data as SalesByPaymentMethod[];
    },
  });
}

// Top products
export function useTopProducts() {
  return useQuery({
    queryKey: ['reports', 'top-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_top_products')
        .select('*');

      if (error) throw error;
      return data as TopProduct[];
    },
  });
}

// Sales by category
export function useSalesByCategory() {
  return useQuery({
    queryKey: ['reports', 'sales-by-category'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_sales_by_category')
        .select('*');

      if (error) throw error;
      return data as SalesByCategory[];
    },
  });
}

// Current stock with alerts
export function useCurrentStock() {
  return useQuery({
    queryKey: ['reports', 'current-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_current_stock')
        .select('*');

      if (error) throw error;
      return data as CurrentStock[];
    },
  });
}

// Top selling combos
export function useTopCombos(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['reports', 'top-combos', startDate, endDate],
    queryFn: async () => {
      // Get paid orders in date range
      let ordersQuery = supabase
        .from('orders')
        .select('id')
        .eq('status', 'paid');

      if (startDate) {
        ordersQuery = ordersQuery.gte('created_at', `${startDate}T00:00:00`);
      }
      if (endDate) {
        ordersQuery = ordersQuery.lte('created_at', `${endDate}T23:59:59`);
      }

      const { data: orders, error: ordersError } = await ordersQuery;
      if (ordersError) throw ordersError;
      if (!orders || orders.length === 0) return [];

      const orderIds = orders.map(o => o.id);

      // Get order items with combo_id
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('combo_id, product_name, quantity, total')
        .in('order_id', orderIds)
        .not('combo_id', 'is', null);

      if (itemsError) throw itemsError;
      if (!items || items.length === 0) return [];

      // Aggregate by combo
      const comboTotals: Record<string, { name: string; quantity: number; total: number; orders: Set<string> }> = {};
      
      for (const item of items) {
        const comboId = item.combo_id as string;
        if (!comboTotals[comboId]) {
          comboTotals[comboId] = { name: item.product_name, quantity: 0, total: 0, orders: new Set() };
        }
        comboTotals[comboId].quantity += item.quantity;
        comboTotals[comboId].total += Number(item.total);
      }

      const result: TopCombo[] = Object.entries(comboTotals)
        .map(([comboId, data]) => ({
          combo_id: comboId,
          combo_name: data.name,
          total_quantity: data.quantity,
          total_sales: data.total,
          order_count: data.orders.size,
        }))
        .sort((a, b) => b.total_sales - a.total_sales)
        .slice(0, 10);

      return result;
    },
  });
}

// Delivery summary
export function useDeliverySummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['reports', 'delivery-summary', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('total, status')
        .eq('order_type', 'delivery');

      if (startDate) {
        query = query.gte('created_at', `${startDate}T00:00:00`);
      }
      if (endDate) {
        query = query.lte('created_at', `${endDate}T23:59:59`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const orders = data || [];
      const paidOrders = orders.filter(o => o.status === 'paid' || o.status === 'delivered');
      const totalSales = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);

      return {
        total_orders: orders.length,
        total_sales: totalSales,
        average_ticket: paidOrders.length > 0 ? totalSales / paidOrders.length : 0,
        completed_orders: orders.filter(o => o.status === 'delivered' || o.status === 'paid').length,
        cancelled_orders: orders.filter(o => o.status === 'cancelled').length,
        pending_orders: orders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'in_transit').length,
      } as DeliverySummary;
    },
  });
}

// Sales by hour
export function useHourlySales(date?: string) {
  return useQuery({
    queryKey: ['reports', 'hourly-sales', date],
    queryFn: async () => {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('orders')
        .select('total, created_at')
        .eq('status', 'paid')
        .gte('created_at', `${targetDate}T00:00:00`)
        .lte('created_at', `${targetDate}T23:59:59`);

      if (error) throw error;

      // Group by hour
      const hourlyData: Record<number, { orders: number; sales: number }> = {};
      
      for (let h = 0; h < 24; h++) {
        hourlyData[h] = { orders: 0, sales: 0 };
      }

      for (const order of data || []) {
        const hour = new Date(order.created_at).getHours();
        hourlyData[hour].orders += 1;
        hourlyData[hour].sales += Number(order.total);
      }

      return Object.entries(hourlyData)
        .map(([hour, data]) => ({
          hour: parseInt(hour),
          total_orders: data.orders,
          total_sales: data.sales,
        }))
        .filter(h => h.hour >= 6 && h.hour <= 23); // Only business hours
    },
  });
}

// Payment methods with date range
export function usePaymentMethodsSummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['reports', 'payment-methods-summary', startDate, endDate],
    queryFn: async () => {
      let ordersQuery = supabase
        .from('orders')
        .select('id')
        .eq('status', 'paid');

      if (startDate) {
        ordersQuery = ordersQuery.gte('created_at', `${startDate}T00:00:00`);
      }
      if (endDate) {
        ordersQuery = ordersQuery.lte('created_at', `${endDate}T23:59:59`);
      }

      const { data: orders, error: ordersError } = await ordersQuery;
      if (ordersError) throw ordersError;
      if (!orders || orders.length === 0) return [];

      const orderIds = orders.map(o => o.id);

      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('method, amount')
        .in('order_id', orderIds);

      if (paymentsError) throw paymentsError;

      // Aggregate by method
      const methodTotals: Record<string, { count: number; total: number }> = {};
      
      for (const payment of payments || []) {
        const method = payment.method || 'other';
        if (!methodTotals[method]) {
          methodTotals[method] = { count: 0, total: 0 };
        }
        methodTotals[method].count += 1;
        methodTotals[method].total += Number(payment.amount);
      }

      return Object.entries(methodTotals)
        .map(([method, data]) => ({
          method,
          payment_count: data.count,
          total_amount: data.total,
        }))
        .sort((a, b) => b.total_amount - a.total_amount);
    },
  });
}

// Summary stats
export function useSalesSummary(dateRange: 'today' | 'week' | 'month') {
  return useQuery({
    queryKey: ['reports', 'summary', dateRange],
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total, created_at')
        .eq('status', 'paid')
        .gte('created_at', startDate.toISOString());

      if (ordersError) throw ordersError;

      const totalSales = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
      const totalOrders = orders?.length || 0;
      const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

      return {
        totalSales,
        totalOrders,
        averageTicket,
      };
    },
  });
}
