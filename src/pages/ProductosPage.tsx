import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Package, Eye, EyeOff, FolderPlus, X, Check, Archive, GripVertical, ArrowUp, ArrowDown, Settings2, Calendar, ArrowDownCircle, ArrowUpCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Product, ProductCategory } from '@/types/pos';
import { toast } from 'sonner';

// Kardex movement types
interface KardexMovement {
  id: string;
  productId: string;
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  motivo: string;
  fecha: Date;
  fechaMovimiento: Date;
  usuario: string;
  precioUnitario?: number;
  montoTotal?: number;
}

// Product with inventory info
interface ProductInventory {
  productId: string;
  fechaIngreso: Date;
  ultimoMovimiento: Date;
}

const demoProducts: Product[] = [
  // Productos preparados (pizzas, carnes) - no requieren stock
  { id: '1', nombre: 'Pizza Margarita', categoria: 'pizzas', precio: 28.00, stock: 50, stockMinimo: 5, requiereStock: false, productoVence: false, activo: true, createdAt: new Date('2024-01-15'), updatedAt: new Date() },
  { id: '2', nombre: 'Pizza Pepperoni', categoria: 'pizzas', precio: 32.00, stock: 45, stockMinimo: 5, requiereStock: false, productoVence: false, activo: true, createdAt: new Date('2024-01-15'), updatedAt: new Date() },
  { id: '3', nombre: 'Pizza Hawaiana', categoria: 'pizzas', precio: 35.00, stock: 30, stockMinimo: 5, requiereStock: false, productoVence: false, activo: true, createdAt: new Date('2024-01-20'), updatedAt: new Date() },
  { id: '4', nombre: 'Pizza Suprema', categoria: 'pizzas', precio: 42.00, stock: 25, stockMinimo: 5, requiereStock: false, productoVence: false, activo: true, createdAt: new Date('2024-01-25'), updatedAt: new Date() },
  { id: '5', nombre: 'Parrilla Mixta', categoria: 'carnes', precio: 65.00, stock: 20, stockMinimo: 3, requiereStock: false, productoVence: false, activo: true, createdAt: new Date('2024-02-01'), updatedAt: new Date() },
  { id: '6', nombre: 'Costillas BBQ', categoria: 'carnes', precio: 55.00, stock: 15, stockMinimo: 3, requiereStock: false, productoVence: false, activo: true, createdAt: new Date('2024-02-05'), updatedAt: new Date() },
  // Bebidas - requieren stock e inventario
  { id: '7', nombre: 'Cerveza Pilsen', categoria: 'cervezas', precio: 8.00, stock: 100, stockMinimo: 20, requiereStock: true, productoVence: true, fechaVencimiento: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), activo: true, createdAt: new Date('2024-02-10'), updatedAt: new Date() },
  { id: '8', nombre: 'Cerveza Cusqueña', categoria: 'cervezas', precio: 9.00, stock: 80, stockMinimo: 20, requiereStock: true, productoVence: true, fechaVencimiento: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), activo: true, createdAt: new Date('2024-02-12'), updatedAt: new Date() },
  { id: '9', nombre: 'Coca Cola 1L', categoria: 'gaseosas', precio: 7.00, stock: 50, stockMinimo: 10, requiereStock: true, productoVence: true, fechaVencimiento: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), activo: true, createdAt: new Date('2024-02-15'), updatedAt: new Date() },
  { id: '10', nombre: 'Inca Kola 1L', categoria: 'gaseosas', precio: 7.00, stock: 35, stockMinimo: 10, requiereStock: true, productoVence: true, fechaVencimiento: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), activo: true, createdAt: new Date('2024-02-15'), updatedAt: new Date() },
  { id: '11', nombre: 'Sprite 500ml', categoria: 'gaseosas', precio: 4.00, stock: 0, stockMinimo: 10, requiereStock: true, productoVence: true, fechaVencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), activo: true, createdAt: new Date('2024-02-16'), updatedAt: new Date() },
  { id: '12', nombre: 'Vino Tinto Tacama', categoria: 'vinos', precio: 45.00, stock: 20, stockMinimo: 5, requiereStock: true, productoVence: true, fechaVencimiento: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), activo: false, createdAt: new Date('2024-02-18'), updatedAt: new Date() },
];

// Demo inventory info (fechas de ingreso)
const demoInventoryInfo: ProductInventory[] = [
  { productId: '7', fechaIngreso: new Date('2024-01-10'), ultimoMovimiento: new Date('2024-01-15') },
  { productId: '8', fechaIngreso: new Date('2024-01-11'), ultimoMovimiento: new Date('2024-01-15') },
  { productId: '9', fechaIngreso: new Date('2024-01-12'), ultimoMovimiento: new Date('2024-01-14') },
  { productId: '10', fechaIngreso: new Date('2024-01-12'), ultimoMovimiento: new Date('2024-01-16') },
  { productId: '11', fechaIngreso: new Date('2024-01-16'), ultimoMovimiento: new Date('2024-01-18') },
  { productId: '12', fechaIngreso: new Date('2024-01-18'), ultimoMovimiento: new Date('2024-01-18') },
];

// Demo Kardex movements with price and amount
const demoKardexMovements: KardexMovement[] = [
  { id: 'k1', productId: '7', tipo: 'entrada', cantidad: 50, stockAnterior: 50, stockNuevo: 100, motivo: 'Compra proveedor', fecha: new Date('2024-01-10'), fechaMovimiento: new Date('2024-01-10'), usuario: 'Carlos García', precioUnitario: 5.00, montoTotal: 250.00 },
  { id: 'k2', productId: '7', tipo: 'salida', cantidad: 10, stockAnterior: 100, stockNuevo: 90, motivo: 'Venta', fecha: new Date('2024-01-11'), fechaMovimiento: new Date('2024-01-11'), usuario: 'Sistema' },
  { id: 'k3', productId: '9', tipo: 'entrada', cantidad: 24, stockAnterior: 26, stockNuevo: 50, motivo: 'Reposición', fecha: new Date('2024-01-12'), fechaMovimiento: new Date('2024-01-12'), usuario: 'Ana Torres', precioUnitario: 4.50, montoTotal: 108.00 },
  { id: 'k4', productId: '8', tipo: 'ajuste', cantidad: -5, stockAnterior: 85, stockNuevo: 80, motivo: 'Ajuste inventario - rotura', fecha: new Date('2024-01-15'), fechaMovimiento: new Date('2024-01-15'), usuario: 'Carlos García' },
  { id: 'k5', productId: '10', tipo: 'entrada', cantidad: 12, stockAnterior: 23, stockNuevo: 35, motivo: 'Compra proveedor', fecha: new Date('2024-01-16'), fechaMovimiento: new Date('2024-01-16'), usuario: 'Ana Torres', precioUnitario: 4.50, montoTotal: 54.00 },
  { id: 'k6', productId: '11', tipo: 'salida', cantidad: 20, stockAnterior: 20, stockNuevo: 0, motivo: 'Venta evento', fecha: new Date('2024-01-18'), fechaMovimiento: new Date('2024-01-18'), usuario: 'Sistema' },
  { id: 'k7', productId: '12', tipo: 'entrada', cantidad: 12, stockAnterior: 8, stockNuevo: 20, motivo: 'Compra proveedor', fecha: new Date('2024-01-18'), fechaMovimiento: new Date('2024-01-18'), usuario: 'Ana Torres', precioUnitario: 28.00, montoTotal: 336.00 },
];

interface CategoryConfig {
  id: ProductCategory;
  nombre: string;
  orden: number;
}

const defaultCategorias: CategoryConfig[] = [
  { id: 'pizzas', nombre: 'Pizzas', orden: 1 },
  { id: 'combos', nombre: 'Combos', orden: 2 },
  { id: 'carnes', nombre: 'Carnes', orden: 3 },
  { id: 'menus', nombre: 'Menús', orden: 4 },
  { id: 'gaseosas', nombre: 'Gaseosas', orden: 5 },
  { id: 'cervezas', nombre: 'Cervezas', orden: 6 },
  { id: 'vinos', nombre: 'Vinos', orden: 7 },
  { id: 'postres', nombre: 'Postres', orden: 8 },
  { id: 'cocteles', nombre: 'Cócteles', orden: 9 },
  { id: 'cremoladas', nombre: 'Cremoladas', orden: 10 },
  { id: 'otros', nombre: 'Otros', orden: 11 },
];

function getStockBadge(stock: number, minimo: number) {
  if (stock === 0) return <span className="px-3 py-1 rounded-full text-sm font-bold stock-empty">Sin stock</span>;
  if (stock <= minimo) return <span className="px-3 py-1 rounded-full text-sm font-bold stock-low">{stock}</span>;
  if (stock <= minimo * 2) return <span className="px-3 py-1 rounded-full text-sm font-bold stock-medium">{stock}</span>;
  return <span className="px-3 py-1 rounded-full text-sm font-bold stock-high">{stock}</span>;
}

export default function ProductosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [products, setProducts] = useState<Product[]>(demoProducts);
  const [inventoryInfo, setInventoryInfo] = useState<ProductInventory[]>(demoInventoryInfo);
  const [categorias, setCategorias] = useState<CategoryConfig[]>(defaultCategorias);
  const [kardexMovements, setKardexMovements] = useState<KardexMovement[]>(demoKardexMovements);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCategoryOrderModalOpen, setIsCategoryOrderModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [activeTab, setActiveTab] = useState('productos');
  const [inventoryTab, setInventoryTab] = useState('inventario');
  const [selectedKardexProduct, setSelectedKardexProduct] = useState<string>('all');
  
  // Movement modal state
  const [movementProduct, setMovementProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<'entrada' | 'salida' | 'ajuste'>('entrada');
  const [movementCantidad, setMovementCantidad] = useState('');
  const [movementMotivo, setMovementMotivo] = useState('');
  const [movementPrecioUnitario, setMovementPrecioUnitario] = useState('');
  const [movementFecha, setMovementFecha] = useState(new Date().toISOString().split('T')[0]);
  const [movementFechaVencimiento, setMovementFechaVencimiento] = useState('');
  
  // Form state
  const [formNombre, setFormNombre] = useState('');
  const [formCategoria, setFormCategoria] = useState<ProductCategory>('pizzas');
  const [formPrecio, setFormPrecio] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formStockMinimo, setFormStockMinimo] = useState('');
  const [formRequiereStock, setFormRequiereStock] = useState(false);
  const [formProductoVence, setFormProductoVence] = useState(false);
  const [formFechaVencimiento, setFormFechaVencimiento] = useState('');

  // Get sorted categories
  const sortedCategorias = [...categorias].sort((a, b) => a.orden - b.orden);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormNombre(product.nombre);
      setFormCategoria(product.categoria);
      setFormPrecio(product.precio.toString());
      setFormStock(product.stock.toString());
      setFormStockMinimo(product.stockMinimo.toString());
      setFormRequiereStock(product.requiereStock);
      setFormProductoVence(product.productoVence);
      setFormFechaVencimiento(product.fechaVencimiento ? product.fechaVencimiento.toISOString().split('T')[0] : '');
    } else {
      setEditingProduct(null);
      setFormNombre('');
      setFormCategoria('pizzas');
      setFormPrecio('');
      setFormStock('');
      setFormStockMinimo('5');
      setFormRequiereStock(false);
      setFormProductoVence(false);
      setFormFechaVencimiento('');
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingProduct) {
      setProducts(products.map(p => 
        p.id === editingProduct.id 
          ? { 
              ...p, 
              nombre: formNombre,
              categoria: formCategoria,
              precio: parseFloat(formPrecio),
              stock: parseInt(formStock) || 0,
              stockMinimo: parseInt(formStockMinimo) || 0,
              requiereStock: formRequiereStock,
              productoVence: formProductoVence,
              fechaVencimiento: formProductoVence && formFechaVencimiento ? new Date(formFechaVencimiento) : undefined,
              updatedAt: new Date()
            }
          : p
      ));
      toast.success('Producto actualizado');
    } else {
      const newProduct: Product = {
        id: crypto.randomUUID(),
        nombre: formNombre,
        categoria: formCategoria,
        precio: parseFloat(formPrecio),
        stock: formRequiereStock ? parseInt(formStock) : 0,
        stockMinimo: formRequiereStock ? parseInt(formStockMinimo) : 0,
        requiereStock: formRequiereStock,
        productoVence: formProductoVence,
        fechaVencimiento: formProductoVence && formFechaVencimiento ? new Date(formFechaVencimiento) : undefined,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setProducts([...products, newProduct]);
      toast.success('Producto creado');
    }
    setIsModalOpen(false);
  };

  const handleToggleActive = (product: Product) => {
    setProducts(products.map(p => 
      p.id === product.id ? { ...p, activo: !p.activo } : p
    ));
    toast.success(product.activo ? 'Producto desactivado' : 'Producto activado');
  };

  const handleDelete = (product: Product) => {
    setProducts(products.filter(p => p.id !== product.id));
    toast.success('Producto eliminado');
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Ingrese un nombre para la categoría');
      return;
    }
    const categoryId = newCategoryName.toLowerCase().replace(/\s+/g, '_') as ProductCategory;
    if (categorias.find(c => c.id === categoryId)) {
      toast.error('La categoría ya existe');
      return;
    }
    const maxOrden = Math.max(...categorias.map(c => c.orden));
    setCategorias([...categorias, { id: categoryId, nombre: newCategoryName, orden: maxOrden + 1 }]);
    setNewCategoryName('');
    setIsCategoryModalOpen(false);
    toast.success('Categoría creada', { position: 'top-center' });
  };

  const handleMoveCategoryUp = (categoryId: ProductCategory) => {
    const category = categorias.find(c => c.id === categoryId);
    if (!category) return;
    const prevCategory = categorias.find(c => c.orden === category.orden - 1);
    if (!prevCategory) return;
    
    setCategorias(categorias.map(c => {
      if (c.id === categoryId) return { ...c, orden: c.orden - 1 };
      if (c.id === prevCategory.id) return { ...c, orden: c.orden + 1 };
      return c;
    }));
  };

  const handleMoveCategoryDown = (categoryId: ProductCategory) => {
    const category = categorias.find(c => c.id === categoryId);
    if (!category) return;
    const nextCategory = categorias.find(c => c.orden === category.orden + 1);
    if (!nextCategory) return;
    
    setCategorias(categorias.map(c => {
      if (c.id === categoryId) return { ...c, orden: c.orden + 1 };
      if (c.id === nextCategory.id) return { ...c, orden: c.orden - 1 };
      return c;
    }));
  };

  // Open movement modal
  const handleOpenMovementModal = (product: Product, type: 'entrada' | 'salida' | 'ajuste') => {
    setMovementProduct(product);
    setMovementType(type);
    setMovementCantidad('');
    setMovementMotivo(type === 'entrada' ? 'Compra proveedor' : type === 'salida' ? 'Venta' : 'Ajuste inventario');
    setMovementPrecioUnitario('');
    setMovementFecha(new Date().toISOString().split('T')[0]);
    setMovementFechaVencimiento('');
    setIsMovementModalOpen(true);
  };

  // Save movement
  const handleSaveMovement = () => {
    if (!movementProduct || !movementCantidad) return;

    const cantidad = parseInt(movementCantidad);
    const precioUnit = parseFloat(movementPrecioUnitario) || 0;
    const stockAnterior = movementProduct.stock;
    let stockNuevo = stockAnterior;

    if (movementType === 'entrada') {
      stockNuevo = stockAnterior + cantidad;
    } else if (movementType === 'salida') {
      stockNuevo = Math.max(0, stockAnterior - cantidad);
    } else {
      stockNuevo = cantidad; // ajuste directo
    }

    // Create movement
    const newMovement: KardexMovement = {
      id: crypto.randomUUID(),
      productId: movementProduct.id,
      tipo: movementType,
      cantidad: movementType === 'ajuste' ? cantidad - stockAnterior : cantidad,
      stockAnterior,
      stockNuevo,
      motivo: movementMotivo,
      fecha: new Date(),
      fechaMovimiento: new Date(movementFecha),
      usuario: 'Usuario Actual',
      precioUnitario: movementType === 'entrada' ? precioUnit : undefined,
      montoTotal: movementType === 'entrada' ? precioUnit * cantidad : undefined,
    };

    setKardexMovements([newMovement, ...kardexMovements]);

    // Update product stock and expiration date if provided
    setProducts(products.map(p => {
      if (p.id === movementProduct.id) {
        const updates: Partial<Product> = { stock: stockNuevo, updatedAt: new Date() };
        // Si es ingreso y se proporcionó fecha de vencimiento, actualizar
        if (movementType === 'entrada' && movementFechaVencimiento) {
          updates.fechaVencimiento = new Date(movementFechaVencimiento);
          updates.productoVence = true;
        }
        return { ...p, ...updates };
      }
      return p;
    }));

    // Update inventory info
    const existingInfo = inventoryInfo.find(i => i.productId === movementProduct.id);
    if (existingInfo) {
      setInventoryInfo(inventoryInfo.map(i => 
        i.productId === movementProduct.id 
          ? { ...i, ultimoMovimiento: new Date(movementFecha), fechaIngreso: movementType === 'entrada' && !existingInfo ? new Date(movementFecha) : i.fechaIngreso }
          : i
      ));
    } else {
      setInventoryInfo([...inventoryInfo, {
        productId: movementProduct.id,
        fechaIngreso: new Date(movementFecha),
        ultimoMovimiento: new Date(movementFecha)
      }]);
    }

    setIsMovementModalOpen(false);
    toast.success(`${movementType === 'entrada' ? 'Ingreso' : movementType === 'salida' ? 'Salida' : 'Ajuste'} registrado`, { position: 'top-center' });
  };

  // Products with stock
  const productsWithStock = products.filter(p => p.requiereStock);

  // Filtered products with stock for inventory tab
  const filteredInventoryProducts = productsWithStock.filter(p =>
    p.nombre.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  // Inventory stats
  const stockNormalCount = productsWithStock.filter(p => p.stock > p.stockMinimo).length;
  const stockBajoCount = productsWithStock.filter(p => p.stock > 0 && p.stock <= p.stockMinimo).length;
  const sinStockCount = productsWithStock.filter(p => p.stock === 0).length;

  // Filtered kardex
  const filteredKardex = kardexMovements.filter(m => 
    selectedKardexProduct === 'all' || m.productId === selectedKardexProduct
  ).sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-pos-2xl font-bold">Productos</h1>
            <p className="text-muted-foreground">Gestiona tu catálogo de productos</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="btn-pos" onClick={() => setIsCategoryOrderModalOpen(true)}>
              <Settings2 className="h-5 w-5 mr-2" />
              Ordenar Categorías
            </Button>
            <Button variant="outline" className="btn-pos" onClick={() => setIsCategoryModalOpen(true)}>
              <FolderPlus className="h-5 w-5 mr-2" />
              Nueva Categoría
            </Button>
            <Button className="btn-pos" onClick={() => handleOpenModal()}>
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        </div>

        {/* Tabs for Products and Inventory */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="h-14 p-1 bg-muted rounded-xl">
            <TabsTrigger value="productos" className="h-12 px-6 text-pos-base font-semibold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Package className="h-5 w-5 mr-2" />
              Productos
            </TabsTrigger>
            <TabsTrigger value="inventario" className="h-12 px-6 text-pos-base font-semibold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Archive className="h-5 w-5 mr-2" />
              Inventario y Kardex
            </TabsTrigger>
          </TabsList>

          <TabsContent value="productos" className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="col-span-3 border-2">
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 h-12 text-pos-base rounded-xl"
                    />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="p-4">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-12 text-pos-base rounded-xl">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {sortedCategorias.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>

            {/* Category buttons - Larger and sortable */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-6 py-3 rounded-xl font-bold text-lg transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                Todos ({products.length})
              </button>
              {sortedCategorias.map(cat => {
                const count = products.filter(p => p.categoria === cat.id).length;
                if (count === 0) return null;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-6 py-3 rounded-xl font-bold text-lg transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {cat.nombre} ({count})
                  </button>
                );
              })}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="border-2 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{products.length}</p>
                  <p className="text-sm text-muted-foreground">Total productos</p>
                </div>
              </Card>
              <Card className="border-2 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">{products.filter(p => p.activo).length}</p>
                  <p className="text-sm text-muted-foreground">Activos</p>
                </div>
              </Card>
              <Card className="border-2 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-warning">{products.filter(p => p.stock <= p.stockMinimo && p.stock > 0 && p.requiereStock).length}</p>
                  <p className="text-sm text-muted-foreground">Stock bajo</p>
                </div>
              </Card>
              <Card className="border-2 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-destructive">{products.filter(p => p.stock === 0 && p.requiereStock).length}</p>
                  <p className="text-sm text-muted-foreground">Sin stock</p>
                </div>
              </Card>
            </div>

            {/* Products Table */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Lista de Productos ({filteredProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-pos-base font-bold">Nombre</TableHead>
                      <TableHead className="text-pos-base font-bold">Categoría</TableHead>
                      <TableHead className="text-pos-base font-bold">Precio</TableHead>
                      <TableHead className="text-pos-base font-bold">Req. Stock</TableHead>
                      <TableHead className="text-pos-base font-bold">Stock</TableHead>
                      <TableHead className="text-pos-base font-bold">Estado</TableHead>
                      <TableHead className="text-pos-base font-bold text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id} className="hover:bg-muted/50">
                        <TableCell className="font-semibold text-pos-base">{product.nombre}</TableCell>
                        <TableCell className="capitalize">{product.categoria}</TableCell>
                        <TableCell className="font-bold text-primary">S/ {product.precio.toFixed(2)}</TableCell>
                        <TableCell>
                          {product.requiereStock ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              <Archive className="h-3 w-3" />
                              Sí
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-muted text-muted-foreground">
                              No
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {product.requiereStock 
                            ? getStockBadge(product.stock, product.stockMinimo)
                            : <span className="text-muted-foreground">N/A</span>
                          }
                        </TableCell>
                        <TableCell>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            product.activo 
                              ? 'bg-success/10 text-success' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {product.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10"
                              onClick={() => handleOpenModal(product)}
                            >
                              <Edit className="h-5 w-5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10"
                              onClick={() => handleToggleActive(product)}
                            >
                              {product.activo ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(product)}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventario" className="space-y-6">
            {/* Inner tabs for Inventario and Kardex */}
            <Tabs value={inventoryTab} onValueChange={setInventoryTab}>
              <div className="flex items-center justify-between">
                <TabsList className="h-12 p-1 bg-muted rounded-xl">
                  <TabsTrigger value="inventario" className="h-10 px-6 text-pos-base font-semibold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Archive className="h-5 w-5 mr-2" />
                    Inventario
                  </TabsTrigger>
                  <TabsTrigger value="kardex" className="h-10 px-6 text-pos-base font-semibold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Kardex / Movimientos
                  </TabsTrigger>
                </TabsList>
                <div className="flex gap-2">
                  {stockBajoCount > 0 && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-warning/10 text-warning rounded-lg font-semibold">
                      <AlertTriangle className="h-4 w-4" />
                      {stockBajoCount} con stock bajo
                    </span>
                  )}
                  {sinStockCount > 0 && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg font-semibold">
                      <AlertTriangle className="h-4 w-4" />
                      {sinStockCount} sin stock
                    </span>
                  )}
                </div>
              </div>

              {/* Inventario Tab Content */}
              <TabsContent value="inventario" className="space-y-6 mt-6">
                {/* Search */}
                <Card className="border-2">
                  <CardContent className="p-4">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder="Buscar productos..."
                        value={inventorySearch}
                        onChange={(e) => setInventorySearch(e.target.value)}
                        className="pl-12 h-12 text-pos-base rounded-xl"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <Card className="border-2 p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{productsWithStock.length}</p>
                      <p className="text-sm text-muted-foreground">Total productos</p>
                    </div>
                  </Card>
                  <Card className="border-2 p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-success">{stockNormalCount}</p>
                      <p className="text-sm text-muted-foreground">Stock normal</p>
                    </div>
                  </Card>
                  <Card className="border-2 p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-warning">{stockBajoCount}</p>
                      <p className="text-sm text-muted-foreground">Stock bajo</p>
                    </div>
                  </Card>
                  <Card className="border-2 p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-destructive">{sinStockCount}</p>
                      <p className="text-sm text-muted-foreground">Sin stock</p>
                    </div>
                  </Card>
                </div>

                {/* Products List */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Archive className="h-5 w-5" />
                      Lista de Productos ({filteredInventoryProducts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bold">Producto</TableHead>
                          <TableHead className="font-bold">Categoría</TableHead>
                          <TableHead className="font-bold">Stock</TableHead>
                          <TableHead className="font-bold">Mín / Máx</TableHead>
                          <TableHead className="font-bold">Fecha Ingreso</TableHead>
                          <TableHead className="font-bold">Últ. Movimiento</TableHead>
                          <TableHead className="font-bold text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInventoryProducts.map((product) => {
                          const info = inventoryInfo.find(i => i.productId === product.id);
                          return (
                            <TableRow key={product.id}>
                              <TableCell className="font-semibold">{product.nombre}</TableCell>
                              <TableCell className="capitalize text-muted-foreground">{product.categoria}</TableCell>
                              <TableCell>{getStockBadge(product.stock, product.stockMinimo)}</TableCell>
                              <TableCell>{product.stockMinimo} / {product.stockMinimo * 5}</TableCell>
                              <TableCell className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {info?.fechaIngreso.toLocaleDateString('es-PE') || '-'}
                              </TableCell>
                              <TableCell className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {info?.ultimoMovimiento.toLocaleDateString('es-PE') || '-'}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    className="h-9 px-3 bg-success hover:bg-success/90 text-white"
                                    onClick={() => handleOpenMovementModal(product, 'entrada')}
                                  >
                                    <ArrowDownCircle className="h-4 w-4 mr-1" />
                                    Ingreso
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-9 px-3 bg-destructive hover:bg-destructive/90 text-white"
                                    onClick={() => handleOpenMovementModal(product, 'salida')}
                                  >
                                    <ArrowUpCircle className="h-4 w-4 mr-1" />
                                    Salida
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 px-3"
                                    onClick={() => handleOpenMovementModal(product, 'ajuste')}
                                  >
                                    <RefreshCw className="h-4 w-4 mr-1" />
                                    Ajuste
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Kardex Tab Content */}
              <TabsContent value="kardex" className="space-y-6 mt-6">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Kardex - Movimientos
                      </span>
                      <Select value={selectedKardexProduct} onValueChange={setSelectedKardexProduct}>
                        <SelectTrigger className="w-56">
                          <SelectValue placeholder="Filtrar producto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los productos</SelectItem>
                          {productsWithStock.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha Mov.</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Cant.</TableHead>
                          <TableHead>P. Unit.</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Motivo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredKardex.map((mov) => {
                          const product = products.find(p => p.id === mov.productId);
                          return (
                            <TableRow key={mov.id}>
                              <TableCell className="text-sm">
                                <p className="font-medium">{mov.fechaMovimiento.toLocaleDateString('es-PE')}</p>
                              </TableCell>
                              <TableCell className="font-medium">{product?.nombre}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  mov.tipo === 'entrada' ? 'bg-success/10 text-success' :
                                  mov.tipo === 'salida' ? 'bg-destructive/10 text-destructive' :
                                  'bg-warning/10 text-warning'
                                }`}>
                                  {mov.tipo.charAt(0).toUpperCase() + mov.tipo.slice(1)}
                                </span>
                              </TableCell>
                              <TableCell className={`font-bold ${
                                mov.tipo === 'entrada' ? 'text-success' : 
                                mov.tipo === 'salida' ? 'text-destructive' : ''
                              }`}>
                                {mov.tipo === 'entrada' ? '+' : mov.tipo === 'salida' ? '-' : ''}{Math.abs(mov.cantidad)}
                              </TableCell>
                              <TableCell>
                                {mov.precioUnitario ? (
                                  <span className="font-medium">S/ {mov.precioUnitario.toFixed(2)}</span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {mov.montoTotal ? (
                                  <span className="font-bold text-primary">S/ {mov.montoTotal.toFixed(2)}</span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm">
                                {mov.stockAnterior} → <span className="font-bold">{mov.stockNuevo}</span>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{mov.motivo}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        {/* Movement Modal */}
        <Dialog open={isMovementModalOpen} onOpenChange={setIsMovementModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-pos-xl flex items-center gap-2">
                {movementType === 'entrada' && <ArrowDownCircle className="h-6 w-6 text-success" />}
                {movementType === 'salida' && <ArrowUpCircle className="h-6 w-6 text-destructive" />}
                {movementType === 'ajuste' && <RefreshCw className="h-6 w-6 text-warning" />}
                {movementType === 'entrada' ? 'Registrar Ingreso' : movementType === 'salida' ? 'Registrar Salida' : 'Ajuste de Stock'}
              </DialogTitle>
            </DialogHeader>
            {movementProduct && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-xl">
                  <p className="font-semibold text-lg">{movementProduct.nombre}</p>
                  <p className="text-muted-foreground">Stock actual: <span className="font-bold text-foreground">{movementProduct.stock}</span></p>
                </div>

                <div className="space-y-2">
                  <label className="text-pos-base font-semibold">Fecha del movimiento</label>
                  <Input
                    type="date"
                    value={movementFecha}
                    onChange={(e) => setMovementFecha(e.target.value)}
                    className="h-12 text-pos-base rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-pos-base font-semibold">
                    {movementType === 'ajuste' ? 'Nuevo stock' : 'Cantidad'}
                  </label>
                  <Input
                    type="number"
                    value={movementCantidad}
                    onChange={(e) => setMovementCantidad(e.target.value)}
                    placeholder={movementType === 'ajuste' ? 'Nuevo stock' : '0'}
                    className="h-12 text-pos-base rounded-xl"
                  />
                </div>

                {movementType === 'entrada' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-pos-base font-semibold">Precio Unitario (S/)</label>
                      <Input
                        type="number"
                        value={movementPrecioUnitario}
                        onChange={(e) => setMovementPrecioUnitario(e.target.value)}
                        placeholder="0.00"
                        className="h-12 text-pos-base rounded-xl"
                      />
                      {movementCantidad && movementPrecioUnitario && (
                        <p className="text-sm text-muted-foreground">
                          Monto total: <span className="font-bold text-primary">S/ {(parseFloat(movementCantidad) * parseFloat(movementPrecioUnitario)).toFixed(2)}</span>
                        </p>
                      )}
                    </div>
                    
                    {/* Fecha de vencimiento para ingreso */}
                    <div className="space-y-2">
                      <label className="text-pos-base font-semibold flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Fecha de Vencimiento (opcional)
                      </label>
                      <Input
                        type="date"
                        value={movementFechaVencimiento}
                        onChange={(e) => setMovementFechaVencimiento(e.target.value)}
                        className="h-12 text-pos-base rounded-xl"
                      />
                      <p className="text-xs text-muted-foreground">
                        Si el lote tiene fecha de vencimiento, ingrésala aquí
                      </p>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label className="text-pos-base font-semibold">Motivo</label>
                  <Input
                    value={movementMotivo}
                    onChange={(e) => setMovementMotivo(e.target.value)}
                    placeholder="Motivo del movimiento"
                    className="h-12 text-pos-base rounded-xl"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1 btn-pos" onClick={() => setIsMovementModalOpen(false)}>
                    <X className="h-5 w-5 mr-2" />
                    Cancelar
                  </Button>
                  <Button 
                    className={`flex-1 btn-pos ${
                      movementType === 'entrada' ? 'bg-success' : 
                      movementType === 'salida' ? 'bg-destructive' : 
                      'bg-warning'
                    }`}
                    onClick={handleSaveMovement}
                    disabled={!movementCantidad}
                  >
                    <Check className="h-5 w-5 mr-2" />
                    Guardar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Product Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-pos-xl flex items-center gap-2">
                <Package className="h-6 w-6" />
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-pos-base font-semibold">Nombre</label>
                <Input
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Nombre del producto"
                  className="h-12 text-pos-base rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-pos-base font-semibold">Categoría</label>
                <Select value={formCategoria} onValueChange={(v) => setFormCategoria(v as ProductCategory)}>
                  <SelectTrigger className="h-12 text-pos-base rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Requiere Stock Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Archive className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">¿Requiere control de stock?</p>
                    <p className="text-sm text-muted-foreground">
                      Activa para bebidas/insumos. Desactiva para pizzas/menús preparados.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormRequiereStock(!formRequiereStock)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    formRequiereStock ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      formRequiereStock ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Producto Vence Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">¿El producto vence?</p>
                    <p className="text-sm text-muted-foreground">
                      Activa si el producto tiene fecha de vencimiento
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormProductoVence(!formProductoVence)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    formProductoVence ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      formProductoVence ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Fecha de vencimiento si aplica */}
              {formProductoVence && (
                <div className="space-y-2">
                  <label className="text-pos-base font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Fecha de Vencimiento
                  </label>
                  <Input
                    type="date"
                    value={formFechaVencimiento}
                    onChange={(e) => setFormFechaVencimiento(e.target.value)}
                    className="h-12 text-pos-base rounded-xl"
                  />
                </div>
              )}

              {formRequiereStock && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-pos-base font-semibold">Precio (S/)</label>
                    <Input
                      type="number"
                      value={formPrecio}
                      onChange={(e) => setFormPrecio(e.target.value)}
                      placeholder="0.00"
                      className="h-12 text-pos-base rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-pos-base font-semibold">Stock actual</label>
                    <Input
                      type="number"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      placeholder="0"
                      className="h-12 text-pos-base rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-pos-base font-semibold">Stock mínimo</label>
                    <Input
                      type="number"
                      value={formStockMinimo}
                      onChange={(e) => setFormStockMinimo(e.target.value)}
                      placeholder="5"
                      className="h-12 text-pos-base rounded-xl"
                    />
                  </div>
                </div>
              )}

              {!formRequiereStock && (
                <div className="space-y-2">
                  <label className="text-pos-base font-semibold">Precio (S/)</label>
                  <Input
                    type="number"
                    value={formPrecio}
                    onChange={(e) => setFormPrecio(e.target.value)}
                    placeholder="0.00"
                    className="h-12 text-pos-base rounded-xl"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 btn-pos" onClick={() => setIsModalOpen(false)}>
                  <X className="h-5 w-5 mr-2" />
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 btn-pos bg-success"
                  onClick={handleSave}
                  disabled={!formNombre || !formPrecio}
                >
                  <Check className="h-5 w-5 mr-2" />
                  {editingProduct ? 'Guardar' : 'Crear'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Category Modal */}
        <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-pos-xl flex items-center gap-2">
                <FolderPlus className="h-6 w-6" />
                Nueva Categoría
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-pos-base font-semibold">Nombre de la categoría</label>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ej: Entradas, Sopas, Ensaladas..."
                  className="h-12 text-pos-base rounded-xl"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 btn-pos" onClick={() => setIsCategoryModalOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 btn-pos bg-primary"
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim()}
                >
                  <FolderPlus className="h-5 w-5 mr-2" />
                  Crear Categoría
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Category Order Modal */}
        <Dialog open={isCategoryOrderModalOpen} onOpenChange={setIsCategoryOrderModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-pos-xl flex items-center gap-2">
                <Settings2 className="h-6 w-6" />
                Ordenar Categorías
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-96 overflow-auto">
              {sortedCategorias.map((cat, idx) => (
                <div key={cat.id} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <span className="flex-1 font-semibold">{cat.nombre}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMoveCategoryUp(cat.id)}
                    disabled={idx === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMoveCategoryDown(cat.id)}
                    disabled={idx === sortedCategorias.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button className="w-full btn-pos" onClick={() => {
              setIsCategoryOrderModalOpen(false);
              toast.success('Orden guardado', { position: 'top-center' });
            }}>
              <Check className="h-5 w-5 mr-2" />
              Guardar Orden
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
