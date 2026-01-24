import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
