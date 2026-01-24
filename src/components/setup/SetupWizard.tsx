import { useState } from 'react';
import {
  Store,
  Terminal,
  Tag,
  Package,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  RefreshCw,
  Rocket,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useSetupStatus } from '@/hooks/useSetupStatus';
import { useCreateStore, useCreateTerminal, useStores } from '@/hooks/useStores';
import { useCreateCategory, useCreateProduct } from '@/hooks/useProducts';

interface SetupStepProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  count: number;
  loaded: boolean;
  isReady: boolean;
  onAdd: () => void;
  addLabel: string;
  disabled?: boolean;
}

function SetupStep({
  title,
  description,
  icon,
  count,
  loaded,
  isReady,
  onAdd,
  addLabel,
  disabled,
}: SetupStepProps) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border-2 bg-card">
      <div
        className={`p-3 rounded-xl ${
          isReady ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold">{title}</h4>
          {!loaded ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : isReady ? (
            <Badge variant="outline" className="bg-success/10 text-success border-success">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {count} registrado{count !== 1 ? 's' : ''}
            </Badge>
          ) : (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              Faltante
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
      </div>
      <Button
        size="sm"
        variant={isReady ? 'outline' : 'default'}
        onClick={onAdd}
        disabled={disabled}
      >
        <Plus className="h-4 w-4 mr-1" />
        {addLabel}
      </Button>
    </div>
  );
}

export function SetupWizard() {
  const status = useSetupStatus();
  const stores = useStores();
  const createStore = useCreateStore();
  const createTerminal = useCreateTerminal();
  const createCategory = useCreateCategory();
  const createProduct = useCreateProduct();

  // Dialog states
  const [storeDialog, setStoreDialog] = useState(false);
  const [terminalDialog, setTerminalDialog] = useState(false);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [productDialog, setProductDialog] = useState(false);

  // Form states
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');

  const [terminalName, setTerminalName] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');

  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('#3b82f6');

  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');

  const completedSteps = [
    status.stores.count > 0,
    status.terminals.count > 0,
    status.categories.count > 0,
    status.products.count > 0,
  ].filter(Boolean).length;

  const progressValue = (completedSteps / 4) * 100;

  const handleCreateStore = async () => {
    if (!storeName.trim()) {
      toast.error('Ingrese el nombre de la tienda');
      return;
    }
    try {
      await createStore.mutateAsync({
        name: storeName.trim(),
        address: storeAddress.trim() || undefined,
        phone: storePhone.trim() || undefined,
      });
      toast.success('Tienda creada correctamente');
      setStoreName('');
      setStoreAddress('');
      setStorePhone('');
      setStoreDialog(false);
      status.refetch();
    } catch (e: any) {
      toast.error(e.message || 'Error al crear tienda');
    }
  };

  const handleCreateTerminal = async () => {
    if (!terminalName.trim()) {
      toast.error('Ingrese el nombre del terminal');
      return;
    }
    const storeId = selectedStoreId || stores.data?.[0]?.id;
    if (!storeId) {
      toast.error('Primero debe crear una tienda');
      return;
    }
    try {
      await createTerminal.mutateAsync({
        store_id: storeId,
        name: terminalName.trim(),
      });
      toast.success('Terminal creado correctamente');
      setTerminalName('');
      setTerminalDialog(false);
      status.refetch();
    } catch (e: any) {
      toast.error(e.message || 'Error al crear terminal');
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) {
      toast.error('Ingrese el nombre de la categoría');
      return;
    }
    try {
      await createCategory.mutateAsync({
        name: categoryName.trim(),
        color: categoryColor,
      });
      toast.success('Categoría creada correctamente');
      setCategoryName('');
      setCategoryDialog(false);
      status.refetch();
    } catch (e: any) {
      toast.error(e.message || 'Error al crear categoría');
    }
  };

  const handleCreateProduct = async () => {
    if (!productName.trim()) {
      toast.error('Ingrese el nombre del producto');
      return;
    }
    const price = parseFloat(productPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Ingrese un precio válido');
      return;
    }
    try {
      await createProduct.mutateAsync({
        name: productName.trim(),
        base_price: price,
        category_id: null,
      });
      toast.success('Producto creado correctamente');
      setProductName('');
      setProductPrice('');
      setProductDialog(false);
      status.refetch();
    } catch (e: any) {
      toast.error(e.message || 'Error al crear producto');
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Asistente de Configuración Inicial
            </CardTitle>
            <CardDescription>
              Verifica y configura los elementos esenciales para operar el POS
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => status.refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progreso de configuración</span>
            <span className="text-muted-foreground">{completedSteps} de 4 completados</span>
          </div>
          <Progress value={progressValue} className="h-3" />
        </div>

        {/* Status message */}
        {status.isComplete ? (
          <div className="p-4 rounded-xl bg-success/10 border-2 border-success text-success flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6" />
            <div>
              <p className="font-semibold">¡Sistema listo para operar!</p>
              <p className="text-sm opacity-80">
                Todos los elementos esenciales están configurados.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-warning/10 border-2 border-warning text-warning-foreground flex items-center gap-3">
            <XCircle className="h-6 w-6 text-warning" />
            <div>
              <p className="font-semibold">Configuración incompleta</p>
              <p className="text-sm opacity-80">
                Complete los pasos faltantes para poder usar el POS.
              </p>
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-3">
          <SetupStep
            title="Tienda"
            description="Al menos una tienda activa es necesaria"
            icon={<Store className="h-5 w-5" />}
            count={status.stores.count}
            loaded={status.stores.loaded}
            isReady={status.stores.count > 0}
            onAdd={() => setStoreDialog(true)}
            addLabel="Crear Tienda"
          />

          <SetupStep
            title="Terminal / Caja"
            description="Terminal de venta asociado a una tienda"
            icon={<Terminal className="h-5 w-5" />}
            count={status.terminals.count}
            loaded={status.terminals.loaded}
            isReady={status.terminals.count > 0}
            onAdd={() => setTerminalDialog(true)}
            addLabel="Crear Terminal"
            disabled={status.stores.count === 0}
          />

          <SetupStep
            title="Categorías"
            description="Organiza tus productos en categorías"
            icon={<Tag className="h-5 w-5" />}
            count={status.categories.count}
            loaded={status.categories.loaded}
            isReady={status.categories.count > 0}
            onAdd={() => setCategoryDialog(true)}
            addLabel="Crear Categoría"
          />

          <SetupStep
            title="Productos"
            description="Productos disponibles para la venta"
            icon={<Package className="h-5 w-5" />}
            count={status.products.count}
            loaded={status.products.loaded}
            isReady={status.products.count > 0}
            onAdd={() => setProductDialog(true)}
            addLabel="Crear Producto"
          />
        </div>

        {/* Dialogs */}
        {/* Store Dialog */}
        <Dialog open={storeDialog} onOpenChange={setStoreDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Tienda</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  placeholder="Ej: Mi Pizzería Central"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Dirección</label>
                <Input
                  placeholder="Ej: Av. Principal 123"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono</label>
                <Input
                  placeholder="Ej: 01-234-5678"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStoreDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateStore} disabled={createStore.isPending}>
                {createStore.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear Tienda
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Terminal Dialog */}
        <Dialog open={terminalDialog} onOpenChange={setTerminalDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Terminal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre del Terminal *</label>
                <Input
                  placeholder="Ej: Caja 1"
                  value={terminalName}
                  onChange={(e) => setTerminalName(e.target.value)}
                />
              </div>
              {stores.data && stores.data.length > 1 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tienda</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border bg-background"
                    value={selectedStoreId}
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                  >
                    {stores.data.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTerminalDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateTerminal} disabled={createTerminal.isPending}>
                {createTerminal.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear Terminal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Category Dialog */}
        <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Categoría</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  placeholder="Ej: Pizzas"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={categoryColor}
                    onChange={(e) => setCategoryColor(e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer border"
                  />
                  <span className="text-sm text-muted-foreground">{categoryColor}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCategoryDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCategory} disabled={createCategory.isPending}>
                {createCategory.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear Categoría
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Product Dialog */}
        <Dialog open={productDialog} onOpenChange={setProductDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Producto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  placeholder="Ej: Pizza Margarita"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Precio (S/) *</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="25.00"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setProductDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateProduct} disabled={createProduct.isPending}>
                {createProduct.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear Producto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
