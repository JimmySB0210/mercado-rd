// ============================================================
// MercadoRD — Verificación de Cloudflare Turnstile
// Ruta: src/app/api/verify-captcha/route.ts
// ============================================================

export async function POST(request: Request) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  // Sin clave configurada — no romper el registro en desarrollo local
  if (!secretKey) {
    return Response.json({ success: true })
  }

  const body = await request.json().catch(() => null) as { token?: string } | null
  const token = body?.token

  if (!token) {
    return Response.json({ success: false })
  }

  const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: secretKey, response: token }),
  })

  const verifyData = await verifyRes.json().catch(() => ({ success: false }))

  return Response.json({ success: !!verifyData.success })
}
