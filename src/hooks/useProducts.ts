import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  sort_order: number;
  active: boolean;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  base_price: number;
  image_url: string | null;
  active: boolean;
  track_stock: boolean;
  min_stock?: number | null;
  expires?: boolean | null;
  expiration_date?: string | null;
  entry_date?: string | null;
  created_at: string;
  updated_at?: string;
  category?: Category;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price: number;
  active: boolean;
}

// Fetch categories (including inactive for admin)
export function useCategories(includeInactive = false) {
  return useQuery({
    queryKey: ['categories', includeInactive],
    queryFn: async () => {
      let query = supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!includeInactive) {
        query = query.eq('active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Category[];
    },
  });
}

// Fetch all products with categories (including inactive for admin)
export function useProducts(includeInactive = false) {
  return useQuery({
    queryKey: ['products', includeInactive],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .order('name');

      if (!includeInactive) {
        query = query.eq('active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (Product & { category: Category | null })[];
    },
  });
}

// Fetch products by category
export function useProductsByCategory(categoryId: string | null) {
  return useQuery({
    queryKey: ['products', 'category', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('active', true);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query.order('name');
      if (error) throw error;
      return data as (Product & { category: Category | null })[];
    },
    enabled: true,
  });
}

// Fetch product variants
export function useProductVariants(productId: string) {
  return useQuery({
    queryKey: ['product-variants', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .eq('active', true);

      if (error) throw error;
      return data as ProductVariant[];
    },
    enabled: !!productId,
  });
}

// Create product
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: {
      name: string;
      category_id: string | null;
      description?: string | null;
      base_price: number;
      image_url?: string | null;
      active?: boolean;
      track_stock?: boolean;
      min_stock?: number | null;
      expires?: boolean | null;
      expiration_date?: string | null;
      entry_date?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: product.name,
          category_id: product.category_id,
          description: product.description || null,
          base_price: product.base_price,
          image_url: product.image_url || null,
          active: product.active ?? true,
          track_stock: product.track_stock ?? false,
          min_stock: product.min_stock ?? 5,
          expires: product.expires ?? false,
          expiration_date: product.expiration_date ?? null,
          entry_date: product.entry_date ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Update product
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      name?: string;
      category_id?: string | null;
      description?: string | null;
      base_price?: number;
      image_url?: string | null;
      active?: boolean;
      track_stock?: boolean;
      min_stock?: number | null;
      expires?: boolean | null;
      expiration_date?: string | null;
      entry_date?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Delete product (soft delete by setting active = false)
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Create category
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: {
      name: string;
      description?: string | null;
      icon?: string | null;
      color?: string;
      sort_order?: number;
      active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: category.name,
          description: category.description || null,
          icon: category.icon || null,
          color: category.color || '#3b82f6',
          sort_order: category.sort_order || 0,
          active: category.active ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// Update category
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      name?: string;
      description?: string | null;
      icon?: string | null;
      color?: string;
      sort_order?: number;
      active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// Delete category (soft delete)
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
