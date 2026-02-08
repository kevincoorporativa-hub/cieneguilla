import { ArrowDownCircle, ArrowUpCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { StockMove } from '@/hooks/useIngredients';

export function getStockBadge(stock: number, minStock: number) {
  if (stock === 0)
    return (
      <span className="px-3 py-1 rounded-full text-sm font-bold bg-destructive text-destructive-foreground">
        Sin stock
      </span>
    );
  if (stock <= minStock)
    return (
      <span className="px-3 py-1 rounded-full text-sm font-bold bg-warning text-warning-foreground">
        {stock}
      </span>
    );
  return (
    <span className="px-3 py-1 rounded-full text-sm font-bold bg-success text-success-foreground">
      {stock}
    </span>
  );
}

export function getMovementIcon(tipo: StockMove['move_type']) {
  switch (tipo) {
    case 'purchase':
      return <ArrowDownCircle className="h-5 w-5 text-success" />;
    case 'sale':
      return <ArrowUpCircle className="h-5 w-5 text-destructive" />;
    case 'adjustment':
      return <RefreshCw className="h-5 w-5 text-warning" />;
    case 'waste':
      return <AlertTriangle className="h-5 w-5 text-destructive" />;
  }
}

export function getMovementBadge(tipo: StockMove['move_type']) {
  switch (tipo) {
    case 'purchase':
      return (
        <span className="px-3 py-1 rounded-full text-sm font-bold bg-success/10 text-success">
          Ingreso
        </span>
      );
    case 'sale':
      return (
        <span className="px-3 py-1 rounded-full text-sm font-bold bg-destructive/10 text-destructive">
          Salida
        </span>
      );
    case 'adjustment':
      return (
        <span className="px-3 py-1 rounded-full text-sm font-bold bg-warning/10 text-warning">
          Ajuste
        </span>
      );
    case 'waste':
      return (
        <span className="px-3 py-1 rounded-full text-sm font-bold bg-destructive/10 text-destructive">
          Merma
        </span>
      );
  }
}

export function getMovementLabel(tipo: StockMove['move_type']) {
  switch (tipo) {
    case 'purchase': return 'Ingreso';
    case 'sale': return 'Salida';
    case 'adjustment': return 'Ajuste';
    case 'waste': return 'Merma';
  }
}
