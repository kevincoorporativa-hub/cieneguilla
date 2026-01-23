import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Package, Eye, EyeOff, X, Check, Layers } from 'lucide-react';
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
import { Product, ComboCompleto, ComboComponente } from '@/types/pos';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

// Productos disponibles para combos
const productosDisponibles: Product[] = [
  { id: '1', nombre: 'Pizza Margarita', categoria: 'pizzas', precio: 28.00, stock: 50, stockMinimo: 5, requiereStock: false, productoVence: false, activo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', nombre: 'Pizza Pepperoni', categoria: 'pizzas', precio: 32.00, stock: 45, stockMinimo: 5, requiereStock: false, productoVence: false, activo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '3', nombre: 'Pizza Hawaiana', categoria: 'pizzas', precio: 35.00, stock: 30, stockMinimo: 5, requiereStock: false, productoVence: false, activo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '10', nombre: 'Cerveza Pilsen', categoria: 'cervezas', precio: 8.00, stock: 100, stockMinimo: 20, requiereStock: true, productoVence: true, fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), activo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '11', nombre: 'Cerveza Cusqueña', categoria: 'cervezas', precio: 9.00, stock: 80, stockMinimo: 20, requiereStock: true, productoVence: true, fechaVencimiento: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), activo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '13', nombre: 'Coca Cola 1L', categoria: 'gaseosas', precio: 7.00, stock: 50, stockMinimo: 10, requiereStock: true, productoVence: true, fechaVencimiento: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), activo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '14', nombre: 'Inca Kola 1L', categoria: 'gaseosas', precio: 7.00, stock: 50, stockMinimo: 10, requiereStock: true, productoVence: true, fechaVencimiento: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), activo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '15', nombre: 'Vino Tinto Tacama', categoria: 'vinos', precio: 45.00, stock: 20, stockMinimo: 5, requiereStock: true, productoVence: true, fechaVencimiento: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), activo: true, createdAt: new Date(), updatedAt: new Date() },
];

// Combos de ejemplo
const demoCombos: ComboCompleto[] = [
  {
    id: 'c1',
    nombre: 'Combo Pizza + Gaseosa',
    descripcion: 'Pizza personal + Coca Cola 1L',
    componentes: [
      { productoId: '1', cantidad: 1, nombre: 'Pizza Margarita' },
      { productoId: '13', cantidad: 1, nombre: 'Coca Cola 1L' },
    ],
    precio: 32.00,
    activo: true,
    temporal: false,
    createdAt: new Date('2024-01-10'),
  },
  {
    id: 'c2',
    nombre: 'Combo Pizza Familiar',
    descripcion: 'Pizza grande + 2 Gaseosas',
    componentes: [
      { productoId: '2', cantidad: 1, nombre: 'Pizza Pepperoni' },
      { productoId: '14', cantidad: 2, nombre: 'Inca Kola 1L' },
    ],
    precio: 42.00,
    activo: true,
    temporal: false,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'c3',
    nombre: 'Combo Cervezero',
    descripcion: 'Pizza + 3 Cervezas',
    componentes: [
      { productoId: '3', cantidad: 1, nombre: 'Pizza Hawaiana' },
      { productoId: '10', cantidad: 3, nombre: 'Cerveza Pilsen' },
    ],
    precio: 55.00,
    activo: true,
    temporal: true,
    fechaInicio: new Date('2024-01-01'),
    fechaFin: new Date('2024-12-31'),
    createdAt: new Date('2024-01-20'),
  },
];

export default function CombosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [combos, setCombos] = useState<ComboCompleto[]>(demoCombos);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ComboCompleto | null>(null);
  
  // Form state
  const [formNombre, setFormNombre] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formPrecio, setFormPrecio] = useState('');
  const [formComponentes, setFormComponentes] = useState<ComboComponente[]>([]);
  const [formTemporal, setFormTemporal] = useState(false);

  const filteredCombos = combos.filter((c) => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calcularPrecioSugerido = () => {
    return formComponentes.reduce((sum, comp) => {
      const producto = productosDisponibles.find(p => p.id === comp.productoId);
      return sum + (producto?.precio || 0) * comp.cantidad;
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

  const handleAddComponente = (producto: Product) => {
    const existing = formComponentes.find(c => c.productoId === producto.id);
    if (existing) {
      setFormComponentes(formComponentes.map(c =>
        c.productoId === producto.id
          ? { ...c, cantidad: c.cantidad + 1 }
          : c
      ));
    } else {
      setFormComponentes([...formComponentes, {
        productoId: producto.id,
        cantidad: 1,
        nombre: producto.nombre,
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

  const handleSave = () => {
    if (formComponentes.length < 2) {
      toast.error('Un combo debe tener al menos 2 productos');
      return;
    }

    if (editingCombo) {
      setCombos(combos.map(c => 
        c.id === editingCombo.id 
          ? { 
              ...c, 
              nombre: formNombre,
              descripcion: formDescripcion,
              precio: parseFloat(formPrecio),
              componentes: formComponentes,
              temporal: formTemporal,
            }
          : c
      ));
      toast.success('Combo actualizado');
    } else {
      const newCombo: ComboCompleto = {
        id: crypto.randomUUID(),
        nombre: formNombre,
        descripcion: formDescripcion,
        componentes: formComponentes,
        precio: parseFloat(formPrecio),
        activo: true,
        temporal: formTemporal,
        createdAt: new Date(),
      };
      setCombos([...combos, newCombo]);
      toast.success('Combo creado');
    }
    setIsModalOpen(false);
  };

  const handleToggleActive = (combo: ComboCompleto) => {
    setCombos(combos.map(c => 
      c.id === combo.id ? { ...c, activo: !c.activo } : c
    ));
    toast.success(combo.activo ? 'Combo desactivado' : 'Combo activado');
  };

  const handleDelete = (combo: ComboCompleto) => {
    setCombos(combos.filter(c => c.id !== combo.id));
    toast.success('Combo eliminado');
  };

  const getProductosConStock = () => {
    return productosDisponibles.filter(p => p.requiereStock);
  };

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
              <p className="text-2xl font-bold text-primary">{combos.length}</p>
              <p className="text-sm text-muted-foreground">Total combos</p>
            </div>
          </Card>
          <Card className="border-2 p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{combos.filter(c => c.activo).length}</p>
              <p className="text-sm text-muted-foreground">Activos</p>
            </div>
          </Card>
          <Card className="border-2 p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-warning">{combos.filter(c => c.temporal).length}</p>
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
                    const prod = productosDisponibles.find(p => p.id === comp.productoId);
                    return sum + (prod?.precio || 0) * comp.cantidad;
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
                            const prod = productosDisponibles.find(p => p.id === comp.productoId);
                            return (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <span className="font-medium">{comp.cantidad}x</span>
                                <span>{comp.nombre || prod?.nombre}</span>
                                {prod?.requiereStock && (
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
                          >
                            {combo.activo ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(combo)}
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
                    <label className="text-pos-base font-semibold">Precio del combo (S/)</label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={formPrecio}
                        onChange={(e) => setFormPrecio(e.target.value)}
                        placeholder="0.00"
                        className="h-12 text-pos-base rounded-xl"
                      />
                      {formComponentes.length > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Precio sugerido (suma): S/ {calcularPrecioSugerido().toFixed(2)}
                        </p>
                      )}
                    </div>
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

                {/* Componentes del combo */}
                <div className="space-y-4">
                  <label className="text-pos-base font-semibold">Productos del combo</label>
                  
                  {/* Lista de productos añadidos */}
                  {formComponentes.length > 0 && (
                    <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                      {formComponentes.map((comp) => {
                        const prod = productosDisponibles.find(p => p.id === comp.productoId);
                        return (
                          <div key={comp.productoId} className="flex items-center justify-between bg-background rounded-lg p-3">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{comp.nombre || prod?.nombre}</span>
                              {prod?.requiereStock && (
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900/30 dark:text-blue-400">
                                  Descuenta stock
                                </span>
                              )}
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
                              <span className="w-8 text-center font-bold">{comp.cantidad}</span>
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

                  {/* Productos disponibles para agregar */}
                  <div className="border-2 rounded-xl p-4">
                    <p className="text-sm text-muted-foreground mb-3">Click para agregar productos:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {productosDisponibles.map((prod) => (
                        <button
                          key={prod.id}
                          onClick={() => handleAddComponente(prod)}
                          className="p-3 text-left bg-muted hover:bg-primary/10 rounded-lg transition-colors border"
                        >
                          <p className="font-medium text-sm truncate">{prod.nombre}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-muted-foreground">S/ {prod.precio.toFixed(2)}</span>
                            {prod.requiereStock && (
                              <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded dark:bg-blue-900/30 dark:text-blue-400">
                                Stock
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Combo temporal toggle */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div>
                    <p className="font-semibold">Combo temporal</p>
                    <p className="text-sm text-muted-foreground">
                      Activa si es una promoción por tiempo limitado
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormTemporal(!formTemporal)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      formTemporal ? 'bg-warning' : 'bg-muted-foreground/30'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        formTemporal ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1 btn-pos" onClick={() => setIsModalOpen(false)}>
                    <X className="h-5 w-5 mr-2" />
                    Cancelar
                  </Button>
                  <Button 
                    className="flex-1 btn-pos bg-success"
                    onClick={handleSave}
                    disabled={!formNombre || !formPrecio || formComponentes.length < 2}
                  >
                    <Check className="h-5 w-5 mr-2" />
                    {editingCombo ? 'Guardar' : 'Crear Combo'}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
