import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Package, Eye, EyeOff, FolderPlus, Check, X, Calendar, ArrowUpDown, AlertTriangle, Clock, ChefHat } from 'lucide-react';
import { ExportDropdown } from '@/components/shared/ExportDropdown';
import { exportToExcel, exportToPDF, exportChartsToPDF } from '@/utils/exportUtils';
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
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  useCategories,
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useCreateCategory,
  useUpdateCategory,
  Category,
  Product,
} from '@/hooks/useProducts';
import { CategoryIconPicker } from '@/components/pos/CategoryIconPicker';
import { useProductStock, useProductStockMoves, useCreateProductStockMove, useProductExpirationDates } from '@/hooks/useProductInventory';
import { useStores } from '@/hooks/useStores';
import { useAuth } from '@/contexts/AuthContext';
import { RecipeEditor } from '@/components/productos/RecipeEditor';
import { useProductRecipe } from '@/hooks/useRecipes';

export default function ProductosPage() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedProductForStock, setSelectedProductForStock] = useState<Product | null>(null);
  const [recipeProductId, setRecipeProductId] = useState<string | null>(null);
  const [recipeProductName, setRecipeProductName] = useState('');
  const [recipeProductPrice, setRecipeProductPrice] = useState(0);

  // Form state for products
  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<string>('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formTrackStock, setFormTrackStock] = useState(false);
  const [formActive, setFormActive] = useState(true);
  const [formExpires, setFormExpires] = useState(false);
  const [formExpirationDate, setFormExpirationDate] = useState('');
  const [formEntryDate, setFormEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [formMinStock, setFormMinStock] = useState('5');
  const [formCostPrice, setFormCostPrice] = useState('');

  // Stock movement form
  const [stockMoveType, setStockMoveType] = useState<'purchase' | 'adjustment' | 'waste'>('purchase');
  const [stockMoveQuantity, setStockMoveQuantity] = useState('');
  const [stockMoveNotes, setStockMoveNotes] = useState('');
  const [stockMoveCost, setStockMoveCost] = useState('');
  const [stockMoveExpires, setStockMoveExpires] = useState(false);
  const [stockMoveExpirationDate, setStockMoveExpirationDate] = useState('');

  // Category form
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');
  const [newCategoryIcon, setNewCategoryIcon] = useState('package');
  const [newCategoryHasRecipes, setNewCategoryHasRecipes] = useState(false);

  // Fetch data
  const { data: categories = [], isLoading: loadingCategories } = useCategories(true);
  const { data: products = [], isLoading: loadingProducts } = useProducts(true);
  const { data: stores = [] } = useStores();
  const { data: productStock = [], isLoading: loadingStock } = useProductStock(selectedStoreId || undefined);
  const { data: stockMoves = [], isLoading: loadingMoves } = useProductStockMoves(
    selectedProductForStock?.id,
    selectedStoreId || undefined
  );
  const { data: expirationDatesMap } = useProductExpirationDates(selectedStoreId || undefined);

  useEffect(() => {
    if (!selectedStoreId && stores.length > 0) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  // Get nearest expiration date for a product from stock moves
  const getNearestExpiration = (productId: string) => {
    return expirationDatesMap?.get(productId) || null;
  };

  // Calculate days until expiration (negative = already expired)
  const getDaysUntilExpiration = (expirationDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expirationDate);
    expDate.setHours(0, 0, 0, 0);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Format days message
  const formatDaysMessage = (days: number) => {
    if (days < 0) {
      return `Venció hace ${Math.abs(days)} día${Math.abs(days) !== 1 ? 's' : ''}`;
    } else if (days === 0) {
      return 'Vence hoy';
    } else if (days === 1) {
      return 'Vence mañana';
    } else {
      return `Vence en ${days} días`;
    }
  };

  // Mutations
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const createStockMove = useCreateProductStockMove();

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get stock for a product
  const getProductStock = (productId: string) => {
    const stock = productStock.find(s => s.product_id === productId);
    return stock?.quantity || 0;
  };

  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormName(product.name);
      setFormCategoryId(product.category_id || '');
      setFormDescription(product.description || '');
      setFormPrice(product.base_price.toString());
      setFormTrackStock(product.track_stock);
      setFormActive(product.active);
      setFormExpires((product as any).expires || false);
      setFormExpirationDate((product as any).expiration_date || '');
      setFormEntryDate((product as any).entry_date || new Date().toISOString().split('T')[0]);
      setFormMinStock(((product as any).min_stock || 5).toString());
      setFormCostPrice((product as any).cost_price ? String((product as any).cost_price) : '');
    } else {
      setEditingProduct(null);
      setFormName('');
      setFormCategoryId(categories[0]?.id || '');
      setFormDescription('');
      setFormPrice('');
      setFormTrackStock(false);
      setFormActive(true);
      setFormExpires(false);
      setFormExpirationDate('');
      setFormEntryDate(new Date().toISOString().split('T')[0]);
      setFormMinStock('5');
      setFormCostPrice('');
    }
    setIsProductModalOpen(true);
  };

  const handleOpenStockModal = (product: Product) => {
    setSelectedProductForStock(product);
    setStockMoveType('purchase');
    setStockMoveQuantity('');
    setStockMoveNotes('');
    setStockMoveCost('');
    // Si el producto está marcado como que vence, preactivar el switch
    setStockMoveExpires(!!(product as any)?.expires);
    setStockMoveExpirationDate('');
    setIsStockModalOpen(true);
  };

  const handleOpenStockEntryModal = () => {
    // Ingreso general (sin producto preseleccionado)
    setSelectedProductForStock(null);
    setStockMoveType('purchase');
    setStockMoveQuantity('');
    setStockMoveNotes('');
    setStockMoveCost('');
    setStockMoveExpires(false);
    setStockMoveExpirationDate('');
    setIsStockModalOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!formName.trim() || !formPrice) {
      toast.error('Complete los campos requeridos');
      return;
    }

    // Validar nombre duplicado
    const duplicateExists = products.some(
      (p) =>
        p.name.trim().toLowerCase() === formName.trim().toLowerCase() &&
        p.id !== editingProduct?.id
    );

    if (duplicateExists) {
      toast.error('Ya existe un producto con ese nombre', {
        description: `"${formName.trim()}" ya está registrado. Use otro nombre.`,
      });
      return;
    }

    try {
      const productData = {
        name: formName,
        category_id: formCategoryId || null,
        description: formDescription || null,
        base_price: parseFloat(formPrice),
        track_stock: formTrackStock,
        active: formActive,
        min_stock: formTrackStock ? Number(formMinStock || 5) : 5,
        entry_date: formTrackStock ? (formEntryDate || null) : null,
        expires: formTrackStock ? formExpires : false,
        expiration_date: formTrackStock && formExpires ? (formExpirationDate || null) : null,
        cost_price: formCostPrice ? parseFloat(formCostPrice) : 0,
      };

      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          ...productData,
        });
        toast.success('Producto actualizado');
      } else {
        await createProduct.mutateAsync(productData);
        toast.success('Producto creado');
      }
      setIsProductModalOpen(false);
    } catch (error: any) {
      toast.error('Error al guardar producto', { description: error.message });
    }
  };

  const handleSaveStockMove = async () => {
    if (!selectedProductForStock || !stockMoveQuantity) {
      toast.error('Complete los campos requeridos');
      return;
    }

    const parsedQty = parseFloat(stockMoveQuantity);
    if (Number.isNaN(parsedQty) || parsedQty <= 0) {
      toast.error('Ingrese una cantidad válida');
      return;
    }

    if (stockMoveType === 'purchase' && stockMoveExpires && !stockMoveExpirationDate) {
      toast.error('Ingrese la fecha de vencimiento');
      return;
    }

    // Store scope (critical for correct stock)
    const storeId = selectedStoreId || stores[0]?.id;
    if (!storeId) {
      toast.error('No hay tiendas configuradas. Por favor, cree una tienda primero.');
      return;
    }

    try {
      const quantity = parsedQty;
      const finalQuantity = stockMoveType === 'waste' ? -Math.abs(quantity) : Math.abs(quantity);

      await createStockMove.mutateAsync({
        product_id: selectedProductForStock.id,
        store_id: storeId,
        move_type: stockMoveType,
        quantity: finalQuantity,
        unit_cost: stockMoveCost ? parseFloat(stockMoveCost) : undefined,
        notes: stockMoveNotes || undefined,
        user_id: user?.id,
        expiration_date: stockMoveExpires && stockMoveExpirationDate ? stockMoveExpirationDate : undefined,
      });

      toast.success('Movimiento registrado');
      setIsStockModalOpen(false);
    } catch (error: any) {
      toast.error('Error al registrar movimiento', { description: error.message });
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        active: !product.active,
      });
      toast.success(product.active ? 'Producto desactivado' : 'Producto activado');
    } catch (error: any) {
      toast.error('Error al actualizar producto', { description: error.message });
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      await deleteProduct.mutateAsync(product.id);
      toast.success('Producto eliminado');
    } catch (error: any) {
      toast.error('Error al eliminar producto', { description: error.message });
    }
  };

  const handleOpenCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setNewCategoryName(category.name);
      setNewCategoryColor(category.color || '#3b82f6');
      setNewCategoryIcon(category.icon || 'package');
      setNewCategoryHasRecipes(category.has_recipes ?? false);
    } else {
      setEditingCategory(null);
      setNewCategoryName('');
      setNewCategoryColor('#3b82f6');
      setNewCategoryIcon('package');
      setNewCategoryHasRecipes(false);
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Ingrese un nombre para la categoría');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          name: newCategoryName,
          color: newCategoryColor,
          icon: newCategoryIcon,
          has_recipes: newCategoryHasRecipes,
        });
        toast.success('Categoría actualizada');
      } else {
        await createCategory.mutateAsync({
          name: newCategoryName,
          color: newCategoryColor,
          icon: newCategoryIcon,
          sort_order: categories.length + 1,
          has_recipes: newCategoryHasRecipes,
        });
        toast.success('Categoría creada');
      }
      setNewCategoryName('');
      setNewCategoryIcon('package');
      setEditingCategory(null);
      setIsCategoryModalOpen(false);
    } catch (error: any) {
      toast.error('Error al guardar categoría', { description: error.message });
    }
  };

  const getMoveTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      purchase: 'Compra/Ingreso',
      sale: 'Venta',
      adjustment: 'Ajuste',
      waste: 'Merma',
      return: 'Devolución',
    };
    return labels[type] || type;
  };

  const getMoveTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      purchase: 'bg-success/10 text-success',
      sale: 'bg-primary/10 text-primary',
      adjustment: 'bg-warning/10 text-warning',
      waste: 'bg-destructive/10 text-destructive',
      return: 'bg-accent/10 text-accent',
    };
    return colors[type] || 'bg-muted';
  };

  // === EXPORT HANDLERS ===
  const handleExportProductsExcel = useCallback(() => {
    exportToExcel({
      title: 'Lista de Productos',
      subtitle: `Total: ${filteredProducts.length} productos`,
      headers: ['Producto', 'Descripción', 'Categoría', 'Precio', 'Stock', 'Estado'],
      rows: filteredProducts.map(p => [
        p.name,
        p.description || '',
        p.category?.name || 'Sin categoría',
        `S/ ${Number(p.base_price).toFixed(2)}`,
        p.track_stock ? getProductStock(p.id) : '-',
        p.active ? 'Activo' : 'Inactivo',
      ]),
    }, 'productos');
  }, [filteredProducts, productStock]);

  const handleExportProductsPDF = useCallback(() => {
    exportToPDF({
      title: 'Lista de Productos',
      subtitle: `Total: ${filteredProducts.length} productos`,
      headers: ['Producto', 'Descripción', 'Categoría', 'Precio', 'Stock', 'Estado'],
      rows: filteredProducts.map(p => [
        p.name,
        p.description || '',
        p.category?.name || 'Sin categoría',
        `S/ ${Number(p.base_price).toFixed(2)}`,
        p.track_stock ? getProductStock(p.id) : '-',
        p.active ? 'Activo' : 'Inactivo',
      ]),
    }, 'productos');
  }, [filteredProducts, productStock]);

  const handleExportProductsDesignPDF = useCallback(async () => {
    await exportChartsToPDF('#products-table-container', 'Lista de Productos', `Total: ${filteredProducts.length} productos`, 'productos-diseño');
  }, [filteredProducts]);

  const handleExportInventoryExcel = useCallback(() => {
    const inventoryProducts = products.filter(p => p.track_stock);
    exportToExcel({
      title: 'Inventario de Productos',
      subtitle: `Total: ${inventoryProducts.length} productos`,
      headers: ['Producto', 'Stock Actual', 'Stock Mínimo', 'Fecha Ingreso', 'Fecha Vencimiento', 'Estado'],
      rows: inventoryProducts.map(p => {
        const stock = getProductStock(p.id);
        const minStock = (p as any).min_stock || 5;
        const nearestExp = getNearestExpiration(p.id);
        const daysLeft = nearestExp ? getDaysUntilExpiration(nearestExp) : null;
        const isExpired = daysLeft !== null && daysLeft < 0;
        const isLowStock = stock <= minStock;
        return [
          p.name,
          stock,
          minStock,
          (p as any).entry_date ? new Date((p as any).entry_date).toLocaleDateString('es-PE') : '-',
          nearestExp ? new Date(nearestExp).toLocaleDateString('es-PE') : '-',
          isExpired ? 'Vencido' : isLowStock ? 'Stock Bajo' : 'OK',
        ];
      }),
    }, 'inventario');
  }, [products, productStock, expirationDatesMap]);

  const handleExportInventoryPDF = useCallback(() => {
    const inventoryProducts = products.filter(p => p.track_stock);
    exportToPDF({
      title: 'Inventario de Productos',
      subtitle: `Total: ${inventoryProducts.length} productos`,
      headers: ['Producto', 'Stock Actual', 'Stock Mín.', 'F. Ingreso', 'F. Vencimiento', 'Estado'],
      rows: inventoryProducts.map(p => {
        const stock = getProductStock(p.id);
        const minStock = (p as any).min_stock || 5;
        const nearestExp = getNearestExpiration(p.id);
        const daysLeft = nearestExp ? getDaysUntilExpiration(nearestExp) : null;
        const isExpired = daysLeft !== null && daysLeft < 0;
        const isLowStock = stock <= minStock;
        return [
          p.name,
          stock,
          minStock,
          (p as any).entry_date ? new Date((p as any).entry_date).toLocaleDateString('es-PE') : '-',
          nearestExp ? new Date(nearestExp).toLocaleDateString('es-PE') : '-',
          isExpired ? 'Vencido' : isLowStock ? 'Stock Bajo' : 'OK',
        ];
      }),
    }, 'inventario');
  }, [products, productStock, expirationDatesMap]);

  const handleExportInventoryDesignPDF = useCallback(async () => {
    await exportChartsToPDF('#inventory-table-container', 'Inventario de Productos', `Total: ${products.filter(p => p.track_stock).length} productos`, 'inventario-diseño');
  }, [products]);

  const handleExportKardexExcel = useCallback(() => {
    if (!selectedProductForStock || stockMoves.length === 0) return;
    exportToExcel({
      title: `Kardex - ${selectedProductForStock.name}`,
      subtitle: `Movimientos registrados: ${stockMoves.length}`,
      headers: ['Fecha', 'Tipo', 'Cantidad', 'Costo Unit.', 'F. Vencimiento', 'Notas'],
      rows: stockMoves.map(m => [
        new Date(m.created_at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }),
        getMoveTypeLabel(m.move_type),
        m.quantity,
        m.unit_cost ? `S/ ${Number(m.unit_cost).toFixed(2)}` : '-',
        m.expiration_date ? new Date(m.expiration_date).toLocaleDateString('es-PE') : '-',
        m.notes || '-',
      ]),
    }, `kardex-${selectedProductForStock.name}`);
  }, [selectedProductForStock, stockMoves]);

  const handleExportKardexPDF = useCallback(() => {
    if (!selectedProductForStock || stockMoves.length === 0) return;
    exportToPDF({
      title: `Kardex - ${selectedProductForStock.name}`,
      subtitle: `Movimientos registrados: ${stockMoves.length}`,
      headers: ['Fecha', 'Tipo', 'Cantidad', 'Costo Unit.', 'F. Vencimiento', 'Notas'],
      rows: stockMoves.map(m => [
        new Date(m.created_at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }),
        getMoveTypeLabel(m.move_type),
        m.quantity,
        m.unit_cost ? `S/ ${Number(m.unit_cost).toFixed(2)}` : '-',
        m.expiration_date ? new Date(m.expiration_date).toLocaleDateString('es-PE') : '-',
        m.notes || '-',
      ]),
    }, `kardex-${selectedProductForStock.name}`);
  }, [selectedProductForStock, stockMoves]);

  const handleExportKardexDesignPDF = useCallback(async () => {
    if (!selectedProductForStock) return;
    await exportChartsToPDF('#kardex-table-container', `Kardex - ${selectedProductForStock.name}`, `Movimientos: ${stockMoves.length}`, `kardex-diseño-${selectedProductForStock.name}`);
  }, [selectedProductForStock, stockMoves]);

  const isLoading = loadingCategories || loadingProducts;
  const isSaving = createProduct.isPending || updateProduct.isPending;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-pos-2xl font-bold">Productos</h1>
            <p className="text-muted-foreground">Gestiona productos, inventario y kardex</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="btn-pos" onClick={() => handleOpenCategoryModal()}>
              <FolderPlus className="h-5 w-5 mr-2" />
              Nueva Categoría
            </Button>

            {activeTab === 'inventory' && (
              <Button variant="outline" className="btn-pos" onClick={handleOpenStockEntryModal}>
                <ArrowUpDown className="h-5 w-5 mr-2" />
                Ingreso Producto
              </Button>
            )}

            <Button className="btn-pos bg-primary" onClick={() => handleOpenProductModal()}>
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
            <TabsTrigger value="kardex">Kardex</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>

              <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                <SelectTrigger className="w-56 h-12">
                  <SelectValue placeholder="Tienda" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store: any) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48 h-12">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Category edit chips */}
              <div className="flex gap-1.5 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleOpenCategoryModal(cat)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border hover:bg-accent/50 transition-colors"
                    style={{ borderColor: cat.color, color: cat.color }}
                    title={`Editar ${cat.name}`}
                  >
                    <Edit className="h-3 w-3" />
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Table */}
            <Card className="border-2" id="products-table-container">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Lista de Productos ({filteredProducts.length})
                </CardTitle>
                <ExportDropdown
                  onExportExcel={handleExportProductsExcel}
                  onExportPDF={handleExportProductsPDF}
                  onExportDesignPDF={handleExportProductsDesignPDF}
                  disabled={filteredProducts.length === 0}
                />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[30%]">Producto</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-center">Stock</TableHead>
                        <TableHead className="text-center">Vence</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                        <TableHead className="text-center">Receta</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => {
                        const stock = getProductStock(product.id);
                        const minStock = (product as any).min_stock || 5;
                        const isLowStock = product.track_stock && stock <= minStock;
                        // Get nearest expiration from stock moves
                        const nearestExpiration = getNearestExpiration(product.id);

                        return (
                          <TableRow key={product.id} className={!product.active ? 'opacity-50' : ''}>
                            <TableCell>
                              <div>
                                <p className="font-semibold">{product.name}</p>
                                {product.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {product.description}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span 
                                className="px-3 py-1 rounded-full text-sm font-medium"
                                style={{ 
                                  backgroundColor: `${product.category?.color || '#3b82f6'}20`,
                                  color: product.category?.color || '#3b82f6'
                                }}
                              >
                                {product.category?.name || 'Sin categoría'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-bold text-pos-lg">
                              S/ {Number(product.base_price).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">
                              {product.track_stock ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span className={`font-bold ${isLowStock ? 'text-destructive' : ''}`}>
                                    {stock}
                                  </span>
                                  {isLowStock && (
                                    <Badge variant="destructive" className="text-xs">
                                      Stock bajo
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {nearestExpiration ? (
                                (() => {
                                  const daysLeft = getDaysUntilExpiration(nearestExpiration);
                                  const isExpiredCalc = daysLeft < 0;
                                  const isExpiringSoonCalc = daysLeft >= 0 && daysLeft <= 7;
                                  
                                  return (
                                    <div className="flex flex-col items-center gap-1">
                                      <span className="text-sm">
                                        {new Date(nearestExpiration).toLocaleDateString('es-PE')}
                                      </span>
                                      {isExpiredCalc ? (
                                        <Badge variant="destructive" className="text-xs flex items-center gap-1">
                                          <AlertTriangle className="h-3 w-3" />
                                          {formatDaysMessage(daysLeft)}
                                        </Badge>
                                      ) : isExpiringSoonCalc ? (
                                        <Badge className="text-xs bg-warning text-warning-foreground flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {formatDaysMessage(daysLeft)}
                                        </Badge>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">
                                          {formatDaysMessage(daysLeft)}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                product.active 
                                  ? 'bg-success/10 text-success' 
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {product.active ? 'Activo' : 'Inactivo'}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {product.category?.has_recipes ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1"
                                  onClick={() => {
                                    setRecipeProductId(product.id);
                                    setRecipeProductName(product.name);
                                    setRecipeProductPrice(Number(product.base_price));
                                  }}
                                >
                                  <ChefHat className="h-4 w-4" />
                                  Receta
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleToggleActive(product)}
                                  title={product.active ? 'Desactivar' : 'Activar'}
                                >
                                  {product.active ? (
                                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                                  ) : (
                                    <Eye className="h-5 w-5 text-success" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenProductModal(product)}
                                >
                                  <Edit className="h-5 w-5 text-primary" />
                                </Button>
                                {isAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteProduct(product)}
                                  >
                                    <Trash2 className="h-5 w-5 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}

                {!isLoading && filteredProducts.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <Package className="h-16 w-16 mb-4 opacity-50" />
                    <p className="text-pos-lg font-medium">No hay productos</p>
                    <p className="text-sm">Crea un nuevo producto para empezar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-4">
            <Card className="border-2" id="inventory-table-container">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Inventario de Productos
                </CardTitle>

                <div className="flex gap-2">
                  <ExportDropdown
                    onExportExcel={handleExportInventoryExcel}
                    onExportPDF={handleExportInventoryPDF}
                    onExportDesignPDF={handleExportInventoryDesignPDF}
                    disabled={products.filter(p => p.track_stock).length === 0}
                  />
                  <Button onClick={handleOpenStockEntryModal}>
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Ingreso de producto
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingStock ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-center">Stock Actual</TableHead>
                        <TableHead className="text-center">Fecha Ingreso</TableHead>
                        <TableHead className="text-center">Fecha Vencimiento</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.filter(p => p.track_stock).map((product) => {
                        const stock = getProductStock(product.id);
                        const minStock = (product as any).min_stock || 5;
                        const isLowStock = stock <= minStock;
                        // Get nearest expiration from stock moves
                        const nearestExpiration = getNearestExpiration(product.id);
                        const entryDate = (product as any).entry_date;
                        const daysLeft = nearestExpiration ? getDaysUntilExpiration(nearestExpiration) : null;
                        const isExpired = daysLeft !== null && daysLeft < 0;
                        const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

                        return (
                          <TableRow key={product.id}>
                            <TableCell className="font-semibold">{product.name}</TableCell>
                            <TableCell className="text-center">
                              <span className={`font-bold text-lg ${isLowStock ? 'text-destructive' : 'text-success'}`}>
                                {stock}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {entryDate ? new Date(entryDate).toLocaleDateString('es-PE') : '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              {nearestExpiration ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span className={isExpired ? 'text-destructive font-bold' : ''}>
                                    {new Date(nearestExpiration).toLocaleDateString('es-PE')}
                                  </span>
                                  {daysLeft !== null && (
                                    isExpired ? (
                                      <Badge variant="destructive" className="text-xs">
                                        {formatDaysMessage(daysLeft)}
                                      </Badge>
                                    ) : isExpiringSoon ? (
                                      <Badge className="text-xs bg-warning text-warning-foreground">
                                        {formatDaysMessage(daysLeft)}
                                      </Badge>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">
                                        {formatDaysMessage(daysLeft)}
                                      </span>
                                    )
                                  )}
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              {isExpired ? (
                                <Badge variant="destructive">Vencido</Badge>
                              ) : isLowStock ? (
                                <Badge className="bg-warning text-warning-foreground">Stock Bajo</Badge>
                              ) : (
                                <Badge className="bg-success text-success-foreground">OK</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenStockModal(product)}
                              >
                                <ArrowUpDown className="h-4 w-4 mr-2" />
                                Movimiento
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}

                {!loadingStock && products.filter(p => p.track_stock).length === 0 && (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <Package className="h-16 w-16 mb-4 opacity-50" />
                    <p className="text-pos-lg font-medium">No hay productos con control de stock</p>
                    <p className="text-sm">Activa "Controlar Stock" en los productos que desees gestionar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Kardex Tab */}
          <TabsContent value="kardex" className="space-y-4">
            <div className="flex gap-4 items-center mb-4">
              <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                <SelectTrigger className="w-56 h-12">
                  <SelectValue placeholder="Tienda" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store: any) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={selectedProductForStock?.id || ''} 
                onValueChange={(id) => setSelectedProductForStock(products.find(p => p.id === id) || null)}
              >
                <SelectTrigger className="w-72 h-12">
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.filter(p => p.track_stock).map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card className="border-2" id="kardex-table-container">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpDown className="h-5 w-5" />
                  Kardex / Movimientos
                  {selectedProductForStock && (
                    <span className="text-muted-foreground font-normal ml-2">
                      - {selectedProductForStock.name}
                    </span>
                  )}
                </CardTitle>
                <ExportDropdown
                  onExportExcel={handleExportKardexExcel}
                  onExportPDF={handleExportKardexPDF}
                  onExportDesignPDF={handleExportKardexDesignPDF}
                  disabled={!selectedProductForStock || stockMoves.length === 0}
                />
              </CardHeader>
              <CardContent>
                {!selectedProductForStock ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <ArrowUpDown className="h-16 w-16 mb-4 opacity-50" />
                    <p className="text-pos-lg font-medium">Selecciona un producto</p>
                    <p className="text-sm">Para ver el historial de movimientos</p>
                  </div>
                ) : loadingMoves ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                        <TableHead className="text-right">Costo Unit.</TableHead>
                        <TableHead>F. Vencimiento</TableHead>
                        <TableHead>Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockMoves.map((move) => (
                        <TableRow key={move.id}>
                          <TableCell>
                            {new Date(move.created_at).toLocaleString('es-PE', {
                              dateStyle: 'short',
                              timeStyle: 'short'
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge className={getMoveTypeColor(move.move_type)}>
                              {getMoveTypeLabel(move.move_type)}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-bold ${move.quantity >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {move.quantity >= 0 ? '+' : ''}{move.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {move.unit_cost ? `S/ ${Number(move.unit_cost).toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell>
                            {move.expiration_date ? (
                              <span className="text-sm">
                                {new Date(move.expiration_date).toLocaleDateString('es-PE')}
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {move.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {selectedProductForStock && !loadingMoves && stockMoves.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <p>No hay movimientos registrados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Product Modal */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nombre del producto"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.active).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Descripción del producto"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Precio *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                  S/
                </span>
                <Input
                  type="number"
                  step="0.01"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="0.00"
                  className="pl-10 h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Costo de Compra (opcional)</Label>
              <p className="text-xs text-muted-foreground">
                Precio al que compras este producto para calcular rentabilidad
              </p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                  S/
                </span>
                <Input
                  type="number"
                  step="0.01"
                  value={formCostPrice}
                  onChange={(e) => setFormCostPrice(e.target.value)}
                  placeholder="0.00"
                  className="pl-10 h-12"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <Label>Controlar Stock</Label>
                <p className="text-sm text-muted-foreground">
                  Habilitar para productos con inventario
                </p>
              </div>
              <Switch checked={formTrackStock} onCheckedChange={setFormTrackStock} />
            </div>

            {formTrackStock && (
              <>
                <div className="space-y-2">
                  <Label>Stock Mínimo</Label>
                  <Input
                    type="number"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    placeholder="5"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fecha de Ingreso</Label>
                  <Input
                    type="date"
                    value={formEntryDate}
                    onChange={(e) => setFormEntryDate(e.target.value)}
                    className="h-12"
                  />
                </div>

                {/* Producto Vence toggle is only shown in Stock Movement Modal (Ingreso de Producto) */}
              </>
            )}

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <Label>Producto Activo</Label>
                <p className="text-sm text-muted-foreground">
                  Los productos inactivos no aparecen en el POS
                </p>
              </div>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setIsProductModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-primary"
                onClick={handleSaveProduct}
                disabled={isSaving}
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Movement Modal */}
      <Dialog open={isStockModalOpen} onOpenChange={setIsStockModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              Movimiento de Stock
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!selectedProductForStock && (
              <div className="space-y-2">
                <Label>Producto *</Label>
                <Select
                  value={selectedProductForStock?.id || ''}
                  onValueChange={(id) => {
                    const product = products.find((p) => p.id === id) || null;
                    setSelectedProductForStock(product);
                    setStockMoveExpires(!!(product as any)?.expires);
                    setStockMoveExpirationDate('');
                  }}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products
                      .filter((p) => p.track_stock)
                      .map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedProductForStock && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-semibold">{selectedProductForStock.name}</p>
                <p className="text-sm text-muted-foreground">
                  Stock actual: <span className="font-bold">{getProductStock(selectedProductForStock.id)}</span>
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Tipo de Movimiento</Label>
              <Select value={stockMoveType} onValueChange={(v) => setStockMoveType(v as any)}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Compra / Ingreso</SelectItem>
                  <SelectItem value="adjustment">Ajuste de Inventario</SelectItem>
                  <SelectItem value="waste">Merma / Pérdida</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cantidad *</Label>
              <Input
                type="number"
                value={stockMoveQuantity}
                onChange={(e) => setStockMoveQuantity(e.target.value)}
                placeholder={stockMoveType === 'waste' ? 'Cantidad a restar' : 'Cantidad a agregar'}
                className="h-12"
              />
            </div>

            {stockMoveType === 'purchase' && (
              <>
                <div className="space-y-2">
                  <Label>Costo Unitario (opcional)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                      S/
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      value={stockMoveCost}
                      onChange={(e) => setStockMoveCost(e.target.value)}
                      placeholder="0.00"
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <Label>¿Producto con Vencimiento?</Label>
                    <p className="text-sm text-muted-foreground">
                      Activar si el lote tiene fecha de vencimiento
                    </p>
                  </div>
                  <Switch
                    checked={stockMoveExpires}
                    onCheckedChange={setStockMoveExpires}
                  />
                </div>

                {stockMoveExpires && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fecha de Vencimiento *
                    </Label>
                    <Input
                      type="date"
                      value={stockMoveExpirationDate}
                      onChange={(e) => setStockMoveExpirationDate(e.target.value)}
                      className="h-12"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Textarea
                value={stockMoveNotes}
                onChange={(e) => setStockMoveNotes(e.target.value)}
                placeholder="Observaciones del movimiento..."
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setIsStockModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-primary"
                onClick={handleSaveStockMove}
                disabled={createStockMove.isPending}
              >
                {createStockMove.isPending ? 'Guardando...' : 'Registrar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Modal (Create / Edit) */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5" />
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre de la categoría *</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ej: Pizzas, Bebidas, Postres..."
                className="h-12"
              />
            </div>

            <CategoryIconPicker
              value={newCategoryIcon}
              onChange={setNewCategoryIcon}
              color={newCategoryColor}
            />

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'].map((color) => (
                  <button
                    key={color}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      newCategoryColor === color ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewCategoryColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <Label className="flex items-center gap-2">
                  <ChefHat className="h-4 w-4" />
                  Usa Recetas
                </Label>
                <p className="text-sm text-muted-foreground">
                  Los productos de esta categoría tienen receta con insumos
                </p>
              </div>
              <Switch checked={newCategoryHasRecipes} onCheckedChange={setNewCategoryHasRecipes} />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setIsCategoryModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-primary"
                onClick={handleSaveCategory}
                disabled={createCategory.isPending || updateCategory.isPending}
              >
                {(createCategory.isPending || updateCategory.isPending) 
                  ? 'Guardando...' 
                  : editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recipe Editor Modal */}
      {recipeProductId && (
        <RecipeEditor
          isOpen={!!recipeProductId}
          onClose={() => setRecipeProductId(null)}
          productId={recipeProductId}
          productName={recipeProductName}
          productPrice={recipeProductPrice}
        />
      )}
    </MainLayout>
  );
}
