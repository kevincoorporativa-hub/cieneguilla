import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type DeliveryStatus = 'open' | 'preparing' | 'ready' | 'paid' | 'cancelled';

export interface DeliveryOrder {
  id: string;
  order_number: number;
  customer_id: string | null;
  customer_address_id: string | null;
  status: DeliveryStatus;
  total: number;
  notes: string | null;
  created_at: string;
  customer?: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  address?: {
    id: string;
    address: string;
    reference: string | null;
    label: string;
  } | null;
  delivery_assignment?: {
    id: string;
    driver_user_id: string | null;
    assigned_at: string;
    picked_up_at: string | null;
    delivered_at: string | null;
    driver?: {
      first_name: string;
      last_name: string;
    } | null;
  } | null;
}

export interface DeliveryDriver {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  addresses?: CustomerAddress[];
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  label: string;
  address: string;
  reference: string | null;
  is_default: boolean;
}

// Fetch delivery orders with optional date filter
export function useDeliveryOrders(status?: DeliveryStatus | 'all', dateFilter?: string) {
  return useQuery({
    queryKey: ['delivery-orders', status, dateFilter],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_id,
          customer_address_id,
          status,
          total,
          notes,
          created_at
        `)
        .eq('order_type', 'delivery')
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      // Date filter
      if (dateFilter) {
        // IMPORTANT:
        // created_at is stored in UTC (timestamptz). If we filter by naive strings like
        // "YYYY-MM-DDT00:00:00" PostgREST will interpret them as UTC, causing an off-by-one-day
        // for timezones like -05 (e.g., Peru). We therefore build *local* start/end boundaries
        // and convert them to ISO (UTC) before filtering.
        const [y, m, d] = dateFilter.split('-').map(Number);
        const startLocal = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
        const endLocal = new Date(y, (m || 1) - 1, (d || 1) + 1, 0, 0, 0, 0);
        query = query
          .gte('created_at', startLocal.toISOString())
          .lt('created_at', endLocal.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch customers
      const customerIds = data.filter(o => o.customer_id).map(o => o.customer_id);
      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, phone')
        .in('id', customerIds);

      // Fetch addresses
      const addressIds = data.filter(o => o.customer_address_id).map(o => o.customer_address_id);
      const { data: addresses } = await supabase
        .from('customer_addresses')
        .select('id, address, reference, label')
        .in('id', addressIds);

      // Fetch delivery assignments
      const orderIds = data.map(o => o.id);
      const { data: assignments } = await supabase
        .from('delivery_assignments')
        .select(`
          id,
          order_id,
          driver_user_id,
          assigned_at,
          picked_up_at,
          delivered_at
        `)
        .in('order_id', orderIds);

      // Get driver info for assignments
      const driverIds = assignments?.filter(a => a.driver_user_id).map(a => a.driver_user_id) || [];
      const { data: drivers } = driverIds.length > 0 
        ? await supabase
            .from('employees')
            .select('user_id, first_name, last_name')
            .in('user_id', driverIds)
        : { data: [] };

      // Merge data
      return data.map(order => {
        const assignment = assignments?.find(a => a.order_id === order.id);
        const driver = assignment ? drivers?.find(d => d.user_id === assignment.driver_user_id) : null;
        
        return {
          id: order.id,
          order_number: order.order_number,
          customer_id: order.customer_id,
          customer_address_id: order.customer_address_id,
          status: order.status as DeliveryStatus,
          total: order.total,
          notes: order.notes,
          created_at: order.created_at,
          customer: customers?.find(c => c.id === order.customer_id) || null,
          address: addresses?.find(a => a.id === order.customer_address_id) || null,
          delivery_assignment: assignment 
            ? {
                id: assignment.id,
                driver_user_id: assignment.driver_user_id,
                assigned_at: assignment.assigned_at,
                picked_up_at: assignment.picked_up_at,
                delivered_at: assignment.delivered_at,
                driver: driver ? { first_name: driver.first_name, last_name: driver.last_name } : null
              }
            : null
        } as DeliveryOrder;
      });
    },
  });
}

// Fetch available delivery drivers
export function useDeliveryDrivers() {
  return useQuery({
    queryKey: ['delivery-drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          user_id,
          first_name,
          last_name,
          phone,
          active
        `)
        .eq('active', true);

      if (error) throw error;

      // Filter to only drivers (those with delivery role)
      const { data: driverRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'delivery');

      const driverUserIds = driverRoles?.map(r => r.user_id) || [];
      return data.filter(e => driverUserIds.includes(e.user_id)) as DeliveryDriver[];
    },
  });
}

// Fetch customers
export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          addresses:customer_addresses(*)
        `)
        .order('name');

      if (error) throw error;
      return data as Customer[];
    },
  });
}

// Create customer
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customer: Omit<Customer, 'id' | 'addresses'>) => {
      const { data, error } = await supabase
        .from('customers')
        .insert(customer)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// Create customer address
export function useCreateCustomerAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (address: Omit<CustomerAddress, 'id'>) => {
      const { data, error } = await supabase
        .from('customer_addresses')
        .insert(address)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// Assign driver to delivery
export function useAssignDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, driverUserId }: { orderId: string; driverUserId: string }) => {
      // Check if assignment exists
      const { data: existing } = await supabase
        .from('delivery_assignments')
        .select('id')
        .eq('order_id', orderId)
        .maybeSingle();

      if (existing) {
        // Update existing assignment
        const { data, error } = await supabase
          .from('delivery_assignments')
          .update({
            driver_user_id: driverUserId,
            assigned_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new assignment
        const { data, error } = await supabase
          .from('delivery_assignments')
          .insert({
            order_id: orderId,
            driver_user_id: driverUserId,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
    },
  });
}

// Mark delivery as picked up
export function useMarkPickedUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      // Update assignment
      const { error: assignmentError } = await supabase
        .from('delivery_assignments')
        .update({ picked_up_at: new Date().toISOString() })
        .eq('order_id', orderId);

      if (assignmentError) throw assignmentError;

      // Update order status to ready
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'ready' })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// Mark delivery as delivered
export function useMarkDelivered() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      // Update assignment
      const { error: assignmentError } = await supabase
        .from('delivery_assignments')
        .update({ delivered_at: new Date().toISOString() })
        .eq('order_id', orderId);

      if (assignmentError) throw assignmentError;

      // Update order status to paid
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// Update order status
export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: DeliveryStatus }) => {
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
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// Create delivery order
export function useCreateDeliveryOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      customerId,
      customerAddressId,
      items,
      notes,
      storeId,
    }: {
      customerId: string;
      customerAddressId: string;
      items: { productId?: string; comboId?: string; quantity: number; unitPrice: number; notes?: string }[];
      notes?: string;
      storeId: string;
    }) => {
      // Calculate total
      const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: storeId,
          order_type: 'delivery',
          status: 'open',
          customer_id: customerId,
          customer_address_id: customerAddressId,
          notes: notes || null,
          subtotal: total,
          tax: 0,
          discount: 0,
          total: total,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.productId || null,
        combo_id: item.comboId || null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.quantity * item.unitPrice,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Create delivery assignment
      const { error: assignmentError } = await supabase
        .from('delivery_assignments')
        .insert({
          order_id: order.id,
        });

      if (assignmentError) throw assignmentError;

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
