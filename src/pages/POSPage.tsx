import { useState, useCallback, useMemo } from 'react';
import { 
  Pizza, 
  Beef, 
  UtensilsCrossed, 
  Cake, 
  Beer, 
  Wine, 
  GlassWater,
  Martini,
  IceCream2,
  Package,
  MoreHorizontal,
  AlertCircle,
  Layers
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { CategoryButton } from '@/components/pos/CategoryButton';
import { ProductCard } from '@/components/pos/ProductCard';
import { ComboCard } from '@/components/pos/ComboCard';
import { Cart } from '@/components/pos/Cart';
import { CheckoutModal } from '@/components/pos/CheckoutModal';
import { DiscountModal } from '@/components/pos/DiscountModal';
import { Product as POSProduct, CartItem, Discount, ComboCompleto } from '@/types/pos';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { TicketConfig } from '@/components/pos/TicketPrint';
import { useCategories, useProducts, Category } from '@/hooks/useProducts';
import { useCombos } from '@/hooks/useCombos';
import { useCreateOrder, useCreatePayment } from '@/hooks/useOrders';
import { useCurrentCashSession } from '@/hooks/useCashSession';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

// Default ticket config
const defaultTicketConfig: TicketConfig = {
  businessName: 'PizzaPOS',
  businessAddress: 'Av. Principal 123, Lima',
  businessPhone: '01-234-5678',
  businessRuc: '20123456789',
  promoText: '¡Pide 2 pizzas y llévate una gaseosa gratis!',
  footerText: '¡Gracias por su preferencia!',
};

// Icon mapping for categories
const categoryIcons: Record<string, typeof Pizza> = {
  pizzas: Pizza,
  carnes: Beef,
  menus: UtensilsCrossed,
  postres: Cake,
  cervezas: Beer,
  vinos: Wine,
  gaseosas: GlassWater,
  cocteles: Martini,
  cremoladas: IceCream2,
  combos: Package,
  otros: MoreHorizontal,
};

function getCategoryIcon(name: string): typeof Pizza {
  const key = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return categoryIcons[key] || MoreHorizontal;
}

// Transform DB product to POS product
function transformProduct(dbProduct: any): POSProduct {
  return {
    id: dbProduct.id,
    nombre: dbProduct.name,
    categoria: dbProduct.category?.name?.toLowerCase() || 'otros',
    precio: Number(dbProduct.base_price),
    stock: 999, // Stock is managed by ingredients, not products
    stockMinimo: 5,
    requiereStock: dbProduct.track_stock,
    productoVence: false,
    activo: dbProduct.active,
    createdAt: new Date(dbProduct.created_at),
    updatedAt: new Date(dbProduct.created_at),
  };
}

export default function POSPage() {
  const { user } = useAuth();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showCombos, setShowCombos] = useState(false);
  const [comboFilter, setComboFilter] = useState<'all' | 'permanent' | 'temporary'>('all');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<Discount | undefined>();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);

  // Fetch data from Supabase
  const { data: categories = [], isLoading: loadingCategories } = useCategories();
  const { data: dbProducts = [], isLoading: loadingProducts } = useProducts();
  const { data: combos = [], isLoading: loadingCombos } = useCombos();
  const { data: cashSession } = useCurrentCashSession();

  // Mutations
  const createOrder = useCreateOrder();
  const createPayment = useCreatePayment();

  // Transform products
  const products = useMemo(() => 
    dbProducts.map(transformProduct), 
    [dbProducts]
  );

  // Set first category as selected when categories load
  useMemo(() => {
    if (categories.length > 0 && !selectedCategoryId && !showCombos) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId, showCombos]);

  // Filter products by selected category
  const filteredProducts = useMemo(() => {
    if (!selectedCategoryId || showCombos) return [];
    return products.filter(p => {
      const dbProduct = dbProducts.find(dp => dp.id === p.id);
      return dbProduct?.category_id === selectedCategoryId;
    });
  }, [products, dbProducts, selectedCategoryId, showCombos]);

  // Filter combos by type
  const filteredCombos = useMemo(() => {
    if (comboFilter === 'all') return combos;
    if (comboFilter === 'permanent') return combos.filter(c => !c.temporal);
    return combos.filter(c => c.temporal);
  }, [combos, comboFilter]);

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setShowCombos(false);
  };

  const handleSelectCombos = () => {
    setShowCombos(true);
    setSelectedCategoryId(null);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal - (discount?.monto || 0);

  const handleAddProduct = useCallback((product: POSProduct) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productoId === product.id && item.type === 'product');
      if (existing) {
        return prev.map((item) =>
          item.productoId === product.id && item.type === 'product'
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.precioUnitario,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'product' as const,
          productoId: product.id,
          nombre: product.nombre,
          cantidad: 1,
          precioUnitario: product.precio,
          subtotal: product.precio,
        },
      ];
    });
    toast.success(`${product.nombre} agregado`, { position: 'top-center' });
  }, []);

  const handleAddCombo = useCallback((combo: ComboCompleto) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.comboId === combo.id && item.type === 'combo');
      if (existing) {
        return prev.map((item) =>
          item.comboId === combo.id && item.type === 'combo'
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.precioUnitario,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'combo' as const,
          comboId: combo.id,
          nombre: combo.nombre,
          cantidad: 1,
          precioUnitario: combo.precio,
          subtotal: combo.precio,
        },
      ];
    });
    toast.success(`${combo.nombre} agregado`, { position: 'top-center' });
  }, []);

  const handleUpdateQuantity = useCallback((id: string, cantidad: number) => {
    if (cantidad <= 0) {
      setCartItems((prev) => prev.filter((item) => item.id !== id));
    } else {
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, cantidad, subtotal: cantidad * item.precioUnitario }
            : item
        )
      );
    }
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
    setDiscount(undefined);
  }, []);

  const handleApplyDiscount = useCallback((newDiscount: Discount) => {
    setDiscount(newDiscount);
    toast.success(`Descuento de S/ ${newDiscount.monto.toFixed(2)} aplicado`);
  }, []);

  const handleCheckoutConfirm = useCallback(async (data: any) => {
    if (!cashSession) {
      toast.error('Debe abrir una sesión de caja primero');
      return;
    }

    try {
      // Create order items
      const orderItems = cartItems.map(item => ({
        product_id: item.productoId || null,
        product_name: item.nombre,
        quantity: item.cantidad,
        unit_price: item.precioUnitario,
        total: item.subtotal,
      }));

      const newOrder = await createOrder.mutateAsync({
        order: {
          terminal_id: cashSession.terminal_id,
          cash_session_id: cashSession.id,
          user_id: user?.id || null,
          order_type: 'local',
          status: 'open',
          subtotal,
          discount_percent: 0,
          discount_amount: discount?.monto || 0,
          tax_amount: 0,
          total,
        },
        items: orderItems,
      });

      // Create payment(s)
      for (const payment of data.payments || [{ method: 'cash', amount: total }]) {
        await createPayment.mutateAsync({
          order_id: newOrder.id,
          cash_session_id: cashSession.id,
          user_id: user?.id || null,
          method: payment.method,
          amount: payment.amount,
          reference: payment.reference || null,
        });
      }

      toast.success('¡Venta completada!', {
        description: `Ticket #${newOrder.order_number}. Vuelto: S/ ${data.change?.toFixed(2) || '0.00'}`,
      });
      setCartItems([]);
      setDiscount(undefined);
      setIsCheckoutOpen(false);
    } catch (error: any) {
      toast.error('Error al procesar la venta', {
        description: error.message,
      });
    }
  }, [cashSession, cartItems, subtotal, discount, total, user, createOrder, createPayment]);

  const isLoading = loadingCategories || loadingProducts || loadingCombos;

  return (
    <MainLayout>
      <div className="h-full flex gap-3 lg:gap-4 xl:gap-6">
        {/* Left panel - Categories and Products */}
        <div className="flex-1 flex flex-col gap-2 lg:gap-3 xl:gap-4 min-w-0">
          {/* Cash session warning */}
          {!cashSession && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                No hay sesión de caja abierta. Vaya a <strong>Control de Caja</strong> para abrir una sesión antes de realizar ventas.
              </AlertDescription>
            </Alert>
          )}

          {/* Categories */}
          {isLoading ? (
            <div className="grid grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 lg:gap-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-14 lg:h-16 xl:h-20 rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 lg:gap-3">
                {categories.slice(0, 5).map((cat) => (
                  <CategoryButton
                    key={cat.id}
                    nombre={cat.name}
                    icon={getCategoryIcon(cat.name)}
                    isActive={selectedCategoryId === cat.id && !showCombos}
                    onClick={() => handleSelectCategory(cat.id)}
                  />
                ))}
                {/* Combos button */}
                {combos.length > 0 && (
                  <CategoryButton
                    nombre="Combos"
                    icon={Layers}
                    isActive={showCombos}
                    onClick={handleSelectCombos}
                  />
                )}
              </div>
              {categories.length > 5 && (
                <div className="grid grid-cols-4 lg:grid-cols-5 gap-2 lg:gap-3">
                  {categories.slice(5).map((cat) => (
                    <CategoryButton
                      key={cat.id}
                      nombre={cat.name}
                      icon={getCategoryIcon(cat.name)}
                      isActive={selectedCategoryId === cat.id && !showCombos}
                      onClick={() => handleSelectCategory(cat.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Products/Combos grid */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 lg:gap-3 xl:gap-4 pb-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-28 lg:h-32 xl:h-40 rounded-xl" />
                ))}
              </div>
            ) : showCombos ? (
              /* Combos section with filter */
              <div className="space-y-3 lg:space-y-4">
                {/* Combo filter buttons */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setComboFilter('all')}
                    className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg lg:rounded-xl text-xs lg:text-sm font-semibold transition-all ${
                      comboFilter === 'all'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Todos ({combos.length})
                  </button>
                  <button
                    onClick={() => setComboFilter('permanent')}
                    className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg lg:rounded-xl text-xs lg:text-sm font-semibold transition-all ${
                      comboFilter === 'permanent'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Permanentes ({combos.filter(c => !c.temporal).length})
                  </button>
                  <button
                    onClick={() => setComboFilter('temporary')}
                    className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg lg:rounded-xl text-xs lg:text-sm font-semibold transition-all ${
                      comboFilter === 'temporary'
                        ? 'bg-warning text-warning-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Temporales ({combos.filter(c => c.temporal).length})
                  </button>
                </div>
                
                {/* Combos grid */}
                <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-3 xl:gap-4 pb-4">
                  {filteredCombos.map((combo) => (
                    <ComboCard
                      key={combo.id}
                      combo={combo}
                      onAdd={handleAddCombo}
                      products={dbProducts}
                    />
                  ))}
                  {filteredCombos.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center h-48 lg:h-64 text-muted-foreground">
                      <Layers className="h-12 w-12 lg:h-16 lg:w-16 mb-3 lg:mb-4 opacity-50" />
                      <p className="text-base lg:text-lg font-medium">No hay combos disponibles</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Products grid */
              <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-3 xl:gap-4 pb-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={handleAddProduct}
                  />
                ))}
                {filteredProducts.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center h-48 lg:h-64 text-muted-foreground">
                    <Package className="h-12 w-12 lg:h-16 lg:w-16 mb-3 lg:mb-4 opacity-50" />
                    <p className="text-base lg:text-lg font-medium">Sin productos en esta categoría</p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right panel - Cart */}
        <div className="w-[280px] lg:w-[320px] xl:w-[380px] 2xl:w-[420px] shrink-0">
          <Cart
            items={cartItems}
            descuento={discount}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemoveItem}
            onClearCart={handleClearCart}
            onApplyDiscount={() => setIsDiscountOpen(true)}
            onCheckout={() => setIsCheckoutOpen(true)}
          />
        </div>
      </div>

      {/* Modals */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        total={total}
        subtotal={subtotal}
        discount={discount}
        products={products}
        combos={combos}
        ticketConfig={defaultTicketConfig}
        onConfirm={handleCheckoutConfirm}
      />

      <DiscountModal
        isOpen={isDiscountOpen}
        onClose={() => setIsDiscountOpen(false)}
        onApply={handleApplyDiscount}
        currentTotal={subtotal}
      />
    </MainLayout>
  );
}
