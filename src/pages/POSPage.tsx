import { useState, useCallback } from 'react';
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
  MoreHorizontal
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { CategoryButton } from '@/components/pos/CategoryButton';
import { ProductCard } from '@/components/pos/ProductCard';
import { Cart } from '@/components/pos/Cart';
import { CheckoutModal } from '@/components/pos/CheckoutModal';
import { DiscountModal } from '@/components/pos/DiscountModal';
import { Product, ProductCategory, CartItem, Discount, ComboCompleto } from '@/types/pos';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { TicketConfig } from '@/components/pos/TicketPrint';

// Demo combos
const demoCombos: ComboCompleto[] = [
  {
    id: 'c1',
    nombre: 'Combo Pizza + Gaseosa',
    descripcion: 'Pizza + Coca Cola 1L',
    componentes: [
      { productoId: '1', cantidad: 1, nombre: 'Pizza Margarita' },
      { productoId: '13', cantidad: 1, nombre: 'Coca Cola 1L' },
    ],
    precio: 32.00,
    activo: true,
    temporal: false,
    createdAt: new Date(),
  },
];

// Default ticket config
const defaultTicketConfig: TicketConfig = {
  businessName: 'PizzaPOS',
  businessAddress: 'Av. Principal 123, Lima',
  businessPhone: '01-234-5678',
  businessRuc: '20123456789',
  promoText: '¡Pide 2 pizzas y llévate una gaseosa gratis!',
  footerText: '¡Gracias por su preferencia!',
};

// Demo products - requiereStock: false para pizzas/carnes (preparados), true para bebidas (inventario)
const demoProducts: Product[] = [
  { id: '1', nombre: 'Pizza Margarita', categoria: 'pizzas', precio: 28.00, stock: 50, stockMinimo: 5, requiereStock: false, productoVence: false, activo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', nombre: 'Pizza Pepperoni', categoria: 'pizzas', precio: 32.00, stock: 45, stockMinimo: 5, requiereStock: false, productoVence: false, activo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '3', nombre: 'Pizza Hawaiana', categoria: 'pizzas', precio: 35.00, stock: 30, stockMinimo: 5, requiereStock: false, productoVence: false, activo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '4', nombre: 'Pizza Suprema', categoria: 'pizzas', precio: 42.00, stock: 25, stockMinimo: 5, requiereStock: false, productoVence: false, activo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '5', nombre: 'Pizza BBQ', categoria: 'pizzas', precio: 38.00, stock: 8, stockMinimo: 5, requiereStock: false, productoVence: false, activo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '6', nombre: 'Pizza Vegetariana', categoria: 'pizzas', precio: 30.00, stock: 3, stockMinimo: 5, requiereStock: false, productoVence: false, activo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '7', nombre: 'Parrilla Mixta', categoria: 'carnes', precio: 65.00, stock: 20, stockMinimo: 3, requiereStock: false, productoVence: false, activo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '8', nombre: 'Costillas BBQ', categoria: 'carnes', precio: 55.00, stock: 15, stockMinimo: 3, requiereStock: false, productoVence: false, activo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '9', nombre: 'Lomo Saltado', categoria: 'carnes', precio: 38.00, stock: 0, stockMinimo: 3, requiereStock: false, productoVence: false, activo: true, createdAt: new Date(), updatedAt: new Date() },
  // Bebidas con stock real (requiereStock: true) y vencimiento
  { id: '10', nombre: 'Cerveza Pilsen', categoria: 'cervezas', precio: 8.00, stock: 100, stockMinimo: 20, requiereStock: true, productoVence: true, fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), activo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '11', nombre: 'Cerveza Cusqueña', categoria: 'cervezas', precio: 9.00, stock: 80, stockMinimo: 20, requiereStock: true, productoVence: true, fechaVencimiento: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), activo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '12', nombre: 'Corona', categoria: 'cervezas', precio: 12.00, stock: 60, stockMinimo: 15, requiereStock: true, productoVence: true, fechaVencimiento: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), activo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '13', nombre: 'Coca Cola 1L', categoria: 'gaseosas', precio: 7.00, stock: 50, stockMinimo: 10, requiereStock: true, productoVence: true, fechaVencimiento: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), activo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '14', nombre: 'Inca Kola 1L', categoria: 'gaseosas', precio: 7.00, stock: 50, stockMinimo: 10, requiereStock: true, productoVence: true, fechaVencimiento: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), activo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '15', nombre: 'Vino Tinto Tacama', categoria: 'vinos', precio: 45.00, stock: 20, stockMinimo: 5, requiereStock: true, productoVence: true, fechaVencimiento: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), activo: true, createdAt: new Date(), updatedAt: new Date() },
];

const categories: { id: ProductCategory; nombre: string; icon: typeof Pizza }[] = [
  { id: 'pizzas', nombre: 'Pizzas', icon: Pizza },
  { id: 'carnes', nombre: 'Carnes', icon: Beef },
  { id: 'menus', nombre: 'Menús', icon: UtensilsCrossed },
  { id: 'postres', nombre: 'Postres', icon: Cake },
  { id: 'cervezas', nombre: 'Cervezas', icon: Beer },
  { id: 'vinos', nombre: 'Vinos', icon: Wine },
  { id: 'gaseosas', nombre: 'Gaseosas', icon: GlassWater },
  { id: 'cocteles', nombre: 'Cócteles', icon: Martini },
  { id: 'cremoladas', nombre: 'Cremoladas', icon: IceCream2 },
  { id: 'combos', nombre: 'Combos', icon: Package },
  { id: 'otros', nombre: 'Otros', icon: MoreHorizontal },
];

export default function POSPage() {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('pizzas');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<Discount | undefined>();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(demoProducts);
  const [combos] = useState<ComboCompleto[]>(demoCombos);

  const filteredProducts = products.filter(
    (p) => p.categoria === selectedCategory && p.activo
  );
  
  const filteredCombos = combos.filter((c) => c.activo);

  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal - (discount?.monto || 0);

  const handleAddProduct = useCallback((product: Product) => {
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

  const handleCheckoutConfirm = useCallback((data: any) => {
    // Apply stock deductions for products that require stock
    if (data.stockDeductions && data.stockDeductions.length > 0) {
      setProducts(prev => prev.map(product => {
        const deduction = data.stockDeductions.find((d: any) => d.productId === product.id);
        if (deduction) {
          return { ...product, stock: Math.max(0, product.stock - deduction.quantity) };
        }
        return product;
      }));
    }
    
    toast.success('¡Venta completada!', {
      description: `Ticket generado. Vuelto: S/ ${data.change.toFixed(2)}`,
    });
    setCartItems([]);
    setDiscount(undefined);
    setIsCheckoutOpen(false);
  }, []);

  return (
    <MainLayout>
      <div className="h-full flex gap-6">
        {/* Left panel - Categories and Products */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Categories */}
          <div className="grid grid-cols-6 gap-3">
            {categories.slice(0, 6).map((cat) => (
              <CategoryButton
                key={cat.id}
                nombre={cat.nombre}
                icon={cat.icon}
                isActive={selectedCategory === cat.id}
                onClick={() => setSelectedCategory(cat.id)}
              />
            ))}
          </div>
          <div className="grid grid-cols-5 gap-3">
            {categories.slice(6).map((cat) => (
              <CategoryButton
                key={cat.id}
                nombre={cat.nombre}
                icon={cat.icon}
                isActive={selectedCategory === cat.id}
                onClick={() => setSelectedCategory(cat.id)}
              />
            ))}
          </div>

          {/* Products grid */}
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-4 gap-4 pb-4">
              {/* Show combos when "combos" category is selected */}
              {selectedCategory === 'combos' ? (
                <>
                  {filteredCombos.map((combo) => (
                    <div
                      key={combo.id}
                      onClick={() => handleAddCombo(combo)}
                      className="bg-card border-2 border-primary/30 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] hover:border-primary"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-5 w-5 text-primary" />
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-semibold">
                          COMBO
                        </span>
                      </div>
                      <h3 className="font-bold text-pos-lg mb-1">{combo.nombre}</h3>
                      {combo.descripcion && (
                        <p className="text-sm text-muted-foreground mb-2">{combo.descripcion}</p>
                      )}
                      <div className="space-y-1 mb-3">
                        {combo.componentes.map((comp, idx) => (
                          <p key={idx} className="text-xs text-muted-foreground">
                            • {comp.cantidad}x {comp.nombre}
                          </p>
                        ))}
                      </div>
                      <p className="text-pos-xl font-bold text-primary">S/ {combo.precio.toFixed(2)}</p>
                    </div>
                  ))}
                  {filteredCombos.length === 0 && (
                    <div className="col-span-4 flex flex-col items-center justify-center h-64 text-muted-foreground">
                      <Package className="h-16 w-16 mb-4 opacity-50" />
                      <p className="text-pos-lg font-medium">No hay combos activos</p>
                      <p className="text-sm">Crea combos desde el menú Combos</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAdd={handleAddProduct}
                    />
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="col-span-4 flex flex-col items-center justify-center h-64 text-muted-foreground">
                      <Package className="h-16 w-16 mb-4 opacity-50" />
                      <p className="text-pos-lg font-medium">Sin productos en esta categoría</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right panel - Cart */}
        <div className="w-[420px]">
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