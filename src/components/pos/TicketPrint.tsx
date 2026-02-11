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
          padding: '6px 8px',
          fontFamily: "'Lucida Console', 'Consolas', 'Courier New', monospace",
          fontSize: '11px',
          lineHeight: '1.5',
          fontWeight: 'bold',
        }}
      >
        {/* Header with logo */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          {config.logoUrl && (
            <img 
              src={config.logoUrl} 
              alt="Logo" 
              style={{ width: '70px', height: '70px', margin: '0 auto 6px', objectFit: 'contain' }}
            />
          )}
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '2px', textTransform: 'uppercase' }}>
            {config.businessName}
          </div>
          {config.businessRuc && (
            <div style={{ fontSize: '11px' }}>R.U.C. : {config.businessRuc}</div>
          )}
          <div style={{ fontSize: '11px' }}>{config.businessAddress}</div>
          <div style={{ fontSize: '11px' }}>Tel: {config.businessPhone}</div>
        </div>

        {/* Ticket de venta label */}
        <div style={{ textAlign: 'center', margin: '8px 0', fontWeight: 'bold', fontSize: '12px' }}>
          TICKET DE VENTA
        </div>
        <div style={{ textAlign: 'center', marginBottom: '6px', fontSize: '11px' }}>
          {ticketNumber}
        </div>

        {/* Separator line */}
        <div style={{ borderTop: '1px solid black', margin: '4px 0' }} />

        {/* Ticket info - left aligned like reference */}
        <div style={{ marginBottom: '4px', fontSize: '11px' }}>
          <div>FECHA  : {date.toLocaleDateString('es-PE')} {date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
        </div>

        <div style={{ borderTop: '1px solid black', margin: '4px 0' }} />

        <div style={{ marginBottom: '4px', fontSize: '11px' }}>
          <div>TIPO     : {orderTypeLabels[orderType]}</div>
          {clientName && (
            <div>CLIENTE  : {clientName}</div>
          )}
          <div>PAGO     : {paymentLabels[paymentMethod]}</div>
        </div>

        <div style={{ borderTop: '1px solid black', margin: '4px 0' }} />

        {/* Items table header */}
        <div style={{ display: 'flex', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
          <span style={{ width: '30px' }}>CANT</span>
          <span style={{ flex: 1 }}>DESCRIPCION</span>
          <span style={{ width: '50px', textAlign: 'right' }}>PRECIO</span>
          <span style={{ width: '55px', textAlign: 'right' }}>SUBTOTAL</span>
        </div>

        {/* Items */}
        <div style={{ marginBottom: '4px', fontSize: '11px' }}>
          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', marginBottom: '1px' }}>
              <span style={{ width: '30px' }}>{item.cantidad}</span>
              <span style={{ flex: 1, wordBreak: 'break-word', whiteSpace: 'normal' }}>{item.nombre}</span>
              <span style={{ width: '50px', textAlign: 'right' }}>{item.precioUnitario.toFixed(2)}</span>
              <span style={{ width: '55px', textAlign: 'right' }}>{item.subtotal.toFixed(2)}</span>
            </div>
          ))}
          {extraCharge && extraCharge > 0 && (
            <div style={{ display: 'flex', marginBottom: '1px' }}>
              <span style={{ width: '30px' }}>1</span>
              <span style={{ flex: 1 }}>RECARGO ADIC.</span>
              <span style={{ width: '50px', textAlign: 'right' }}>{extraCharge.toFixed(2)}</span>
              <span style={{ width: '55px', textAlign: 'right' }}>{extraCharge.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Separator */}
        <div style={{ borderTop: '1px solid black', margin: '4px 0' }} />

        {/* Totals */}
        <div style={{ fontSize: '11px', marginBottom: '4px' }}>
          {discount && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>DESCUENTO ({discount.tipo}):</span>
              <span>-{discount.monto.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* TOTAL grande como en la referencia */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontWeight: 'bold', 
          fontSize: '16px', 
          borderTop: '2px solid black',
          borderBottom: '1px solid black',
          padding: '6px 0',
          margin: '4px 0',
        }}>
          <span>TOTAL S/.</span>
          <span>{total.toFixed(2)}</span>
        </div>

        {/* Payment details */}
        {paymentMethod === 'efectivo' && cashReceived !== undefined && (
          <div style={{ fontSize: '11px', marginBottom: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>RECIBIDO:</span>
              <span>S/{cashReceived.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>VUELTO:</span>
              <span>S/{(change || 0).toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Promo text */}
        {config.promoText && (
          <div style={{ 
            textAlign: 'center', 
            margin: '8px 0', 
            padding: '6px', 
            border: '1px dashed black',
          }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold' }}>** PROMOCION **</div>
            <div style={{ fontSize: '10px' }}>{config.promoText}</div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '10px' }}>
          <div style={{ fontWeight: 'bold' }}>{config.footerText || 'Gracias por su preferencia!'}</div>
          <div style={{ marginTop: '2px' }}>Conserve este ticket</div>
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
        font-family: 'Lucida Console', 'Consolas', 'Courier New', monospace;
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
