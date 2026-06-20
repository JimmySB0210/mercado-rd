// ============================================================
// MercadoRD — Notificaciones de WhatsApp (Meta Cloud API)
// Ruta: src/lib/whatsapp/notifications.ts
// ============================================================
// Requiere variables de entorno:
//   WHATSAPP_PHONE_ID — ID del número de WhatsApp Business
//   WHATSAPP_TOKEN     — Token de acceso permanente de Meta
//
// Los templates (order_confirmed, order_shipped, etc.) deben
// estar creados y APROBADOS en Meta Business Manager antes de
// que estas funciones puedan enviar mensajes exitosamente.
// ============================================================

import type { Order } from '@/types'

// ─── Validación de configuración ────────────────────────────
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID
const WA_TOKEN = process.env.WHATSAPP_TOKEN

function isConfigured(): boolean {
  if (!WHATSAPP_PHONE_ID || !WA_TOKEN) {
    console.error(
      '[WhatsApp] Faltan variables de entorno WHATSAPP_PHONE_ID o WHATSAPP_TOKEN. ' +
      'Las notificaciones no se enviarán hasta que se configuren.'
    )
    return false
  }
  return true
}

const WA_API_URL = WHATSAPP_PHONE_ID
  ? `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`
  : ''

// ─── Tipos de templates aprobados por Meta ──────────────────
type WATemplate =
  | 'order_confirmed'
  | 'order_shipped'
  | 'order_delivered'
  | 'payment_received'
  | 'review_request'

// ─── Validación de formato de teléfono dominicano ───────────
// Acepta: 8095551234, 809-555-1234, (809) 555-1234, etc.
// Normaliza a 10 dígitos antes de anteponer el +1
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')

  // Ya viene con código de país (11 dígitos empezando en 1)
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits
  }
  // Formato local de 10 dígitos (809/829/849 + 7 dígitos)
  if (digits.length === 10) {
    return `1${digits}`
  }

  return null // formato irreconocible — no enviar
}

// ─── Enviar mensaje template ─────────────────────────────────
async function sendTemplate(
  to: string,
  template: WATemplate,
  params: string[]
): Promise<boolean> {
  if (!isConfigured()) return false

  const phone = normalizePhone(to)
  if (!phone) {
    console.error(`[WhatsApp] Número de teléfono inválido para template "${template}": "${to}"`)
    return false
  }

  try {
    const res = await fetch(WA_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WA_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: template,
          language: { code: 'es' },
          components: [{
            type: 'body',
            parameters: params.map((text) => ({ type: 'text', text })),
          }],
        },
      }),
    })

    if (!res.ok) {
      // Capturar el detalle del error HTTP (token inválido, template no
      // aprobado, número no verificado, etc.) en vez de fallar en silencio
      let errorDetail = ''
      try {
        const errorBody = await res.json()
        errorDetail = JSON.stringify(errorBody)
      } catch {
        errorDetail = await res.text().catch(() => 'sin detalle disponible')
      }
      console.error(
        `[WhatsApp] Error ${res.status} enviando template "${template}" a ${phone}: ${errorDetail}`
      )
      return false
    }

    return true
  } catch (err) {
    console.error(`[WhatsApp] Error de red enviando template "${template}":`, err)
    return false
  }
}

// ─── Notificaciones públicas ──────────────────────────────────

export async function notifyOrderConfirmed(order: Order): Promise<boolean> {
  const buyer = order.user
  if (!buyer?.phone) {
    console.warn(`[WhatsApp] Orden ${order.id} sin teléfono de comprador, no se notifica.`)
    return false
  }

  return sendTemplate(buyer.phone, 'order_confirmed', [
    buyer.full_name,
    `#${order.id.slice(0, 8).toUpperCase()}`,
    `RD$${order.total_rdp.toLocaleString()}`,
    order.delivery_type === 'express' ? 'Hoy antes de las 6pm' : '2-4 días hábiles',
  ])
}

export async function notifyOrderShipped(order: Order, trackingCode: string): Promise<boolean> {
  const buyer = order.user
  if (!buyer?.phone) {
    console.warn(`[WhatsApp] Orden ${order.id} sin teléfono de comprador, no se notifica.`)
    return false
  }

  return sendTemplate(buyer.phone, 'order_shipped', [
    buyer.full_name,
    `#${order.id.slice(0, 8).toUpperCase()}`,
    trackingCode,
  ])
}

export async function notifyOrderDelivered(order: Order): Promise<boolean> {
  const buyer = order.user
  if (!buyer?.phone) {
    console.warn(`[WhatsApp] Orden ${order.id} sin teléfono de comprador, no se notifica.`)
    return false
  }

  return sendTemplate(buyer.phone, 'order_delivered', [
    buyer.full_name,
    `#${order.id.slice(0, 8).toUpperCase()}`,
  ])
}

export async function notifyVendorPayment(
  vendorPhone: string,
  vendorName: string,
  amount: number,
  orderId: string
): Promise<boolean> {
  return sendTemplate(vendorPhone, 'payment_received', [
    vendorName,
    `RD$${amount.toLocaleString()}`,
    `#${orderId.slice(0, 8).toUpperCase()}`,
    '1 día hábil',
  ])
}

export async function requestReview(order: Order): Promise<boolean> {
  const buyer = order.user
  if (!buyer?.phone) {
    console.warn(`[WhatsApp] Orden ${order.id} sin teléfono de comprador, no se notifica.`)
    return false
  }

  return sendTemplate(buyer.phone, 'review_request', [
    buyer.full_name,
    `#${order.id.slice(0, 8).toUpperCase()}`,
  ])
}
