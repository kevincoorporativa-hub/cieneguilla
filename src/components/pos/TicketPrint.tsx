import { forwardRef } from 'react';
import { CartItem, Discount, OrderType, PaymentMethod } from '@/types/pos';

export interface TicketConfig {
  logoUrl?: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessRuc?: string;
  promoText?: string;
  footerText?: string;
}

interface TicketPrintProps {
  ticketNumber: string;
  items: CartItem[];
  subtotal: number;
  discount?: Discount;
  total: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  change?: number;
  orderType: OrderType;
  clientName?: string;
  config: TicketConfig;
  date: Date;
}

export const TicketPrint = forwardRef<HTMLDivElement, TicketPrintProps>(
  ({ 
    ticketNumber, 
    items, 
    subtotal, 
    discount, 
    total, 
    paymentMethod, 
    cashReceived, 
    change, 
    orderType, 
    clientName,
    config, 
    date 
  }, ref) => {
    const paymentLabels: Record<PaymentMethod, string> = {
      efectivo: 'Efectivo',
      yape: 'Yape',
      plin: 'Plin',
      transferencia: 'Transferencia',
    };

    const orderTypeLabels: Record<OrderType, string> = {
      local: 'Consumo Local',
      para_llevar: 'Para Llevar',
      delivery: 'Delivery',
    };

    return (
      <div ref={ref} className="ticket-print bg-white text-black p-4 font-mono text-sm" style={{ width: '80mm' }}>
        {/* Header with logo */}
        <div className="text-center mb-4">
          {config.logoUrl && (
            <img 
              src={config.logoUrl} 
              alt="Logo" 
              className="w-16 h-16 mx-auto mb-2 object-contain"
            />
          )}
          <h1 className="text-lg font-bold">{config.businessName}</h1>
          <p className="text-xs">{config.businessAddress}</p>
          <p className="text-xs">Tel: {config.businessPhone}</p>
          {config.businessRuc && (
            <p className="text-xs">RUC: {config.businessRuc}</p>
          )}
        </div>

        {/* Separator */}
        <div className="border-t border-dashed border-black my-2" />

        {/* Ticket info */}
        <div className="mb-3">
          <div className="flex justify-between">
            <span>Ticket:</span>
            <span className="font-bold">{ticketNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Fecha:</span>
            <span>{date.toLocaleDateString('es-PE')}</span>
          </div>
          <div className="flex justify-between">
            <span>Hora:</span>
            <span>{date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex justify-between">
            <span>Tipo:</span>
            <span>{orderTypeLabels[orderType]}</span>
          </div>
          {clientName && (
            <div className="flex justify-between">
              <span>Cliente:</span>
              <span>{clientName}</span>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="border-t border-dashed border-black my-2" />

        {/* Items */}
        <div className="mb-3">
          {items.map((item, idx) => (
            <div key={idx} className="mb-1">
              <div className="flex justify-between">
                <span className="flex-1">{item.cantidad}x {item.nombre}</span>
                <span>S/{item.subtotal.toFixed(2)}</span>
              </div>
              {item.cantidad > 1 && (
                <div className="text-xs text-gray-600 ml-4">
                  (S/{item.precioUnitario.toFixed(2)} c/u)
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Separator */}
        <div className="border-t border-dashed border-black my-2" />

        {/* Totals */}
        <div className="mb-3">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>S/{subtotal.toFixed(2)}</span>
          </div>
          {discount && (
            <div className="flex justify-between text-green-600">
              <span>Descuento ({discount.tipo}):</span>
              <span>-S/{discount.monto.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base mt-1">
            <span>TOTAL:</span>
            <span>S/{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment */}
        <div className="mb-3">
          <div className="flex justify-between">
            <span>Pago:</span>
            <span>{paymentLabels[paymentMethod]}</span>
          </div>
          {paymentMethod === 'efectivo' && cashReceived !== undefined && (
            <>
              <div className="flex justify-between">
                <span>Recibido:</span>
                <span>S/{cashReceived.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Vuelto:</span>
                <span>S/{(change || 0).toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        {/* Separator */}
        <div className="border-t border-dashed border-black my-2" />

        {/* Promo text */}
        {config.promoText && (
          <div className="text-center my-3 p-2 border border-dashed border-black">
            <p className="text-xs font-bold">🎉 PROMOCIÓN 🎉</p>
            <p className="text-xs">{config.promoText}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs mt-4">
          <p>{config.footerText || '¡Gracias por su preferencia!'}</p>
          <p className="mt-1">Conserve este ticket</p>
        </div>
      </div>
    );
  }
);

TicketPrint.displayName = 'TicketPrint';

// Función para imprimir el ticket
export function printTicket(element: HTMLElement, copies: number = 2) {
  const printWindow = window.open('', '_blank', 'width=320,height=600');
  if (!printWindow) {
    console.error('No se pudo abrir la ventana de impresión');
    return;
  }

  const styles = `
    <style>
      @page {
        size: 80mm auto;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
        font-family: 'Courier New', monospace;
      }
      .ticket-print {
        page-break-after: always;
      }
      .ticket-print:last-child {
        page-break-after: auto;
      }
    </style>
  `;

  // Crear contenido para las copias
  let ticketContent = '';
  for (let i = 0; i < copies; i++) {
    ticketContent += `
      <div class="ticket-print" style="padding: 10px;">
        ${element.innerHTML}
        ${i < copies - 1 ? '<div style="page-break-after: always;"></div>' : ''}
      </div>
    `;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Ticket de Venta</title>
        ${styles}
      </head>
      <body>
        ${ticketContent}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
