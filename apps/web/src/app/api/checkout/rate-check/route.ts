// ============================================================
// MercadoRD — Rate limiting de checkout (protección contra card testing)
// Ruta: src/app/api/checkout/rate-check/route.ts
// ============================================================
// Endpoint que llama checkout/page.tsx: { action: 'check' } antes de
// processPayment(), { action: 'fail' } cuando la tarjeta es rechazada.
// ============================================================

import { handleRateCheckRequest } from '@/lib/rateLimiter'

export async function POST(request: Request) {
  return handleRateCheckRequest(request)
}
