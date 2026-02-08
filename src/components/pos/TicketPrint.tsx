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
  extraCharge?: number;
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
    date,
    extraCharge
  }, ref) => {
    const paymentLabels: Record<PaymentMethod, string> = {
      efectivo: 'Efectivo',
      yape: 'Yape',
      plin: 'Plin',
      pos: 'POS',
      transferencia: 'Transferencia',
    };

    const orderTypeLabels: Record<OrderType, string> = {
      local: 'Consumo Local',
      para_llevar: 'Para Llevar',
      delivery: 'Delivery',
    };

    return (
      <div 
        ref={ref} 
        className="ticket-print" 
        style={{ 
          width: '80mm',
          backgroundColor: 'white',
          color: 'black',
          padding: '8px',
          fontFamily: "'Arial Black', 'Helvetica Neue', Arial, sans-serif",
          fontSize: '12px',
          lineHeight: '1.4',
          fontWeight: 'bold',
        }}
      >
        {/* Header with logo */}
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          {config.logoUrl && (
            <img 
              src={config.logoUrl} 
              alt="Logo" 
              style={{ width: '60px', height: '60px', margin: '0 auto 8px', objectFit: 'contain' }}
            />
          )}
          <div style={{ fontSize: '16px', fontWeight: '900', marginBottom: '4px' }}>{config.businessName}</div>
          <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>{config.businessAddress}</div>
          <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Tel: {config.businessPhone}</div>
          {config.businessRuc && (
            <div style={{ fontSize: '10px' }}>RUC: {config.businessRuc}</div>
          )}
        </div>

        {/* Separator */}
        <div style={{ borderTop: '1px dashed black', margin: '8px 0' }} />

        {/* Ticket info */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>Ticket:</span>
            <span style={{ fontWeight: 'bold' }}>{ticketNumber}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>Fecha:</span>
            <span>{date.toLocaleDateString('es-PE')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>Hora:</span>
            <span>{date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>Tipo:</span>
            <span>{orderTypeLabels[orderType]}</span>
          </div>
          {clientName && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Cliente:</span>
              <span>{clientName}</span>
            </div>
          )}
        </div>

        {/* Separator */}
        <div style={{ borderTop: '1px dashed black', margin: '8px 0' }} />

        {/* Items header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: '900', fontSize: '11px' }}>
          <span style={{ flex: 1 }}>PRODUCTO</span>
          <span style={{ width: '60px', textAlign: 'right' }}>PRECIO</span>
        </div>

        {/* Items */}
        <div style={{ marginBottom: '12px', fontFamily: "'Arial', 'Helvetica Neue', sans-serif" }}>
          {items.map((item, idx) => (
            <div key={idx} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span style={{ flex: 1 }}>{item.cantidad}x {item.nombre}</span>
                <span style={{ width: '60px', textAlign: 'right' }}>S/{item.subtotal.toFixed(2)}</span>
              </div>
              {item.cantidad > 1 && (
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#444', marginLeft: '16px' }}>
                  (S/{item.precioUnitario.toFixed(2)} c/u)
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Separator */}
        <div style={{ borderTop: '1px dashed black', margin: '8px 0' }} />

        {/* Totals */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>Subtotal:</span>
            <span>S/{subtotal.toFixed(2)}</span>
          </div>
          {discount && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', marginBottom: '2px' }}>
              <span>Descuento ({discount.tipo}):</span>
              <span>-S/{discount.monto.toFixed(2)}</span>
            </div>
          )}
          {extraCharge && extraCharge > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>Recargo adicional:</span>
              <span>+S/{extraCharge.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>
            <span>TOTAL:</span>
            <span>S/{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>Pago:</span>
            <span>{paymentLabels[paymentMethod]}</span>
          </div>
          {paymentMethod === 'efectivo' && cashReceived !== undefined && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Recibido:</span>
                <span>S/{cashReceived.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>Vuelto:</span>
                <span>S/{(change || 0).toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        {/* Separator */}
        <div style={{ borderTop: '1px dashed black', margin: '8px 0' }} />

        {/* Promo text */}
        {config.promoText && (
          <div style={{ 
            textAlign: 'center', 
            margin: '12px 0', 
            padding: '8px', 
            border: '1px dashed black',
            borderRadius: '4px'
          }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold' }}>🎉 PROMOCIÓN 🎉</div>
            <div style={{ fontSize: '10px' }}>{config.promoText}</div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '16px' }}>
          <div>{config.footerText || '¡Gracias por su preferencia!'}</div>
          <div style={{ marginTop: '4px' }}>Conserve este ticket</div>
        </div>
      </div>
    );
  }
);

TicketPrint.displayName = 'TicketPrint';

// Función para imprimir el ticket directamente usando iframe oculto
export function printTicket(element: HTMLElement, copies: number = 2) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-10000px';
  iframe.style.left = '-10000px';
  iframe.style.width = '80mm';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    console.error('No se pudo acceder al iframe de impresión');
    document.body.removeChild(iframe);
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
        font-family: 'Arial Black', 'Helvetica Neue', Arial, sans-serif;
        font-weight: bold;
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

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Ticket de Venta</title>
        ${styles}
      </head>
      <body>
        ${ticketContent}
      </body>
    </html>
  `);
  iframeDoc.close();

  // Esperar a que cargue el contenido y luego imprimir directamente
  setTimeout(() => {
    try {
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Error al imprimir:', e);
    }
    // Limpiar el iframe después de imprimir
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 250);
}
