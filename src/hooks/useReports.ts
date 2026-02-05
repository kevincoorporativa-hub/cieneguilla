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
export function useTopProducts(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['reports', 'top-products', startDate, endDate],
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

      // Get order items for those orders (excluding combos)
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id, product_name, quantity, total, order_id')
        .in('order_id', orderIds)
        .not('product_id', 'is', null);

      if (itemsError) throw itemsError;
      if (!items || items.length === 0) return [];

      // Aggregate by product
      const productTotals: Record<string, { name: string; quantity: number; total: number; orders: Set<string> }> = {};
      
      for (const item of items) {
        const productId = item.product_id as string;
        if (!productTotals[productId]) {
          productTotals[productId] = { name: item.product_name, quantity: 0, total: 0, orders: new Set() };
        }
        productTotals[productId].quantity += item.quantity;
        productTotals[productId].total += Number(item.total);
        productTotals[productId].orders.add(item.order_id);
      }

      const result: TopProduct[] = Object.entries(productTotals)
        .map(([productId, data]) => ({
          product_id: productId,
          product_name: data.name,
          total_quantity: data.quantity,
          total_sales: data.total,
          order_count: data.orders.size,
        }))
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, 10);

      return result;
    },
  });
}

// Sales by category
export function useSalesByCategory(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['reports', 'sales-by-category', startDate, endDate],
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

      // Get order items with product info
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id, quantity, total, order_id')
        .in('order_id', orderIds)
        .not('product_id', 'is', null);

      if (itemsError) throw itemsError;
      if (!items || items.length === 0) return [];

      // Get products with categories
      const productIds = [...new Set(items.map(i => i.product_id).filter(Boolean))];
      
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, category_id')
        .in('id', productIds as string[]);

      if (productsError) throw productsError;

      // Get categories
      const categoryIds = [...new Set(products?.map(p => p.category_id).filter(Boolean) || [])];
      
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .in('id', categoryIds as string[]);

      if (categoriesError) throw categoriesError;

      // Aggregate by category
      const categoryTotals: Record<string, { name: string; quantity: number; total: number; orders: Set<string> }> = {};
      
      for (const item of items) {
        const product = products?.find(p => p.id === item.product_id);
        const categoryId = product?.category_id || 'other';
        const category = categories?.find(c => c.id === categoryId);
        
        if (!categoryTotals[categoryId]) {
          categoryTotals[categoryId] = { name: category?.name || 'Sin categoría', quantity: 0, total: 0, orders: new Set() };
        }
        categoryTotals[categoryId].quantity += item.quantity;
        categoryTotals[categoryId].total += Number(item.total);
        categoryTotals[categoryId].orders.add(item.order_id);
      }

      const result: SalesByCategory[] = Object.entries(categoryTotals)
        .map(([categoryId, data]) => ({
          category_id: categoryId,
          category_name: data.name,
          order_count: data.orders.size,
          total_quantity: data.quantity,
          total_sales: data.total,
        }))
        .sort((a, b) => b.total_sales - a.total_sales);

      return result;
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

      // IMPORTANT:
      // created_at is timestamptz (UTC). If we filter by naive strings like
      // "YYYY-MM-DDT00:00:00" PostgREST interprets them as UTC, causing an off-by-one-day
      // for timezones like -05 (Peru). We therefore build *local* start/end boundaries
      // and convert them to ISO (UTC) before filtering.
      if (startDate) {
        const [y, m, d] = startDate.split('-').map(Number);
        const startLocal = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
        query = query.gte('created_at', startLocal.toISOString());
      }
      if (endDate) {
        const [y, m, d] = endDate.split('-').map(Number);
        const endLocalExclusive = new Date(y, (m || 1) - 1, (d || 1) + 1, 0, 0, 0, 0);
        query = query.lt('created_at', endLocalExclusive.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const orders = data || [];
      // Status 'paid' = Entregado (completed delivery)
      const paidOrders = orders.filter(o => o.status === 'paid');
      const totalSales = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);

      return {
        total_orders: orders.length,
        total_sales: totalSales,
        average_ticket: paidOrders.length > 0 ? totalSales / paidOrders.length : 0,
        // 'paid' = Entregado (completed)
        completed_orders: paidOrders.length,
        // 'cancelled' = Cancelado
        cancelled_orders: orders.filter(o => o.status === 'cancelled').length,
        // 'open' = Pendiente, 'preparing' = En preparación, 'ready' = En camino
        pending_orders: orders.filter(o => o.status === 'open' || o.status === 'preparing' || o.status === 'ready').length,
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

      // Same local-boundary approach as Delivery to avoid UTC off-by-one.
      const [y, m, d] = targetDate.split('-').map(Number);
      const startLocal = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
      const endLocalExclusive = new Date(y, (m || 1) - 1, (d || 1) + 1, 0, 0, 0, 0);

      const { data, error } = await supabase
        .from('orders')
        .select('total, created_at')
        .eq('status', 'paid')
        .gte('created_at', startLocal.toISOString())
        .lt('created_at', endLocalExclusive.toISOString());

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

      // IMPORTANT:
      // created_at is timestamptz (UTC). Use local boundaries to avoid off-by-one-day.
      if (startDate) {
        const [y, m, d] = startDate.split('-').map(Number);
        const startLocal = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
        ordersQuery = ordersQuery.gte('created_at', startLocal.toISOString());
      }
      if (endDate) {
        const [y, m, d] = endDate.split('-').map(Number);
        const endLocalExclusive = new Date(y, (m || 1) - 1, (d || 1) + 1, 0, 0, 0, 0);
        ordersQuery = ordersQuery.lt('created_at', endLocalExclusive.toISOString());
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
      let startLocal: Date;
      let endLocalExclusive: Date;

      switch (dateRange) {
        case 'today':
          // From midnight today to midnight tomorrow (local)
          startLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
          endLocalExclusive = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
          break;
        case 'week':
          // Last 7 days from today (local)
          startLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
          endLocalExclusive = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
          break;
        case 'month':
          // From 1st of current month to tomorrow (local)
          startLocal = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
          endLocalExclusive = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
          break;
      }

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total, created_at')
        .eq('status', 'paid')
        .gte('created_at', startLocal.toISOString())
        .lt('created_at', endLocalExclusive.toISOString());

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
