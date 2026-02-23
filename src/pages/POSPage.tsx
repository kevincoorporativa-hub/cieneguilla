import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Package,
  MoreHorizontal,
  AlertCircle,
  Layers,
  ShoppingCart,
  Maximize,
  Minimize,
  Search,
  X
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
import { getIconByName } from '@/components/pos/CategoryIconPicker';
import { useCombos } from '@/hooks/useCombos';
import { useCreateOrder, useCreatePayment } from '@/hooks/useOrders';
import { useCurrentCashSession } from '@/hooks/useCashSession';
import { useProductStock } from '@/hooks/useProductStock';
import { useRecipeStock } from '@/hooks/useRecipeStock';
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
import { supabase } from '@/integrations/supabase/client';

// Get category icon from DB or fallback to name-based guess
function getCategoryIcon(cat: Category) {
  return getIconByName(cat.icon);
}

// Transform DB product to POS product - stock will be added separately
function transformProduct(
  dbProduct: any,
  stockData?: { current_stock: number; track_stock: boolean },
  recipeServings?: number | null
): POSProduct {
  // Si el producto tiene receta, usar las porciones disponibles basadas en insumos
  // Si no, usar stock directo del producto
  let stock: number;
  if (recipeServings !== null && recipeServings !== undefined && recipeServings >= 0) {
    stock = recipeServings;
  } else if (dbProduct.track_stock) {
    stock = Number(stockData?.current_stock ?? 0);
  } else {
    stock = 999;
  }

  // Productos con receta siempre "requieren stock" (validación por insumos)
  const hasRecipe = recipeServings !== null && recipeServings !== undefined && recipeServings >= 0;

  return {
    id: dbProduct.id,
    nombre: dbProduct.name,
    categoria: dbProduct.category?.name?.toLowerCase() || 'otros',
    precio: Number(dbProduct.base_price),
    stock: stock,
    stockMinimo: Number(dbProduct.min_stock || 5),
    requiereStock: hasRecipe || dbProduct.track_stock,
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
  const [searchTerm, setSearchTerm] = useState('');
  const [sizeFilter, setSizeFilter] = useState<string | null>(null);
  const [flavorFilter, setFlavorFilter] = useState<string | null>(null);
  const [comboSearchTerm, setComboSearchTerm] = useState('');
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

  // Identify products with recipe-based categories
  const recipeProductIds = useMemo(() => {
    const recipeCategoryIds = new Set(categories.filter(c => c.has_recipes).map(c => c.id));
    return dbProducts
      .filter(p => p.category_id && recipeCategoryIds.has(p.category_id))
      .map(p => p.id);
  }, [dbProducts, categories]);

  const { data: recipeStockData = [] } = useRecipeStock(storeId, recipeProductIds);

  // Mutations
  const createOrder = useCreateOrder();
  const createPayment = useCreatePayment();

  // Transform products with stock data (merging recipe stock where applicable)
  const products = useMemo(() => 
    dbProducts.map(dbProduct => {
      const stockInfo = productStockData.find(s => s.product_id === dbProduct.id);
      const recipeInfo = recipeStockData.find(r => r.product_id === dbProduct.id);
      const recipeServings = recipeInfo?.has_recipe ? recipeInfo.available_servings : null;
      return transformProduct(dbProduct, stockInfo, recipeServings);
    }), 
    [dbProducts, productStockData, recipeStockData]
  );

  // Set first category as selected when categories load
  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId && !showCombos) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId, showCombos]);


  // Filter products by selected category, search term, and size filter
  const filteredProducts = useMemo(() => {
    if (!selectedCategoryId || showCombos) return [];
    let filtered = products.filter(p => {
      const dbProduct = dbProducts.find(dp => dp.id === p.id);
      return dbProduct?.category_id === selectedCategoryId;
    });
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(p => p.nombre.toLowerCase().includes(term));
    }
    // Apply size filter
    if (sizeFilter) {
      const size = sizeFilter.toLowerCase();
      filtered = filtered.filter(p => p.nombre.toLowerCase().includes(size));
    }
    // Apply flavor filter
    if (flavorFilter) {
      const flavor = flavorFilter.toLowerCase();
      filtered = filtered.filter(p => p.nombre.toLowerCase().includes(flavor));
    }
    return filtered;
  }, [products, dbProducts, selectedCategoryId, showCombos, searchTerm, sizeFilter, flavorFilter]);

  // Detect available sizes in current category products
  const availableSizes = useMemo(() => {
    if (!selectedCategoryId || showCombos) return [];
    const categoryProducts = products.filter(p => {
      const dbProduct = dbProducts.find(dp => dp.id === p.id);
      return dbProduct?.category_id === selectedCategoryId;
    });
    const sizes = ['Personal', 'Mediana', 'Familiar', 'Personal Especial', 'Mediana Especial', 'Familiar Especial'];
    return sizes.filter(size => 
      categoryProducts.some(p => nameMatchesSize(p.nombre, size))
    );
  }, [products, dbProducts, selectedCategoryId, showCombos]);

  // Helper: match name against size (full word or abbreviation)
  const nameMatchesSize = useCallback((name: string, size: string) => {
    const lower = name.toLowerCase();
    const s = size.toLowerCase();
    // Compound sizes like "Personal Especial" must match both words
    if (s === 'personal especial') return lower.includes('personal') && lower.includes('especial');
    if (s === 'mediana especial') return lower.includes('mediana') && lower.includes('especial');
    if (s === 'familiar especial') return lower.includes('familiar') && lower.includes('especial');
    // Simple sizes must match but NOT if "especial" is also present
    if (s === 'personal') return lower.includes('personal') && !lower.includes('especial');
    if (s === 'mediana') return lower.includes('mediana') && !lower.includes('especial');
    if (s === 'familiar') return (lower.includes('familiar') || lower.includes('fam')) && !lower.includes('especial');
    if (lower.includes(s)) return true;
    return false;
  }, []);

  // Detect available flavors in current category products (filtered by current size)
  const availableFlavors = useMemo(() => {
    if (!selectedCategoryId || showCombos) return [];
    let categoryProducts = products.filter(p => {
      const dbProduct = dbProducts.find(dp => dp.id === p.id);
      return dbProduct?.category_id === selectedCategoryId;
    });
    if (sizeFilter) {
      categoryProducts = categoryProducts.filter(p => nameMatchesSize(p.nombre, sizeFilter));
    }
    const flavors = ['Americana', 'Pepperoni', 'Hawaiana', 'Italiana', 'Vegetariana', 'Cabanossi', 'Salchipizza', 'Africana', 'Alemana', 'Consentida', 'La Brava', '4 Estaciones'];
    return flavors.filter(flavor => 
      categoryProducts.some(p => p.nombre.toLowerCase().includes(flavor.toLowerCase()))
    );
  }, [products, dbProducts, selectedCategoryId, showCombos, sizeFilter, nameMatchesSize]);


  // Filter combos by type, search and size
  const filteredCombos = useMemo(() => {
    let filtered = combos;
    if (comboFilter === 'permanent') filtered = filtered.filter(c => !c.temporal);
    else if (comboFilter === 'temporary') filtered = filtered.filter(c => c.temporal);
    if (comboSearchTerm.trim()) {
      const term = comboSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(c => c.nombre.toLowerCase().includes(term));
    }
    if (sizeFilter) {
      filtered = filtered.filter(c => nameMatchesSize(c.nombre, sizeFilter));
    }
    if (flavorFilter) {
      const flavor = flavorFilter.toLowerCase();
      filtered = filtered.filter(c => c.nombre.toLowerCase().includes(flavor));
    }
    return filtered;
  }, [combos, comboFilter, comboSearchTerm, sizeFilter, flavorFilter, nameMatchesSize]);

  // Detect available sizes in combos
  const comboAvailableSizes = useMemo(() => {
    if (!showCombos) return [];
    const sizes = ['Personal', 'Mediana', 'Familiar', 'Personal Especial', 'Mediana Especial', 'Familiar Especial'];
    return sizes.filter(size => combos.some(c => nameMatchesSize(c.nombre, size)));
  }, [combos, showCombos, nameMatchesSize]);

  // Detect available flavors in combos (filtered by current size)
  const comboAvailableFlavors = useMemo(() => {
    if (!showCombos) return [];
    let pool = combos;
    if (sizeFilter) {
      pool = pool.filter(c => nameMatchesSize(c.nombre, sizeFilter));
    }
    const flavors = ['Americana', 'Pepperoni', 'Hawaiana', 'Italiana', 'Vegetariana', 'Cabanossi', 'Salchipizza', 'Africana', 'Alemana', 'Consentida', 'La Brava', '4 Estaciones'];
    return flavors.filter(flavor => 
      pool.some(c => c.nombre.toLowerCase().includes(flavor.toLowerCase()))
    );
  }, [combos, showCombos, sizeFilter, nameMatchesSize]);

  // Reset flavor filter when it's no longer available (e.g. size changed)
  const currentFlavors = showCombos ? comboAvailableFlavors : availableFlavors;
  if (flavorFilter && currentFlavors.length > 0 && !currentFlavors.includes(flavorFilter)) {
    setTimeout(() => setFlavorFilter(null), 0);
  }

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setShowCombos(false);
    setSearchTerm('');
    setSizeFilter(null);
    setFlavorFilter(null);
    setComboSearchTerm('');
  };

  const handleSelectCombos = () => {
    setShowCombos(true);
    setSelectedCategoryId(null);
    setSearchTerm('');
    setSizeFilter(null);
    setFlavorFilter(null);
    setComboSearchTerm('');
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

      // Upsert customer if name provided and not generic
      let customerId: string | null = null;
      const clientName = data.clientName || 'Cliente Genérico';
      if (clientName && clientName !== 'Cliente Genérico') {
        // Try to find existing customer by name
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('name', clientName)
          .maybeSingle();

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          const { data: newCustomer } = await supabase
            .from('customers')
            .insert({ name: clientName, dni: data.clientDni || null })
            .select('id')
            .single();
          if (newCustomer) customerId = newCustomer.id;
        }
      }

      const newOrder = await createOrder.mutateAsync({
        order: {
          store_id: storeId,
          terminal_id: cashSession.terminal_id,
          cash_session_id: cashSession.id,
          user_id: user?.id || null,
          customer_id: customerId,
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
                icon={getCategoryIcon(cat)}
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

          {/* Kiosk: Search bar + size filters */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-[350px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={showCombos ? "Buscar combo..." : "Buscar producto..."}
                value={showCombos ? comboSearchTerm : searchTerm}
                onChange={(e) => showCombos ? setComboSearchTerm(e.target.value) : setSearchTerm(e.target.value)}
                className="w-full h-11 lg:h-12 pl-9 pr-8 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              />
              {(showCombos ? comboSearchTerm : searchTerm) && (
                <button
                  onClick={() => showCombos ? setComboSearchTerm('') : setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
            {(showCombos ? comboAvailableSizes : availableSizes).length > 0 && (
              <>
                <button
                  onClick={() => setSizeFilter(null)}
                  className={cn(
                    'px-4 py-2.5 rounded-xl text-sm font-semibold transition-all touch-action-manipulation select-none',
                    !sizeFilter
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  )}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  Todos
                </button>
                {(showCombos ? comboAvailableSizes : availableSizes).map(size => (
                  <button
                    key={size}
                    onClick={() => setSizeFilter(sizeFilter === size ? null : size)}
                    className={cn(
                      'px-4 py-2.5 rounded-xl text-sm font-semibold transition-all touch-action-manipulation select-none',
                      sizeFilter === size
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    )}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    {size}
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Kiosk: Flavor filters */}
          {(showCombos ? comboAvailableFlavors : availableFlavors).length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="text-sm font-medium text-muted-foreground">Sabor:</span>
              <button
                onClick={() => setFlavorFilter(null)}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-sm font-semibold transition-all touch-action-manipulation select-none',
                  !flavorFilter
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                Todos
              </button>
              {(showCombos ? comboAvailableFlavors : availableFlavors).map(flavor => (
                <button
                  key={flavor}
                  onClick={() => setFlavorFilter(flavorFilter === flavor ? null : flavor)}
                  className={cn(
                    'px-4 py-2.5 rounded-xl text-sm font-semibold transition-all touch-action-manipulation select-none',
                    flavorFilter === flavor
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  )}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {flavor}
                </button>
              ))}
            </div>
          )}

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
                    icon={getCategoryIcon(cat)}
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
                      icon={getCategoryIcon(cat)}
                      isActive={selectedCategoryId === cat.id && !showCombos}
                      onClick={() => handleSelectCategory(cat.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Search bar + size filters (only for product categories, not combos) */}
          {!showCombos && !isLoading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search input */}
                <div className="relative flex-1 min-w-[180px] max-w-[300px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-10 lg:h-11 pl-9 pr-8 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>

                {/* Size filter buttons */}
                {availableSizes.length > 0 && (
                  <>
                    <button
                      onClick={() => setSizeFilter(null)}
                      className={cn(
                        'px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-all touch-action-manipulation select-none',
                        !sizeFilter
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      )}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      Todos
                    </button>
                    {availableSizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSizeFilter(sizeFilter === size ? null : size)}
                        className={cn(
                          'px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-all touch-action-manipulation select-none',
                          sizeFilter === size
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        )}
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                      >
                        {size}
                      </button>
                    ))}
                  </>
                )}
              </div>

              {/* Flavor filter buttons */}
              {availableFlavors.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground font-medium">Sabor:</span>
                  <button
                    onClick={() => setFlavorFilter(null)}
                    className={cn(
                      'px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all touch-action-manipulation select-none',
                      !flavorFilter
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    )}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    Todos
                  </button>
                  {availableFlavors.map(flavor => (
                    <button
                      key={flavor}
                      onClick={() => setFlavorFilter(flavorFilter === flavor ? null : flavor)}
                      className={cn(
                        'px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all touch-action-manipulation select-none',
                        flavorFilter === flavor
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      )}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      {flavor}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
                {/* Combo search + size filters */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative flex-1 min-w-[180px] max-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar combo..."
                      value={comboSearchTerm}
                      onChange={(e) => setComboSearchTerm(e.target.value)}
                      className="w-full h-10 lg:h-11 pl-9 pr-8 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    />
                    {comboSearchTerm && (
                      <button
                        onClick={() => setComboSearchTerm('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  {comboAvailableSizes.length > 0 && (
                    <>
                      <button
                        onClick={() => setSizeFilter(null)}
                        className={cn(
                          'px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-all touch-action-manipulation select-none',
                          !sizeFilter
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        )}
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                      >
                        Todos
                      </button>
                      {comboAvailableSizes.map(size => (
                        <button
                          key={size}
                          onClick={() => setSizeFilter(sizeFilter === size ? null : size)}
                          className={cn(
                            'px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-all touch-action-manipulation select-none',
                            sizeFilter === size
                              ? 'bg-primary text-primary-foreground shadow-md'
                              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                          )}
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                          {size}
                        </button>
                      ))}
                    </>
                  )}
                </div>

                {/* Combo flavor filter buttons */}
                {comboAvailableFlavors.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground font-medium">Sabor:</span>
                    <button
                      onClick={() => setFlavorFilter(null)}
                      className={cn(
                        'px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all touch-action-manipulation select-none',
                        !flavorFilter
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      )}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      Todos
                    </button>
                    {comboAvailableFlavors.map(flavor => (
                      <button
                        key={flavor}
                        onClick={() => setFlavorFilter(flavorFilter === flavor ? null : flavor)}
                        className={cn(
                          'px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all touch-action-manipulation select-none',
                          flavorFilter === flavor
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        )}
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                      >
                        {flavor}
                      </button>
                    ))}
                  </div>
                )}

                {/* Combo type filter buttons */}
                
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
