// POS System Types

export type UserRole = 'admin' | 'vendedor' | 'repartidor';

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  activo: boolean;
  createdAt: Date;
}

export type OperationMode = 'pizzeria' | 'restaurante';

export type ProductCategory = 
  | 'pizzas' 
  | 'carnes' 
  | 'menus' 
  | 'postres' 
  | 'cervezas' 
  | 'vinos' 
  | 'gaseosas' 
  | 'cocteles' 
  | 'cremoladas' 
  | 'combos' 
  | 'otros';

export interface Product {
  id: string;
  nombre: string;
  categoria: ProductCategory;
  precio: number;
  stock: number;
  stockMinimo: number;
  requiereStock: boolean; // true = bebidas/insumos, false = pizzas/menus preparados
  activo: boolean;
  imagen?: string;
  insumoId?: string; // ID del insumo en inventario si requiere stock
  productoVence: boolean; // Si el producto tiene fecha de vencimiento
  fechaVencimiento?: Date; // Fecha de vencimiento del producto
  createdAt: Date;
  updatedAt: Date;
}

// Componente de un combo (productos que lo conforman)
export interface ComboComponente {
  productoId: string;
  cantidad: number;
  nombre?: string; // Para mostrar en UI
}

// Combo actualizado con componentes para descuento de stock
export interface ComboCompleto {
  id: string;
  nombre: string;
  descripcion?: string;
  componentes: ComboComponente[];
  precio: number;
  activo: boolean;
  temporal: boolean;
  fechaInicio?: Date;
  fechaFin?: Date;
  createdAt: Date;
}

export interface ComboProduct {
  productoId: string;
  cantidad: number;
}

export interface Combo {
  id: string;
  nombre: string;
  productos: ComboProduct[];
  precio: number;
  activo: boolean;
  temporal: boolean;
  fechaInicio?: Date;
  fechaFin?: Date;
  descripcion?: string;
  createdAt: Date;
}

export type PaymentMethod = 'efectivo' | 'yape' | 'plin' | 'transferencia';

export interface PaymentSplit {
  metodo: PaymentMethod;
  monto: number;
}

export type DiscountType = 'empleado' | 'cumpleanos' | 'promocion';

export interface Discount {
  tipo: DiscountType;
  monto: number;
  descripcion?: string;
}

export interface CartItem {
  id: string;
  type: 'product' | 'combo';
  productoId?: string;
  comboId?: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  notas?: string;
}

export type OrderType = 'local' | 'delivery' | 'para_llevar';
export type OrderStatus = 'pendiente' | 'preparacion' | 'en_camino' | 'entregado' | 'cancelado';

export interface Order {
  id: string;
  ticketNumber: string;
  items: CartItem[];
  subtotal: number;
  descuento?: Discount;
  total: number;
  pagos: PaymentSplit[];
  vuelto: number;
  tipo: OrderType;
  estado: OrderStatus;
  repartidorId?: string;
  clienteNombre?: string;
  clienteTelefono?: string;
  clienteDireccion?: string;
  usuarioId: string;
  modo: OperationMode;
  horaSalida?: Date;
  horaEntrega?: Date;
  createdAt: Date;
  syncedAt?: Date;
}

export interface CashRegister {
  id: string;
  usuarioId: string;
  montoInicial: number;
  aperturaAt: Date;
  cierreAt?: Date;
  totalEfectivo?: number;
  totalYape?: number;
  totalPlin?: number;
  totalTransferencia?: number;
  efectivoContado?: number;
  diferencia?: number;
  observaciones?: string;
  estado: 'abierta' | 'cerrada';
}

export interface DeliveryDriver {
  id: string;
  nombre: string;
  telefono?: string;
  activo: boolean;
}

export interface License {
  id: string;
  fechaActivacion: Date;
  fechaVencimiento: Date;
  diasRestantes: number;
  activa: boolean;
  tipo: '1_dia' | '3_dias' | '1_semana' | '1_mes' | '3_meses' | '6_meses' | '1_ano';
}

export type StockLevel = 'high' | 'medium' | 'low' | 'empty';

export interface InventoryItem {
  id: string;
  nombre: string;
  categoria: string;
  unidad: string;
  stock: number;
  stockMinimo: number;
  stockMaximo: number;
  createdAt: Date;
  updatedAt: Date;
}

export type MovementType = 'ingreso' | 'salida' | 'ajuste';

export interface InventoryMovement {
  id: string;
  insumoId: string;
  tipo: MovementType;
  cantidad: number;
  stockAnterior: number;
  stockFinal: number;
  motivo: string;
  usuarioId: string;
  precioUnitario?: number; // Precio por unidad al momento del movimiento
  montoTotal?: number; // Monto total = cantidad * precioUnitario
  fechaMovimiento: Date; // Fecha del ingreso/salida (puede ser diferente a createdAt)
  fechaVencimiento?: Date; // Fecha de vencimiento del lote (si aplica)
  createdAt: Date;
}

// Temas de colores disponibles
export type ThemeColor = 'orange' | 'blue' | 'green' | 'purple' | 'red' | 'teal';

export interface ThemeConfig {
  id: ThemeColor;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncAt?: Date;
  pendingChanges: number;
}
