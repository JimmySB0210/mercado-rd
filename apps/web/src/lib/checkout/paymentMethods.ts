// ============================================================
// MercadoRD — Métodos de pago del checkout y su estado real
// Ruta: src/lib/checkout/paymentMethods.ts
// ============================================================
// Qué se le muestra al comprador depende de lo que cada método HACE hoy,
// no de lo que dice su nombre:
//
//   simulated   · Tarjeta (Azul). processPayment (lib/payments/azul.ts) corre
//                 en el navegador y siempre responde en modo simulado: aprueba
//                 cualquier tarjeta salvo una que termine en 0000 y no cobra
//                 nada. AZUL_MODE=live no puede activarse desde el navegador
//                 (las claves de Azul son del servidor).
//   manual      · Transferencia y Efectivo. No hay cobro en línea: el pedido
//                 se crea pendiente y el pago se coordina fuera del checkout.
//   unavailable · Tarjeta (CardNet). No hay ninguna integración: se muestra
//                 pero no se puede elegir.
//
// ANTES DE LANZAR: o se integra el cobro real de Azul en el servidor (ruta con
// las claves; el pago y la confirmación del pedido los escribe el servidor con
// una función nueva solo para service_role — record_payment no sirve tal como
// está: exige auth.uid() — y el comprador nunca escribe en `payments`) o se
// quitan de esta lista los métodos de tarjeta para que los clientes reales solo
// vean transferencia y efectivo. El método por defecto se toma de aquí: el
// primero que se pueda elegir.
// ============================================================

import type { CheckoutDict } from '@/lib/i18n/es/checkout'

export type PaymentMethodId = 'azul' | 'cardnet' | 'transfer' | 'cash'
export type PaymentMethodStatus = 'simulated' | 'manual' | 'unavailable'

export interface PaymentMethodOption {
  id: PaymentMethodId
  labelKey: keyof CheckoutDict
  hintKey: keyof CheckoutDict
  status: PaymentMethodStatus
}

export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  { id: 'azul',     labelKey: 'paymentAzulLabel',     hintKey: 'paymentAzulHint',     status: 'simulated' },
  { id: 'cardnet',  labelKey: 'paymentCardnetLabel',  hintKey: 'paymentCardnetHint',  status: 'unavailable' },
  { id: 'transfer', labelKey: 'paymentTransferLabel', hintKey: 'paymentTransferHint', status: 'manual' },
  { id: 'cash',     labelKey: 'paymentCashLabel',     hintKey: 'paymentCashHint',     status: 'manual' },
]

export function paymentMethodStatus(id: string): PaymentMethodStatus | null {
  return PAYMENT_METHOD_OPTIONS.find(m => m.id === id)?.status ?? null
}

// Se puede elegir y enviar el pedido con él.
export function isPaymentMethodSelectable(id: string): boolean {
  const status = paymentMethodStatus(id)
  return status !== null && status !== 'unavailable'
}

export const DEFAULT_PAYMENT_METHOD: PaymentMethodId =
  PAYMENT_METHOD_OPTIONS.find(m => m.status !== 'unavailable')?.id ?? 'transfer'
