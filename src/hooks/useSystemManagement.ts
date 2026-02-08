import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

// Tables that are NEVER cleared (protected)
const PROTECTED_TABLES = ['user_roles', 'employees', 'business_settings', 'licenses', 'stores', 'terminals'];

// Operational tables that can be cleared
export const OPERATIONAL_TABLES = [
  { key: 'orders', label: 'Órdenes', description: 'Pedidos y ventas registradas' },
  { key: 'order_items', label: 'Items de Órdenes', description: 'Detalle de productos vendidos' },
  { key: 'order_item_modifiers', label: 'Modificadores de Items', description: 'Extras y modificaciones' },
  { key: 'payments', label: 'Pagos', description: 'Registros de cobros realizados' },
  { key: 'cash_sessions', label: 'Sesiones de Caja', description: 'Aperturas y cierres de caja' },
  { key: 'delivery_assignments', label: 'Asignaciones Delivery', description: 'Asignaciones de repartidores' },
  { key: 'stock_moves', label: 'Movimientos de Insumos', description: 'Kardex de ingredientes' },
  { key: 'product_stock_moves', label: 'Movimientos de Productos', description: 'Kardex de productos' },
  { key: 'product_stock', label: 'Stock de Productos', description: 'Cantidades actuales de productos' },
  { key: 'ingredient_stock', label: 'Stock de Insumos', description: 'Cantidades actuales de ingredientes' },
  { key: 'customers', label: 'Clientes', description: 'Base de datos de clientes' },
  { key: 'customer_addresses', label: 'Direcciones de Clientes', description: 'Direcciones registradas' },
  { key: 'products', label: 'Productos', description: 'Catálogo de productos' },
  { key: 'product_variants', label: 'Variantes de Productos', description: 'Tamaños y variaciones' },
  { key: 'categories', label: 'Categorías', description: 'Categorías de productos' },
  { key: 'combos', label: 'Combos', description: 'Combos y promociones' },
  { key: 'combo_items', label: 'Items de Combos', description: 'Productos en combos' },
  { key: 'ingredients', label: 'Ingredientes/Insumos', description: 'Lista de insumos' },
  { key: 'product_recipes', label: 'Recetas', description: 'Fórmulas de producción' },
  { key: 'modifier_groups', label: 'Grupos de Modificadores', description: 'Grupos de extras' },
  { key: 'modifiers', label: 'Modificadores', description: 'Opciones de extras' },
  { key: 'product_modifier_groups', label: 'Relación Producto-Modificador', description: 'Asignación de extras a productos' },
  { key: 'tables', label: 'Mesas', description: 'Mesas del local' },
] as const;

// Tables to reset (transactional only, not catalog)
const RESET_TABLES = [
  'order_item_modifiers',
  'order_items',
  'payments',
  'delivery_assignments',
  'orders',
  'cash_sessions',
  'stock_moves',
  'product_stock_moves',
  'product_stock',
  'ingredient_stock',
  'customers',
  'customer_addresses',
];

// All exportable tables for backup
const BACKUP_TABLES = [
  'stores', 'terminals', 'tables',
  'categories', 'products', 'product_variants',
  'modifier_groups', 'modifiers', 'product_modifier_groups',
  'ingredients', 'ingredient_stock', 'product_recipes',
  'product_stock', 'product_stock_moves', 'stock_moves',
  'combos', 'combo_items',
  'customers', 'customer_addresses',
  'orders', 'order_items', 'order_item_modifiers',
  'payments', 'cash_sessions', 'delivery_assignments',
  'employees', 'business_settings', 'licenses',
];

async function logAuditAction(action: string, details: string) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from('audit_log').insert({
      user_id: userData.user?.id,
      action,
      details,
    });
  } catch (e) {
    console.error('Error logging audit:', e);
  }
}

export function useSystemManagement() {
  const { isAdmin } = useAuth();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleBackup = async () => {
    if (!isAdmin) {
      toast.error('Solo administradores pueden realizar backup');
      return;
    }

    setIsBackingUp(true);
    try {
      const wb = XLSX.utils.book_new();
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

      let tablesExported = 0;

      for (const tableName of BACKUP_TABLES) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(50000);

          if (error) {
            console.warn(`Skip table ${tableName}:`, error.message);
            continue;
          }

          if (data && data.length > 0) {
            const ws = XLSX.utils.json_to_sheet(data);
            // Sheet name max 31 chars
            const sheetName = tableName.length > 31 ? tableName.substring(0, 31) : tableName;
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            tablesExported++;
          }
        } catch (e) {
          console.warn(`Error exporting ${tableName}:`, e);
        }
      }

      // Add info sheet
      const infoSheet = XLSX.utils.aoa_to_sheet([
        ['BACKUP DEL SISTEMA'],
        ['Fecha y hora', now.toLocaleString('es-PE')],
        ['Tablas exportadas', tablesExported],
        [''],
        ['Este archivo contiene la copia de seguridad completa del sistema.'],
      ]);
      XLSX.utils.book_append_sheet(wb, infoSheet, '_INFO');

      XLSX.writeFile(wb, `backup_sistema_${dateStr}_${timeStr}.xlsx`);

      await logAuditAction('BACKUP', `Backup generado con ${tablesExported} tablas`);
      toast.success(`Backup creado correctamente (${tablesExported} tablas exportadas)`);
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Error al crear el backup');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleReset = async () => {
    if (!isAdmin) {
      toast.error('Solo administradores pueden resetear el sistema');
      return;
    }

    setIsResetting(true);
    try {
      // Delete in correct order (respecting foreign keys)
      for (const tableName of RESET_TABLES) {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

        if (error) {
          console.warn(`Error clearing ${tableName}:`, error.message);
        }
      }

      await logAuditAction('RESET', `Sistema reseteado. Tablas limpiadas: ${RESET_TABLES.join(', ')}`);
      toast.success('Sistema reseteado correctamente. Los datos de usuario, empresa y licencia se mantienen intactos.');
    } catch (error) {
      console.error('Error resetting system:', error);
      toast.error('Error al resetear el sistema');
    } finally {
      setIsResetting(false);
    }
  };

  const handleDelete = async (selectedTables: string[]) => {
    if (!isAdmin) {
      toast.error('Solo administradores pueden borrar datos');
      return;
    }

    if (selectedTables.length === 0) {
      toast.error('Selecciona al menos una tabla para limpiar');
      return;
    }

    // Validate no protected tables
    const protectedSelected = selectedTables.filter(t => PROTECTED_TABLES.includes(t));
    if (protectedSelected.length > 0) {
      toast.error(`No se pueden borrar tablas protegidas: ${protectedSelected.join(', ')}`);
      return;
    }

    setIsDeleting(true);
    try {
      let cleared = 0;

      // Sort tables to handle FK dependencies: children first
      const orderedTables = orderTablesForDeletion(selectedTables);

      for (const tableName of orderedTables) {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) {
          console.warn(`Error deleting from ${tableName}:`, error.message);
        } else {
          cleared++;
        }
      }

      await logAuditAction('DELETE', `Datos eliminados de ${cleared} tablas: ${orderedTables.join(', ')}`);
      toast.success(`Datos eliminados correctamente de ${cleared} tabla(s)`);
    } catch (error) {
      console.error('Error deleting data:', error);
      toast.error('Error al eliminar datos');
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isAdmin,
    isBackingUp,
    isResetting,
    isDeleting,
    handleBackup,
    handleReset,
    handleDelete,
  };
}

// Order tables so children are deleted before parents
function orderTablesForDeletion(tables: string[]): string[] {
  const dependencyOrder = [
    'order_item_modifiers',
    'order_items',
    'payments',
    'delivery_assignments',
    'orders',
    'cash_sessions',
    'combo_items',
    'combos',
    'product_modifier_groups',
    'modifiers',
    'modifier_groups',
    'product_recipes',
    'stock_moves',
    'ingredient_stock',
    'ingredients',
    'product_stock_moves',
    'product_stock',
    'product_variants',
    'products',
    'categories',
    'customer_addresses',
    'customers',
    'tables',
  ];

  const ordered: string[] = [];
  for (const t of dependencyOrder) {
    if (tables.includes(t)) ordered.push(t);
  }
  // Add any remaining that weren't in the order
  for (const t of tables) {
    if (!ordered.includes(t)) ordered.push(t);
  }
  return ordered;
}
