import { useState, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Package, Eye, EyeOff, X, Layers, Loader2 } from 'lucide-react';
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
import { ComboCompleto, ComboComponente } from '@/types/pos';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  useAllCombos, 
  useCreateCombo, 
  useUpdateCombo, 
  useToggleComboActive, 
  useDeleteCombo 
} from '@/hooks/useCombos';
import { useProducts } from '@/hooks/useProducts';

export default function CombosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ComboCompleto | null>(null);
  
  // Form state
  const [formNombre, setFormNombre] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formPrecio, setFormPrecio] = useState('');
  const [formComponentes, setFormComponentes] = useState<ComboComponente[]>([]);
  const [formTemporal, setFormTemporal] = useState(false);

  // Data from Supabase
  const { data: combos = [], isLoading: loadingCombos } = useAllCombos();
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  
  // Mutations
  const createCombo = useCreateCombo();
  const updateCombo = useUpdateCombo();
  const toggleActive = useToggleComboActive();
  const deleteCombo = useDeleteCombo();

  const filteredCombos = useMemo(() => 
    combos.filter((c) => 
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [combos, searchTerm]
  );

  const calcularPrecioSugerido = () => {
    return formComponentes.reduce((sum, comp) => {
      const producto = products.find(p => p.id === comp.productoId);
      return sum + (Number(producto?.base_price) || 0) * comp.cantidad;
    }, 0);
  };

  const handleOpenModal = (combo?: ComboCompleto) => {
    if (combo) {
      setEditingCombo(combo);
      setFormNombre(combo.nombre);
      setFormDescripcion(combo.descripcion || '');
      setFormPrecio(combo.precio.toString());
      setFormComponentes(combo.componentes);
      setFormTemporal(combo.temporal);
    } else {
      setEditingCombo(null);
      setFormNombre('');
      setFormDescripcion('');
      setFormPrecio('');
      setFormComponentes([]);
      setFormTemporal(false);
    }
    setIsModalOpen(true);
  };

  const handleAddComponente = (product: any) => {
    const existing = formComponentes.find(c => c.productoId === product.id);
    if (existing) {
      setFormComponentes(formComponentes.map(c =>
        c.productoId === product.id
          ? { ...c, cantidad: c.cantidad + 1 }
          : c
      ));
    } else {
      setFormComponentes([...formComponentes, {
        productoId: product.id,
        cantidad: 1,
        nombre: product.name,
      }]);
    }
  };

  const handleUpdateComponenteCantidad = (productoId: string, cantidad: number) => {
    if (cantidad <= 0) {
      setFormComponentes(formComponentes.filter(c => c.productoId !== productoId));
    } else {
      setFormComponentes(formComponentes.map(c =>
        c.productoId === productoId ? { ...c, cantidad } : c
      ));
    }
  };

  const handleRemoveComponente = (productoId: string) => {
    setFormComponentes(formComponentes.filter(c => c.productoId !== productoId));
  };

  const handleSave = async () => {
    if (!formNombre.trim()) {
      toast.error('Ingrese un nombre para el combo');
      return;
    }
    if (formComponentes.length < 2) {
      toast.error('Un combo debe tener al menos 2 productos');
      return;
    }
    if (!formPrecio || parseFloat(formPrecio) <= 0) {
      toast.error('Ingrese un precio válido');
      return;
    }

    try {
      if (editingCombo) {
        await updateCombo.mutateAsync({
          ...editingCombo,
          nombre: formNombre,
          descripcion: formDescripcion,
          precio: parseFloat(formPrecio),
          componentes: formComponentes,
          temporal: formTemporal,
        });
        toast.success('Combo actualizado');
      } else {
        await createCombo.mutateAsync({
          nombre: formNombre,
          descripcion: formDescripcion,
          precio: parseFloat(formPrecio),
          temporal: formTemporal,
          componentes: formComponentes,
        });
        toast.success('Combo creado');
      }
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error('Error al guardar combo', { description: error.message });
    }
  };

  const handleToggleActive = async (combo: ComboCompleto) => {
    try {
      await toggleActive.mutateAsync({ id: combo.id, active: !combo.activo });
      toast.success(combo.activo ? 'Combo desactivado' : 'Combo activado');
    } catch (error: any) {
      toast.error('Error al cambiar estado', { description: error.message });
    }
  };

  const handleDelete = async (combo: ComboCompleto) => {
    try {
      await deleteCombo.mutateAsync(combo.id);
      toast.success('Combo eliminado');
    } catch (error: any) {
      toast.error('Error al eliminar combo', { description: error.message });
    }
  };

  const isLoading = loadingCombos || loadingProducts;
  const isSaving = createCombo.isPending || updateCombo.isPending;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-pos-2xl font-bold flex items-center gap-3">
              <Layers className="h-8 w-8" />
              Combos
            </h1>
            <p className="text-muted-foreground">Gestiona combos y paquetes promocionales</p>
          </div>
          <Button className="btn-pos" onClick={() => handleOpenModal()}>
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Combo
          </Button>
        </div>

        {/* Info Card */}
        <Card className="border-2 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Package className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-bold text-blue-900 dark:text-blue-100">¿Cómo funciona el descuento de stock?</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Cuando vendes un combo, el sistema <strong>descuenta automáticamente el stock</strong> de cada producto 
                  que lo compone y que tenga "Requiere Stock" activado. Por ejemplo, si vendes "Pizza + Gaseosa", 
                  la gaseosa se descuenta del inventario automáticamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar combos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-pos-base rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-2 p-4">
            <div className="text-center">
              {isLoading ? (
                <Skeleton className="h-8 w-12 mx-auto" />
              ) : (
                <p className="text-2xl font-bold text-primary">{combos.length}</p>
              )}
              <p className="text-sm text-muted-foreground">Total combos</p>
            </div>
          </Card>
          <Card className="border-2 p-4">
            <div className="text-center">
              {isLoading ? (
                <Skeleton className="h-8 w-12 mx-auto" />
              ) : (
                <p className="text-2xl font-bold text-success">{combos.filter(c => c.activo).length}</p>
              )}
              <p className="text-sm text-muted-foreground">Activos</p>
            </div>
          </Card>
          <Card className="border-2 p-4">
            <div className="text-center">
              {isLoading ? (
                <Skeleton className="h-8 w-12 mx-auto" />
              ) : (
                <p className="text-2xl font-bold text-warning">{combos.filter(c => c.temporal).length}</p>
              )}
              <p className="text-sm text-muted-foreground">Temporales</p>
            </div>
          </Card>
        </div>

        {/* Combos Table */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Lista de Combos ({filteredCombos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredCombos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No hay combos registrados</p>
                <p className="text-sm">Crea tu primer combo para empezar</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-pos-base font-bold">Nombre</TableHead>
                    <TableHead className="text-pos-base font-bold">Componentes</TableHead>
                    <TableHead className="text-pos-base font-bold">Precio Combo</TableHead>
                    <TableHead className="text-pos-base font-bold">Ahorro</TableHead>
                    <TableHead className="text-pos-base font-bold">Estado</TableHead>
                    <TableHead className="text-pos-base font-bold text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCombos.map((combo) => {
                    const precioOriginal = combo.componentes.reduce((sum, comp) => {
                      const prod = products.find(p => p.id === comp.productoId);
                      return sum + (Number(prod?.base_price) || 0) * comp.cantidad;
                    }, 0);
                    const ahorro = precioOriginal - combo.precio;
                    
                    return (
                      <TableRow key={combo.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <p className="font-semibold text-pos-base">{combo.nombre}</p>
                            {combo.descripcion && (
                              <p className="text-sm text-muted-foreground">{combo.descripcion}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {combo.componentes.map((comp, idx) => {
                              const prod = products.find(p => p.id === comp.productoId);
                              return (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  <span className="font-medium">{comp.cantidad}x</span>
                                  <span>{comp.nombre || prod?.name}</span>
                                  {prod?.track_stock && (
                                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                                      -stock
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-primary text-lg">
                          S/ {combo.precio.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <span className="px-3 py-1 rounded-full text-sm font-bold bg-success/10 text-success">
                            -S/ {ahorro.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold w-fit ${
                              combo.activo 
                                ? 'bg-success/10 text-success' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {combo.activo ? 'Activo' : 'Inactivo'}
                            </span>
                            {combo.temporal && (
                              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-warning/10 text-warning w-fit">
                                Temporal
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10"
                              onClick={() => handleOpenModal(combo)}
                            >
                              <Edit className="h-5 w-5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10"
                              onClick={() => handleToggleActive(combo)}
                              disabled={toggleActive.isPending}
                            >
                              {combo.activo ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(combo)}
                              disabled={deleteCombo.isPending}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Combo Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-pos-xl flex items-center gap-2">
                <Layers className="h-6 w-6" />
                {editingCombo ? 'Editar Combo' : 'Nuevo Combo'}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-pos-base font-semibold">Nombre del combo</label>
                    <Input
                      value={formNombre}
                      onChange={(e) => setFormNombre(e.target.value)}
                      placeholder="Ej: Combo Pizza + Gaseosa"
                      className="h-12 text-pos-base rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-pos-base font-semibold">Precio del combo</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">S/</span>
                      <Input
                        type="number"
                        value={formPrecio}
                        onChange={(e) => setFormPrecio(e.target.value)}
                        placeholder="0.00"
                        className="pl-12 h-12 text-pos-base rounded-xl"
                      />
                    </div>
                    {formComponentes.length >= 2 && (
                      <p className="text-sm text-muted-foreground">
                        Precio sugerido (productos): <strong>S/ {calcularPrecioSugerido().toFixed(2)}</strong>
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-pos-base font-semibold">Descripción (opcional)</label>
                  <Input
                    value={formDescripcion}
                    onChange={(e) => setFormDescripcion(e.target.value)}
                    placeholder="Ej: Pizza personal + Coca Cola 1L"
                    className="h-12 text-pos-base rounded-xl"
                  />
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted">
                  <Checkbox 
                    id="temporal"
                    checked={formTemporal}
                    onCheckedChange={(checked) => setFormTemporal(checked as boolean)}
                  />
                  <label htmlFor="temporal" className="font-medium cursor-pointer">
                    Combo temporal (promoción por tiempo limitado)
                  </label>
                </div>

                {/* Selected components */}
                <div className="space-y-2">
                  <label className="text-pos-base font-semibold">
                    Productos en el combo ({formComponentes.length})
                  </label>
                  {formComponentes.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Selecciona productos de la lista para agregar al combo
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {formComponentes.map((comp) => {
                        const producto = products.find(p => p.id === comp.productoId);
                        return (
                          <div key={comp.productoId} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-primary">{comp.cantidad}x</span>
                              <span className="font-medium">{comp.nombre || producto?.name}</span>
                              <span className="text-sm text-muted-foreground">
                                S/ {((Number(producto?.base_price) || 0) * comp.cantidad).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleUpdateComponenteCantidad(comp.productoId, comp.cantidad - 1)}
                              >
                                -
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleUpdateComponenteCantidad(comp.productoId, comp.cantidad + 1)}
                              >
                                +
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleRemoveComponente(comp.productoId)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Available products */}
                <div className="space-y-2">
                  <label className="text-pos-base font-semibold">Productos disponibles</label>
                  {loadingProducts ? (
                    <div className="grid grid-cols-3 gap-2">
                      {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-16" />
                      ))}
                    </div>
                  ) : products.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No hay productos disponibles. Crea productos primero.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {products.filter(p => p.active).map((product) => {
                        const isSelected = formComponentes.some(c => c.productoId === product.id);
                        return (
                          <Button
                            key={product.id}
                            variant={isSelected ? "default" : "outline"}
                            className="h-auto py-2 px-3 justify-start"
                            onClick={() => handleAddComponente(product)}
                          >
                            <div className="text-left">
                              <p className="font-medium text-sm truncate">{product.name}</p>
                              <p className="text-xs opacity-70">S/ {Number(product.base_price).toFixed(2)}</p>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <Button 
                  className="w-full btn-pos"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    editingCombo ? 'Actualizar Combo' : 'Crear Combo'
                  )}
                </Button>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
