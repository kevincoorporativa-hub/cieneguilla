import { useState } from 'react';
import { 
  Download, 
  RefreshCw, 
  Trash2, 
  AlertTriangle, 
  Shield, 
  Loader2,
  Database,
  CheckSquare,
  Square
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSystemManagement, OPERATIONAL_TABLES } from '@/hooks/useSystemManagement';

export function SystemManagementTab() {
  const {
    isAdmin,
    isBackingUp,
    isResetting,
    isDeleting,
    handleBackup,
    handleReset,
    handleDelete,
  } = useSystemManagement();

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [confirmText, setConfirmText] = useState('');

  // Protected tables that cannot be selected for deletion
  const PROTECTED = ['user_roles', 'employees', 'business_settings', 'licenses', 'stores', 'terminals'];

  const toggleTable = (key: string) => {
    setSelectedTables(prev =>
      prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]
    );
  };

  const selectAll = () => {
    const all = OPERATIONAL_TABLES.map(t => t.key).filter(k => !PROTECTED.includes(k));
    setSelectedTables(all);
  };

  const deselectAll = () => setSelectedTables([]);

  if (!isAdmin) {
    return (
      <Card className="border-2 max-w-2xl">
        <CardContent className="p-8 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acceso Restringido</h3>
          <p className="text-muted-foreground">
            Solo los administradores pueden acceder a las herramientas de gestión del sistema.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header warning */}
      <Card className="border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-200">Zona de Administración del Sistema</p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Las acciones de esta sección son críticas. Se recomienda realizar un backup antes de resetear o borrar datos.
              Todas las acciones quedan registradas en el log de auditoría.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* BACKUP */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-emerald-600" />
            Backup del Sistema
          </CardTitle>
          <CardDescription>
            Genera una copia de seguridad completa en formato Excel (.xlsx)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Exporta todas las tablas del sistema a un archivo Excel</li>
            <li>Mantiene la estructura de columnas y datos</li>
            <li>Incluye fecha y hora de generación</li>
            <li>El archivo se descarga automáticamente</li>
          </ul>
          <Button
            onClick={handleBackup}
            disabled={isBackingUp}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isBackingUp ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando Backup...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generar Backup Excel
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* RESETEAR */}
      <Card className="border-2 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-amber-600" />
            Resetear Sistema
          </CardTitle>
          <CardDescription>
            Reinicia el sistema como si empezara desde cero (sin eliminar tablas)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Limpia todas las tablas transaccionales (ventas, pagos, caja, stock, clientes)</li>
            <li><strong>NO elimina:</strong> Usuarios, Empresa, Licencia, Sucursales</li>
            <li>Mantiene intacta la estructura de todas las tablas</li>
            <li>Mantiene el catálogo de productos, categorías, combos e insumos</li>
          </ul>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              ⚠️ Se eliminarán: Órdenes, Pagos, Sesiones de caja, Movimientos de stock, Clientes
            </p>
          </div>
          <Button
            onClick={() => setShowResetDialog(true)}
            disabled={isResetting}
            variant="outline"
            className="w-full sm:w-auto border-amber-500 text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30"
          >
            {isResetting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Reseteando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Resetear Sistema
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* BORRAR */}
      <Card className="border-2 border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Borrar Datos Específicos
          </CardTitle>
          <CardDescription>
            Selecciona qué tablas deseas limpiar para liberar espacio de almacenamiento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/30">
            <p className="text-sm font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              ADVERTENCIA: La eliminación de datos es IRREVERSIBLE
            </p>
            <p className="text-xs text-destructive/80 mt-1">
              Se recomienda generar un backup antes de proceder. Las tablas de Usuario, Empresa y Licencia nunca serán afectadas.
            </p>
          </div>

          {/* Select buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              <CheckSquare className="h-4 w-4 mr-1" />
              Seleccionar todo
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>
              <Square className="h-4 w-4 mr-1" />
              Deseleccionar todo
            </Button>
          </div>

          {/* Table selection grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1">
            {OPERATIONAL_TABLES.map((table) => {
              const isProtected = PROTECTED.includes(table.key);
              const isSelected = selectedTables.includes(table.key);

              return (
                <label
                  key={table.key}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isProtected
                      ? 'opacity-50 cursor-not-allowed bg-muted'
                      : isSelected
                      ? 'border-destructive/50 bg-destructive/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => !isProtected && toggleTable(table.key)}
                    disabled={isProtected}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{table.label}</p>
                    <p className="text-xs text-muted-foreground">{table.description}</p>
                    {isProtected && (
                      <span className="text-xs text-amber-600 font-medium">🔒 Protegida</span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          <Separator />

          <Button
            onClick={() => {
              if (selectedTables.length === 0) return;
              setConfirmText('');
              setShowDeleteDialog(true);
            }}
            disabled={isDeleting || selectedTables.length === 0}
            variant="destructive"
            className="w-full sm:w-auto"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Borrar Datos Seleccionados ({selectedTables.length})
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* RESET Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              ¿Resetear el sistema?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Esta acción eliminará <strong>todos los datos transaccionales</strong> del sistema:
                órdenes, pagos, sesiones de caja, movimientos de stock y clientes.
              </p>
              <p className="font-medium">
                Los datos de usuarios, empresa, licencia y catálogo de productos se mantendrán intactos.
              </p>
              <p className="text-destructive font-semibold">
                Esta acción NO se puede deshacer.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleReset();
                setShowResetDialog(false);
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sí, Resetear Sistema
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DELETE Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              ¿Eliminar datos seleccionados?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Estás a punto de eliminar los datos de las siguientes tablas:</p>
              <ul className="list-disc list-inside text-sm space-y-1 max-h-32 overflow-y-auto">
                {selectedTables.map(key => {
                  const table = OPERATIONAL_TABLES.find(t => t.key === key);
                  return <li key={key}>{table?.label || key}</li>;
                })}
              </ul>
              <p className="text-destructive font-semibold text-base">
                ⚠️ Esta acción es IRREVERSIBLE. Todos los registros de las tablas seleccionadas serán eliminados permanentemente.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleDelete(selectedTables);
                setShowDeleteDialog(false);
                setSelectedTables([]);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Sí, Eliminar Datos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
