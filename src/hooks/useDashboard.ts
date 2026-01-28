import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  averageTicket: number;
  deliveryCount: number;
  yesterdaySales: number;
  yesterdayOrders: number;
}

export interface WeeklySales {
  day: string;
  sales: number;
}

export interface CategorySales {
  name: string;
  value: number;
  color: string;
}

export interface TopProduct {
  name: string;
  quantity: number;
  total: number;
}

export interface LowStockItem {
  name: string;
  stock: number;
  min_stock: number;
}

export interface LowStockProduct {
  name: string;
  stock: number;
  min_stock: number;
}

// Dashboard main stats
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();

      // Today's orders
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('total, order_type')
        .eq('status', 'paid')
        .gte('created_at', todayStart);

      // Yesterday's orders
      const { data: yesterdayOrders } = await supabase
        .from('orders')
        .select('total')
        .eq('status', 'paid')
        .gte('created_at', yesterdayStart)
        .lt('created_at', todayStart);

      const todaySales = todayOrders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
      const todayOrderCount = todayOrders?.length || 0;
      const deliveryCount = todayOrders?.filter(o => o.order_type === 'delivery').length || 0;
      const averageTicket = todayOrderCount > 0 ? todaySales / todayOrderCount : 0;

      const yesterdaySales = yesterdayOrders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
      const yesterdayOrderCount = yesterdayOrders?.length || 0;

      return {
        todaySales,
        todayOrders: todayOrderCount,
        averageTicket,
        deliveryCount,
        yesterdaySales,
        yesterdayOrders: yesterdayOrderCount,
      } as DashboardStats;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Weekly sales chart data
export function useWeeklySales() {
  return useQuery({
    queryKey: ['dashboard', 'weekly-sales'],
    queryFn: async () => {
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const now = new Date();
      const weekData: WeeklySales[] = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();

        const { data } = await supabase
          .from('orders')
          .select('total')
          .eq('status', 'paid')
          .gte('created_at', dayStart)
          .lt('created_at', dayEnd);

        const totalSales = data?.reduce((sum, o) => sum + Number(o.total), 0) || 0;

        weekData.push({
          day: days[date.getDay()],
          sales: totalSales,
        });
      }

      return weekData;
    },
  });
}

// Sales by category
export function useCategorySales() {
  return useQuery({
    queryKey: ['dashboard', 'category-sales'],
    queryFn: async () => {
      const now = new Date();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();

      // Get order items from the last week
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('status', 'paid')
        .gte('created_at', weekStart);

      if (!orders || orders.length === 0) {
        return [
          { name: 'Sin datos', value: 100, color: 'hsl(220, 15%, 70%)' }
        ];
      }

      const orderIds = orders.map(o => o.id);

      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, total')
        .in('order_id', orderIds);

      if (!orderItems || orderItems.length === 0) {
        return [
          { name: 'Sin datos', value: 100, color: 'hsl(220, 15%, 70%)' }
        ];
      }

      // Get product categories
      const productIds = [...new Set(orderItems.map(i => i.product_id).filter(Boolean))];
      
      const { data: products } = productIds.length > 0
        ? await supabase
            .from('products')
            .select('id, category_id')
            .in('id', productIds as string[])
        : { data: [] };

      const { data: categories } = await supabase
        .from('categories')
        .select('id, name, color');

      // Aggregate by category
      const categoryTotals: Record<string, number> = {};
      
      for (const item of orderItems) {
        const product = products?.find(p => p.id === item.product_id);
        const categoryId = product?.category_id || 'other';
        categoryTotals[categoryId] = (categoryTotals[categoryId] || 0) + Number(item.total);
      }

      const totalSales = Object.values(categoryTotals).reduce((sum, v) => sum + v, 0);

      const result: CategorySales[] = Object.entries(categoryTotals).map(([catId, total]) => {
        const category = categories?.find(c => c.id === catId);
        return {
          name: category?.name || 'Otros',
          value: Math.round((total / totalSales) * 100),
          color: category?.color || 'hsl(220, 15%, 70%)',
        };
      });

      return result.sort((a, b) => b.value - a.value).slice(0, 4);
    },
  });
}

// Top selling products
export function useTopProducts() {
  return useQuery({
    queryKey: ['dashboard', 'top-products'],
    queryFn: async () => {
      const now = new Date();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();

      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('status', 'paid')
        .gte('created_at', weekStart);

      if (!orders || orders.length === 0) return [];

      const orderIds = orders.map(o => o.id);

      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_name, quantity, total')
        .in('order_id', orderIds);

      if (!orderItems) return [];

      // Aggregate by product name
      const productTotals: Record<string, { quantity: number; total: number }> = {};
      
      for (const item of orderItems) {
        const name = item.product_name;
        if (!productTotals[name]) {
          productTotals[name] = { quantity: 0, total: 0 };
        }
        productTotals[name].quantity += item.quantity;
        productTotals[name].total += Number(item.total);
      }

      const result: TopProduct[] = Object.entries(productTotals)
        .map(([name, data]) => ({
          name,
          quantity: data.quantity,
          total: data.total,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      return result;
    },
  });
}

// Low stock items (Ingredientes/Insumos)
export function useLowStockItems() {
  return useQuery({
    queryKey: ['dashboard', 'low-stock'],
    queryFn: async () => {
      const { data: ingredients } = await supabase
        .from('ingredients')
        .select('id, name, min_stock')
        .eq('active', true);

      if (!ingredients) return [];

      const { data: stocks } = await supabase
        .from('ingredient_stock')
        .select('ingredient_id, quantity');

      const lowStockItems: LowStockItem[] = [];

      for (const ing of ingredients) {
        const stock = stocks?.find(s => s.ingredient_id === ing.id);
        const currentStock = Number(stock?.quantity || 0);
        const minStock = Number(ing.min_stock);

        if (currentStock <= minStock) {
          lowStockItems.push({
            name: ing.name,
            stock: currentStock,
            min_stock: minStock,
          });
        }
      }

      return lowStockItems.sort((a, b) => a.stock - b.stock).slice(0, 5);
    },
  });
}

// Low stock products (Productos)
export function useLowStockProducts() {
  return useQuery({
    queryKey: ['dashboard', 'low-stock-products'],
    queryFn: async () => {
      const { data: products } = await supabase
        .from('products')
        .select('id, name, min_stock')
        .eq('active', true)
        .eq('track_stock', true);

      if (!products) return [];

      const { data: stocks } = await supabase
        .from('product_stock')
        .select('product_id, quantity');

      const lowStockProducts: LowStockProduct[] = [];

      for (const prod of products) {
        const stock = stocks?.find(s => s.product_id === prod.id);
        const currentStock = Number(stock?.quantity || 0);
        const minStock = Number(prod.min_stock || 5);

        if (currentStock <= minStock) {
          lowStockProducts.push({
            name: prod.name,
            stock: currentStock,
            min_stock: minStock,
          });
        }
      }

      return lowStockProducts.sort((a, b) => a.stock - b.stock).slice(0, 5);
    },
  });
}
