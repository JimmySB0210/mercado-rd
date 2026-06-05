import type { Order } from '@/types';

const WA_API_URL = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`;
const WA_TOKEN   = process.env.WHATSAPP_TOKEN!;

// ─── Tipos de templates aprobados por Meta ────────────────────────────────────
type WATemplate =
  | 'order_confirmed'
  | 'order_shipped'
  | 'order_delivered'
  | 'payment_received'
  | 'review_request';

// ─── Enviar mensaje template ──────────────────────────────────────────────────

async function sendTemplate(
  to: string,
  template: WATemplate,
  params: string[]
): Promise<boolean> {
  try {
    const res = await fetch(WA_API_URL, {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${WA_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to:                `1${to}`,  // Prefijo RD: +1
        type:              'template',
        template: {
          name:     template,
          language: { code: 'es' },
          components: [{
            type:       'body',
            parameters: params.map((text) => ({ type: 'text', text })),
          }],
        },
      }),
    });
    return res.ok;
  } catch (err) {
    console.error(`WhatsApp ${template} error:`, err);
    return false;
  }
}

// ─── Notificaciones públicas ──────────────────────────────────────────────────

export async function notifyOrderConfirmed(order: Order) {
  const buyer = order.user!;
  return sendTemplate(buyer.phone, 'order_confirmed', [
    buyer.full_name,
    `#${order.id.slice(0, 8).toUpperCase()}`,
    `RD$${order.total_rdp.toLocaleString()}`,
    order.delivery_type === 'express' ? 'Hoy antes de las 6pm' : '2-4 días hábiles',
  ]);
}

export async function notifyOrderShipped(order: Order, trackingCode: string) {
  const buyer = order.user!;
  return sendTemplate(buyer.phone, 'order_shipped', [
    buyer.full_name,
    `#${order.id.slice(0, 8).toUpperCase()}`,
    trackingCode,
    '5:30 PM',
  ]);
}

export async function notifyOrderDelivered(order: Order) {
  const buyer = order.user!;
  return sendTemplate(buyer.phone, 'order_delivered', [
    buyer.full_name,
    `#${order.id.slice(0, 8).toUpperCase()}`,
  ]);
}

export async function notifyVendorPayment(
  vendorPhone: string,
  vendorName:  string,
  amount:      number,
  orderId:     string
) {
  return sendTemplate(vendorPhone, 'payment_received', [
    vendorName,
    `RD$${amount.toLocaleString()}`,
    `#${orderId.slice(0, 8).toUpperCase()}`,
    '1 día hábil',
  ]);
}

export async function requestReview(order: Order) {
  const buyer = order.user!;
  return sendTemplate(buyer.phone, 'review_request', [
    buyer.full_name,
    `#${order.id.slice(0, 8).toUpperCase()}`,
  ]);
}
