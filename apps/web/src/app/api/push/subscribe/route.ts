import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isValidPushEndpoint, validateSubscription } from '@/lib/push/validateSubscription'

// La forma se valida antes de tocar la base (mismos hosts que la
// restricción push_subscriptions_endpoint_check). Los errores de la base
// no se devuelven al cliente.
export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  let raw: unknown
  try { raw = await request.json() } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }
  const parsed = validateSubscription(raw)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const { endpoint, p256dh, auth } = parsed.value
  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: user.id,
    endpoint,
    p256dh,
    auth
  }, { onConflict: 'user_id,endpoint' })

  if (error) {
    console.error('[push/subscribe]', error)
    // 23514 = restricción CHECK de la base (forma no aceptada).
    return error.code === '23514'
      ? NextResponse.json({ error: 'Suscripción no válida' }, { status: 400 })
      : NextResponse.json({ error: 'No se pudo guardar la suscripción' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  let raw: { endpoint?: unknown } | null
  try { raw = await request.json() } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }
  if (!isValidPushEndpoint(raw?.endpoint)) return NextResponse.json({ error: 'Endpoint de notificaciones no válido' }, { status: 400 })

  const { error } = await supabase.from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', raw.endpoint)

  if (error) {
    console.error('[push/subscribe DELETE]', error)
    return NextResponse.json({ error: 'No se pudo borrar la suscripción' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
