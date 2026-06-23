// ============================================================
// MercadoRD — Rate limiting de checkout (protección contra card testing)
// Ruta: src/app/api/checkout/route.ts
// ============================================================
// El checkout llama a /api/checkout/rate-check, pero este endpoint
// expone el mismo chequeo bajo /api/checkout directamente.
// ============================================================

import { handleRateCheckRequest } from '@/lib/rateLimiter'

export async function POST(request: Request) {
  return handleRateCheckRequest(request)
}
