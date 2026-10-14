import webpush from 'web-push'
import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sanitizePushMessage } from '@/lib/push/validateSubscription'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// Envía una notificación push a las suscripciones del usuario de la
// sesión. Se ignora cualquier userId del body: nadie puede enviar a otro.
export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  let raw: unknown
  try { raw = await request.json() } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }
  const message = sanitizePushMessage(raw)
  if (!message.ok) return NextResponse.json({ error: message.error }, { status: 400 })

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', user.id)

  if (!subs?.length) return NextResponse.json({ sent: 0 })

  const payload = JSON.stringify(message.value)
  let sent = 0

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
      sent++
    } catch (err: any) {
      // 404 y 410: la suscripción ya no existe en el servicio push.
      if (err.statusCode === 404 || err.statusCode === 410) {
        await supabase.from('push_subscriptions')
          .delete().eq('user_id', user.id).eq('endpoint', sub.endpoint)
      }
    }
  }

  return NextResponse.json({ sent })
}
