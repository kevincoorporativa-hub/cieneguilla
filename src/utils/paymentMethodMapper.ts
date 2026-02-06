import { PaymentMethod as POSPaymentMethod } from '@/types/pos';
import { PaymentMethod as DBPaymentMethod } from '@/hooks/useOrders';

// Map frontend payment methods to database payment methods
export function mapPaymentMethodToDb(frontendMethod: POSPaymentMethod): DBPaymentMethod {
  const mapping: Record<POSPaymentMethod, DBPaymentMethod> = {
    'efectivo': 'cash',
    'yape': 'yape',
    'plin': 'plin',
    'transferencia': 'transfer',
    'pos': 'pos',
  };
  return mapping[frontendMethod] || 'cash';
}

// Map database payment methods to frontend payment methods
export function mapPaymentMethodFromDb(dbMethod: DBPaymentMethod): POSPaymentMethod {
  const mapping: Record<DBPaymentMethod, POSPaymentMethod> = {
    'cash': 'efectivo',
    'card': 'pos', // Legacy card -> POS
    'yape': 'yape',
    'plin': 'plin',
    'transfer': 'transferencia',
    'pos': 'pos',
  };
  return mapping[dbMethod] || 'efectivo';
}

// Map frontend order type to database order type
export type DBOrderType = 'local' | 'takeaway' | 'delivery';
export type POSOrderType = 'local' | 'para_llevar' | 'delivery';

export function mapOrderTypeToDb(frontendType: POSOrderType): DBOrderType {
  const mapping: Record<POSOrderType, DBOrderType> = {
    'local': 'local',
    'para_llevar': 'takeaway',
    'delivery': 'delivery',
  };
  return mapping[frontendType] || 'local';
}

export function mapOrderTypeFromDb(dbType: DBOrderType): POSOrderType {
  const mapping: Record<DBOrderType, POSOrderType> = {
    'local': 'local',
    'takeaway': 'para_llevar',
    'delivery': 'delivery',
  };
  return mapping[dbType] || 'local';
}
