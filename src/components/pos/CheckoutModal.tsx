import { useState, useRef } from 'react';
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Building, 
  X,
  Check,
  Truck,
  MapPin,
  User,
  Phone,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CartItem, PaymentMethod, OrderType, Discount, Product, ComboCompleto } from '@/types/pos';
import { TicketPrint, TicketConfig, printTicket } from './TicketPrint';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
  discount?: Discount;
  subtotal: number;
  products: Product[];
  combos: ComboCompleto[];
  onConfirm: (data: CheckoutData) => void;
  ticketConfig: TicketConfig;
}

interface CheckoutData {
  orderType: OrderType;
  payments: { method: PaymentMethod; amount: number }[];
  clientName?: string;
  clientPhone?: string;
  clientAddress?: string;
  change: number;
  stockDeductions: { productId: string; quantity: number }[];
}

const paymentMethods: { id: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { id: 'efectivo', label: 'Efectivo', icon: Banknote },
  { id: 'yape', label: 'Yape', icon: Smartphone },
  { id: 'plin', label: 'Plin', icon: Smartphone },
  { id: 'transferencia', label: 'Transferencia', icon: Building },
];

export function CheckoutModal({ 
  isOpen, 
  onClose, 
  items, 
  total, 
  discount,
  subtotal,
  products,
  combos,
  onConfirm,
  ticketConfig 
}: CheckoutModalProps) {
  const [orderType, setOrderType] = useState<OrderType>('local');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('efectivo');
  const [cashReceived, setCashReceived] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [showTicketPreview, setShowTicketPreview] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  
  const ticketRef = useRef<HTMLDivElement>(null);

  const cashAmount = parseFloat(cashReceived) || 0;
  const change = selectedPayment === 'efectivo' ? Math.max(0, cashAmount - total) : 0;

  // Calcular descuentos de stock para productos que lo requieren
  const calculateStockDeductions = (): { productId: string; quantity: number }[] => {
    const deductions: { productId: string; quantity: number }[] = [];

    items.forEach(item => {
      if (item.type === 'product' && item.productoId) {
        const product = products.find(p => p.id === item.productoId);
        if (product?.requiereStock) {
          deductions.push({ productId: item.productoId, quantity: item.cantidad });
        }
      } else if (item.type === 'combo' && item.comboId) {
        const combo = combos.find(c => c.id === item.comboId);
        if (combo) {
          combo.componentes.forEach(comp => {
            const product = products.find(p => p.id === comp.productoId);
            if (product?.requiereStock) {
              const existing = deductions.find(d => d.productId === comp.productoId);
              if (existing) {
                existing.quantity += comp.cantidad * item.cantidad;
              } else {
                deductions.push({ 
                  productId: comp.productoId, 
                  quantity: comp.cantidad * item.cantidad 
                });
              }
            }
          });
        }
      }
    });

    return deductions;
  };

  const handleConfirm = () => {
    const newTicketNumber = `T${Date.now().toString().slice(-6)}`;
    setTicketNumber(newTicketNumber);
    
    const stockDeductions = calculateStockDeductions();
    
    onConfirm({
      orderType,
      payments: [{ method: selectedPayment, amount: total }],
      clientName: orderType === 'delivery' ? clientName : undefined,
      clientPhone: orderType === 'delivery' ? clientPhone : undefined,
      clientAddress: orderType === 'delivery' ? clientAddress : undefined,
      change,
      stockDeductions,
    });

    setShowTicketPreview(true);
  };

  const handlePrintAndClose = () => {
    if (ticketRef.current) {
      printTicket(ticketRef.current, 2); // Imprimir 2 copias
    }
    setShowTicketPreview(false);
    onClose();
  };

  const handleCloseWithoutPrint = () => {
    setShowTicketPreview(false);
    onClose();
  };

  const quickAmounts = [10, 20, 50, 100, 200];

  const stockDeductionsPreview = calculateStockDeductions();

  if (showTicketPreview) {
    return (
      <Dialog open={isOpen} onOpenChange={handleCloseWithoutPrint}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-pos-xl flex items-center gap-2">
              <Printer className="h-6 w-6" />
              Ticket Generado
            </DialogTitle>
          </DialogHeader>
          
          <div className="bg-gray-100 p-4 rounded-xl max-h-96 overflow-auto">
            <TicketPrint
              ref={ticketRef}
              ticketNumber={ticketNumber}
              items={items}
              subtotal={subtotal}
              discount={discount}
              total={total}
              paymentMethod={selectedPayment}
              cashReceived={selectedPayment === 'efectivo' ? cashAmount : undefined}
              change={selectedPayment === 'efectivo' ? change : undefined}
              orderType={orderType}
              clientName={orderType === 'delivery' ? clientName : undefined}
              config={ticketConfig}
              date={new Date()}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={handleCloseWithoutPrint}>
              Sin imprimir
            </Button>
            <Button className="flex-1 bg-primary" onClick={handlePrintAndClose}>
              <Printer className="h-5 w-5 mr-2" />
              Imprimir 2 copias
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-pos-xl flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Cobrar - S/ {total.toFixed(2)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Type */}
          <div className="space-y-3">
            <label className="text-pos-base font-semibold">Tipo de pedido</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setOrderType('local')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  orderType === 'local'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="text-2xl">🍽️</span>
                <p className="font-semibold mt-2">Local</p>
              </button>
              <button
                onClick={() => setOrderType('para_llevar')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  orderType === 'para_llevar'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="text-2xl">📦</span>
                <p className="font-semibold mt-2">Para llevar</p>
              </button>
              <button
                onClick={() => setOrderType('delivery')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  orderType === 'delivery'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Truck className="h-8 w-8 mx-auto text-primary" />
                <p className="font-semibold mt-2">Delivery</p>
              </button>
            </div>
          </div>

          {/* Delivery info */}
          {orderType === 'delivery' && (
            <div className="space-y-3 p-4 bg-muted rounded-xl">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" /> Cliente
                  </label>
                  <Input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nombre del cliente"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Teléfono
                  </label>
                  <Input
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="987654321"
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Dirección
                </label>
                <Input
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Dirección de entrega"
                  className="h-12 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Stock deductions preview */}
          {stockDeductionsPreview.length > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
              <p className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                📦 Descuento automático de stock:
              </p>
              <div className="space-y-1">
                {stockDeductionsPreview.map((deduction, idx) => {
                  const product = products.find(p => p.id === deduction.productId);
                  return (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-blue-700 dark:text-blue-300">{product?.nombre}</span>
                      <span className="font-medium text-blue-800 dark:text-blue-200">
                        -{deduction.quantity} unidades
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-3">
            <label className="text-pos-base font-semibold">Método de pago</label>
            <div className="grid grid-cols-4 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    selectedPayment === method.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <method.icon className="h-8 w-8 mx-auto text-primary" />
                  <p className="font-semibold mt-2">{method.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Cash input */}
          {selectedPayment === 'efectivo' && (
            <div className="space-y-3">
              <label className="text-pos-base font-semibold">Efectivo recibido</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pos-lg font-bold text-muted-foreground">
                  S/
                </span>
                <Input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="0.00"
                  className="pl-12 h-16 text-pos-xl font-bold rounded-xl"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  className="h-14 px-5 font-bold text-lg bg-success/10 text-success border-2 border-success hover:bg-success hover:text-success-foreground"
                  onClick={() => setCashReceived(String(total))}
                >
                  Exacto
                </Button>
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    className="h-14 px-5 font-bold text-lg border-2"
                    onClick={() => setCashReceived(String(amount))}
                  >
                    S/ {amount}
                  </Button>
                ))}
              </div>

              {cashAmount >= total && (
                <div className="p-4 bg-success/10 rounded-xl border-2 border-success">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-pos-lg">Vuelto:</span>
                    <span className="font-bold text-pos-2xl text-success">S/ {change.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Total summary */}
          <div className="p-4 bg-primary/10 rounded-xl border-2 border-primary">
            <div className="flex justify-between items-center">
              <span className="font-bold text-pos-lg">TOTAL A COBRAR:</span>
              <span className="font-bold text-pos-2xl text-primary">S/ {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1 btn-pos"
              onClick={onClose}
            >
              <X className="h-5 w-5 mr-2" />
              Cancelar
            </Button>
            <Button
              className="flex-1 btn-pos-xl bg-success hover:bg-success/90"
              onClick={handleConfirm}
              disabled={selectedPayment === 'efectivo' && cashAmount < total}
            >
              <Check className="h-6 w-6 mr-2" />
              Confirmar Venta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
