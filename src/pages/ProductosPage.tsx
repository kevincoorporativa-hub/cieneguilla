import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Package, Eye, EyeOff, FolderPlus, Check, X } from 'lucide-react';
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
import {
  useCategories,
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useCreateCategory,
  Category,
  Product,
} from '@/hooks/useProducts';

export default function ProductosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<string>('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formTrackStock, setFormTrackStock] = useState(false);
  const [formActive, setFormActive] = useState(true);

  // Category form
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');

  // Fetch data
  const { data: categories = [], isLoading: loadingCategories } = useCategories(true);
  const { data: products = [], isLoading: loadingProducts } = useProducts(true);

  // Mutations
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createCategory = useCreateCategory();

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormName(product.name);
      setFormCategoryId(product.category_id || '');
      setFormDescription(product.description || '');
      setFormPrice(product.base_price.toString());
      setFormTrackStock(product.track_stock);
      setFormActive(product.active);
    } else {
      setEditingProduct(null);
      setFormName('');
      setFormCategoryId(categories[0]?.id || '');
      setFormDescription('');
      setFormPrice('');
      setFormTrackStock(false);
      setFormActive(true);
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!formName.trim() || !formPrice) {
      toast.error('Complete los campos requeridos');
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          name: formName,
          category_id: formCategoryId || null,
          description: formDescription || null,
          base_price: parseFloat(formPrice),
          track_stock: formTrackStock,
          active: formActive,
        });
        toast.success('Producto actualizado');
      } else {
        await createProduct.mutateAsync({
          name: formName,
          category_id: formCategoryId || null,
          description: formDescription || null,
          base_price: parseFloat(formPrice),
          track_stock: formTrackStock,
          active: formActive,
        });
        toast.success('Producto creado');
      }
      setIsProductModalOpen(false);
    } catch (error: any) {
      toast.error('Error al guardar producto', { description: error.message });
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

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Ingrese un nombre para la categoría');
      return;
    }

    try {
      await createCategory.mutateAsync({
        name: newCategoryName,
        color: newCategoryColor,
        sort_order: categories.length + 1,
      });
      toast.success('Categoría creada');
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
    } catch (error: any) {
      toast.error('Error al crear categoría', { description: error.message });
    }
  };

  const isLoading = loadingCategories || loadingProducts;
  const isSaving = createProduct.isPending || updateProduct.isPending;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-pos-2xl font-bold">Productos</h1>
            <p className="text-muted-foreground">Gestiona los productos del catálogo</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="btn-pos" onClick={() => setIsCategoryModalOpen(true)}>
              <FolderPlus className="h-5 w-5 mr-2" />
              Nueva Categoría
            </Button>
            <Button className="btn-pos bg-primary" onClick={() => handleOpenProductModal()}>
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        </div>

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
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48 h-12">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                    <TableHead className="w-[40%]">Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
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
                          <Check className="h-5 w-5 text-success mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground mx-auto" />
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteProduct(product)}
                          >
                            <Trash2 className="h-5 w-5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
      </div>

      {/* Product Modal */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-lg">
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

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <Label>Controlar Stock</Label>
                <p className="text-sm text-muted-foreground">
                  Habilitar para productos con inventario
                </p>
              </div>
              <Switch checked={formTrackStock} onCheckedChange={setFormTrackStock} />
            </div>

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

      {/* Category Modal */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5" />
              Nueva Categoría
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

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'].map((color) => (
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
                onClick={handleCreateCategory}
                disabled={createCategory.isPending}
              >
                {createCategory.isPending ? 'Creando...' : 'Crear Categoría'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
