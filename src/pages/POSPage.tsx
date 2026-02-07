import { useState, useCallback, useMemo, useEffect } from 'react';
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
  Layers,
  ShoppingCart,
  Maximize,
  Minimize
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { CategoryButton } from '@/components/pos/CategoryButton';
import { ProductCard } from '@/components/pos/ProductCard';
import { ComboCard } from '@/components/pos/ComboCard';
import { SwipeableCart } from '@/components/pos/SwipeableCart';
import { CheckoutModal } from '@/components/pos/CheckoutModal';
import { CashSessionModal } from '@/components/pos/CashSessionModal';
import { Button } from '@/components/ui/button';
import { DiscountModal } from '@/components/pos/DiscountModal';
import { Product as POSProduct, CartItem, Discount, ComboCompleto } from '@/types/pos';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { TicketConfig } from '@/components/pos/TicketPrint';
import { useCategories, useProducts, Category } from '@/hooks/useProducts';
import { useCombos } from '@/hooks/useCombos';
import { useCreateOrder, useCreatePayment } from '@/hooks/useOrders';
import { useCurrentCashSession } from '@/hooks/useCashSession';
import { useProductStock } from '@/hooks/useProductStock';
import { useAuth } from '@/contexts/AuthContext';
import { useLicenseStatus } from '@/hooks/useLicense';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import { LicenseBlocker } from '@/components/license/LicenseBlocker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useFullscreen } from '@/hooks/useFullscreen';
import { cn } from '@/lib/utils';
import { mapPaymentMethodToDb, mapOrderTypeToDb } from '@/utils/paymentMethodMapper';

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

// Transform DB product to POS product - stock will be added separately
function transformProduct(dbProduct: any, stockData?: { current_stock: number; track_stock: boolean }): POSProduct {
  // Si el producto trackea stock y aún no hay data de stock, ser conservador (0)
  const stock = dbProduct.track_stock
    ? Number(stockData?.current_stock ?? 0)
    : 999;
  return {
    id: dbProduct.id,
    nombre: dbProduct.name,
    categoria: dbProduct.category?.name?.toLowerCase() || 'otros',
    precio: Number(dbProduct.base_price),
    stock: stock,
    stockMinimo: Number(dbProduct.min_stock || 5),
    requiereStock: dbProduct.track_stock,
    productoVence: false,
    activo: dbProduct.active,
    createdAt: new Date(dbProduct.created_at),
    updatedAt: new Date(dbProduct.created_at),
  };
}

export default function POSPage() {
  const { user } = useAuth();
  const { isExpired: isLicenseExpired, isLoading: isLicenseLoading } = useLicenseStatus();
  const { settings } = useBusinessSettings();

  // Build ticket config from saved business settings
  const ticketConfig: TicketConfig = useMemo(() => ({
    businessName: settings.businessName,
    businessAddress: settings.businessAddress,
    businessPhone: settings.businessPhone,
    businessRuc: settings.businessRuc,
    logoUrl: settings.ticketLogoUrl,
    promoText: settings.ticketPromoText,
    footerText: settings.ticketFooterText,
  }), [settings]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showCombos, setShowCombos] = useState(false);
  const [comboFilter, setComboFilter] = useState<'all' | 'permanent' | 'temporary'>('all');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<Discount | undefined>();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  // Hooks
  const { lightTap, successFeedback, errorFeedback } = useHapticFeedback();
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  // Fetch data from Supabase
  const { data: categories = [], isLoading: loadingCategories } = useCategories();
  const { data: dbProducts = [], isLoading: loadingProducts } = useProducts();
  const { data: combos = [], isLoading: loadingCombos } = useCombos();
  const { data: cashSession } = useCurrentCashSession();

  const storeId = useMemo(() => {
    const terminal = (cashSession as any)?.terminal;
    return (terminal?.store_id as string | undefined) ?? (terminal?.store?.id as string | undefined);
  }, [cashSession]);

  const { data: productStockData = [] } = useProductStock(storeId);

  // Mutations
  const createOrder = useCreateOrder();
  const createPayment = useCreatePayment();

  // Transform products with stock data
  const products = useMemo(() => 
    dbProducts.map(dbProduct => {
      const stockInfo = productStockData.find(s => s.product_id === dbProduct.id);
      return transformProduct(dbProduct, stockInfo);
    }), 
    [dbProducts, productStockData]
  );

  // Set first category as selected when categories load
  useEffect(() => {
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
    lightTap(); // Haptic feedback
    
    // Validar stock antes de agregar
    if (product.requiereStock) {
      const currentInCart = cartItems
        .filter(item => item.productoId === product.id)
        .reduce((sum, item) => sum + item.cantidad, 0);
      
      if (product.stock <= 0) {
        errorFeedback();
        toast.error(`${product.nombre} sin stock disponible`, { 
          position: 'top-center',
          description: 'No se puede agregar al carrito'
        });
        return;
      }
      
      if (currentInCart + 1 > product.stock) {
        errorFeedback();
        toast.error(`Stock insuficiente`, { 
          position: 'top-center',
          description: `Solo hay ${product.stock} unidades de ${product.nombre} disponibles`
        });
        return;
      }
    }
    
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
  }, [lightTap, errorFeedback, cartItems]);

  const handleAddCombo = useCallback((combo: ComboCompleto) => {
    lightTap(); // Haptic feedback
    
    // Calcular cuántos combos ya hay en el carrito
    const currentComboQty = cartItems
      .filter(item => item.comboId === combo.id)
      .reduce((sum, item) => sum + item.cantidad, 0);
    const newQty = currentComboQty + 1;
    
    // Validar stock de TODOS los componentes del combo
    for (const comp of combo.componentes) {
      const product = products.find(p => p.id === comp.productoId);
      if (!product) continue;
      
      if (product.requiereStock) {
        // Calcular cuánto de este producto ya está en el carrito (individual + otros combos)
        const individualQty = cartItems
          .filter(item => item.productoId === comp.productoId)
          .reduce((sum, item) => sum + item.cantidad, 0);
        
        // Cantidad de este producto usado por otros combos en el carrito
        let otherCombosQty = 0;
        cartItems.filter(item => item.type === 'combo' && item.comboId !== combo.id).forEach(cartCombo => {
          const comboData = combos.find(c => c.id === cartCombo.comboId);
          const compInCombo = comboData?.componentes.find(c => c.productoId === comp.productoId);
          if (compInCombo) {
            otherCombosQty += compInCombo.cantidad * cartCombo.cantidad;
          }
        });
        
        // Total requerido incluyendo el nuevo combo
        const requiredQty = individualQty + otherCombosQty + (comp.cantidad * newQty);
        
        if (product.stock <= 0) {
          errorFeedback();
          toast.error(`${product.nombre} sin stock disponible`, { 
            position: 'top-center',
            description: `No se puede agregar el combo "${combo.nombre}"`
          });
          return;
        }
        
        if (requiredQty > product.stock) {
          errorFeedback();
          toast.error(`Stock insuficiente de ${product.nombre}`, { 
            position: 'top-center',
            description: `Solo hay ${product.stock} unidades disponibles`
          });
          return;
        }
      }
    }
    
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
  }, [lightTap, errorFeedback, cartItems, products, combos]);

  const handleUpdateQuantity = useCallback((id: string, cantidad: number) => {
    if (cantidad <= 0) {
      setCartItems((prev) => prev.filter((item) => item.id !== id));
    } else {
      // Validar stock para productos
      const item = cartItems.find(i => i.id === id);
      if (item?.productoId) {
        const product = products.find(p => p.id === item.productoId);
        if (product?.requiereStock && cantidad > product.stock) {
          errorFeedback();
          toast.error(`Stock insuficiente`, { 
            position: 'top-center',
            description: `Solo hay ${product.stock} unidades disponibles`
          });
          return;
        }
      }
      
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, cantidad, subtotal: cantidad * item.precioUnitario }
            : item
        )
      );
    }
  }, [cartItems, products, errorFeedback]);

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

  const handleCheckoutConfirm = useCallback(async (data: any): Promise<number | false> => {
    if (!cashSession) {
      toast.error('Debe abrir una sesión de caja primero');
      return false;
    }

    if (!storeId) {
      toast.error('No se pudo determinar la tienda de esta caja');
      return false;
    }

    try {
      // Usar el total final que incluye el recargo adicional
      const orderTotal = data.finalTotal ?? total;
      const extraChargeAmount = data.extraCharge || 0;

      // Create order items - include combo_id for combo items
      const orderItems = cartItems.map(item => ({
        product_id: item.productoId || null,
        combo_id: item.comboId || null,
        product_name: item.nombre,
        quantity: item.cantidad,
        unit_price: item.precioUnitario,
        total: item.subtotal,
      }));
      
      // Si hay recargo adicional, agregarlo como un item especial
      if (extraChargeAmount > 0) {
        orderItems.push({
          product_id: null,
          combo_id: null,
          product_name: 'Recargo adicional',
          quantity: 1,
          unit_price: extraChargeAmount,
          total: extraChargeAmount,
        });
      }

      // Map order type to database format
      const dbOrderType = mapOrderTypeToDb(data.orderType || 'local');

      const newOrder = await createOrder.mutateAsync({
        order: {
          store_id: storeId,
          terminal_id: cashSession.terminal_id,
          cash_session_id: cashSession.id,
          user_id: user?.id || null,
          order_type: dbOrderType,
          status: 'open',
          subtotal: subtotal + extraChargeAmount,
          discount_percent: 0,
          discount_amount: discount?.monto || 0,
          tax_amount: 0,
          total: orderTotal,
        },
        items: orderItems,
      });

      // Create payment(s) - map payment method to DB format
      for (const payment of data.payments || [{ method: 'efectivo', amount: orderTotal }]) {
        const dbPaymentMethod = mapPaymentMethodToDb(payment.method);
        await createPayment.mutateAsync({
          order_id: newOrder.id,
          cash_session_id: cashSession.id,
          user_id: user?.id || null,
          method: dbPaymentMethod,
          amount: payment.amount,
          reference: payment.reference || null,
          orderType: dbOrderType, // Pass order type to handle delivery orders differently
        });
      }

      successFeedback(); // Haptic feedback on success
      toast.success('¡Venta completada!', {
        description: `Ticket T-${newOrder.order_number}. Vuelto: S/ ${data.change?.toFixed(2) || '0.00'}`,
      });
      setCartItems([]);
      setDiscount(undefined);
      return newOrder.order_number;
    } catch (error: any) {
      errorFeedback(); // Haptic feedback on error
      toast.error('Error al procesar la venta', {
        description: error.message,
      });
      return false;
    }
  }, [cashSession, storeId, cartItems, subtotal, discount, total, user, createOrder, createPayment, successFeedback, errorFeedback]);

  // Toggle kiosk mode
  const handleToggleKioskMode = useCallback(() => {
    setIsKioskMode(prev => !prev);
    toggleFullscreen();
    lightTap();
  }, [toggleFullscreen, lightTap]);

  const isLoading = loadingCategories || loadingProducts || loadingCombos;

  // Block POS if license expired
  if (!isLicenseLoading && isLicenseExpired) {
    return (
      <MainLayout>
        <LicenseBlocker />
      </MainLayout>
    );
  }

  // Conditional layout based on kiosk mode
  if (isKioskMode) {
    return (
      <div className="h-screen w-screen flex bg-background overflow-hidden touch-mode">
        {/* Full screen POS content */}
        <div className="flex-1 flex flex-col p-4 lg:p-6 min-w-0">
          {/* Header with exit button */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">PizzaPOS - Modo Kiosco</h1>
            <Button
              variant="outline"
              size="lg"
              onClick={handleToggleKioskMode}
              className="gap-2 touch-active h-12"
            >
              <Minimize className="h-5 w-5" />
              Salir
            </Button>
          </div>

          {/* Categories */}
          <div className="grid grid-cols-4 lg:grid-cols-6 gap-3 lg:gap-4 mb-4">
            {categories.map((cat) => (
              <CategoryButton
                key={cat.id}
                nombre={cat.name}
                icon={getCategoryIcon(cat.name)}
                isActive={selectedCategoryId === cat.id && !showCombos}
                onClick={() => handleSelectCategory(cat.id)}
              />
            ))}
            {combos.length > 0 && (
              <CategoryButton
                nombre="Combos"
                icon={Layers}
                isActive={showCombos}
                onClick={handleSelectCombos}
              />
            )}
          </div>

          {/* Products Grid - Larger cards for touch */}
          <ScrollArea className="flex-1">
            {showCombos ? (
              <div className="grid grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 pb-4">
                {filteredCombos.map((combo) => (
                  <ComboCard
                    key={combo.id}
                    combo={combo}
                    onAdd={handleAddCombo}
                    products={dbProducts}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 pb-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={handleAddProduct}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Cart Panel - Always visible in kiosk mode */}
        <div className="w-[350px] lg:w-[420px] xl:w-[480px] shrink-0 border-l border-border">
          <SwipeableCart
            items={cartItems}
            descuento={discount}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemoveItem}
            onClearCart={handleClearCart}
            onApplyDiscount={() => setIsDiscountOpen(true)}
            onCheckout={() => setIsCheckoutOpen(true)}
          />
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
          ticketConfig={ticketConfig}
          onConfirm={handleCheckoutConfirm}
        />

        <DiscountModal
          isOpen={isDiscountOpen}
          onClose={() => setIsDiscountOpen(false)}
          onApply={handleApplyDiscount}
          currentTotal={subtotal}
        />
      </div>
    );
  }

  return (
    <MainLayout>
      {/* Modal obligatorio de apertura/cierre de caja */}
      {!isSessionReady && (
        <CashSessionModal onSessionReady={() => setIsSessionReady(true)} />
      )}
      
      <div className="h-full flex gap-3 lg:gap-4 xl:gap-6">
        {/* Left panel - Categories and Products */}
        <div className="flex-1 flex flex-col gap-2 lg:gap-3 xl:gap-4 min-w-0">

          {/* Kiosk Mode Toggle Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleKioskMode}
              className="gap-2 touch-active"
            >
              {isKioskMode ? (
                <>
                  <Minimize className="h-4 w-4" />
                  <span className="hidden sm:inline">Salir Pantalla Completa</span>
                </>
              ) : (
                <>
                  <Maximize className="h-4 w-4" />
                  <span className="hidden sm:inline">Modo Kiosco</span>
                </>
              )}
            </Button>
          </div>

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

        {/* Right panel - Cart (Desktop) */}
        <div className="hidden lg:block w-[280px] lg:w-[320px] xl:w-[380px] 2xl:w-[420px] shrink-0">
          <SwipeableCart
            items={cartItems}
            descuento={discount}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemoveItem}
            onClearCart={handleClearCart}
            onApplyDiscount={() => setIsDiscountOpen(true)}
            onCheckout={() => setIsCheckoutOpen(true)}
          />
        </div>

        {/* Mobile Cart Toggle Button */}
        <Button
          className="lg:hidden fixed bottom-4 right-4 z-40 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 touch-active"
          onClick={() => setIsMobileCartOpen(true)}
        >
          <ShoppingCart className="h-6 w-6" />
          {cartItems.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {cartItems.length}
            </span>
          )}
        </Button>

        {/* Mobile Cart Overlay */}
        {isMobileCartOpen && (
          <>
            <div 
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsMobileCartOpen(false)}
            />
            <div className="lg:hidden fixed right-0 top-0 h-full w-[85vw] max-w-[400px] z-50 animate-slide-in-right">
              <SwipeableCart
                items={cartItems}
                descuento={discount}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemoveItem}
                onClearCart={handleClearCart}
                onApplyDiscount={() => setIsDiscountOpen(true)}
                onCheckout={() => setIsCheckoutOpen(true)}
                onClose={() => setIsMobileCartOpen(false)}
              />
            </div>
          </>
        )}
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
        ticketConfig={ticketConfig}
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
