import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const subscription = await request.json()
  const { endpoint, keys: { p256dh, auth } } = subscription

  await supabase.from('push_subscriptions').upsert({
    user_id: user.id,
    endpoint,
    p256dh,
    auth
  }, { onConflict: 'user_id,endpoint' })

  return NextResponse.json({ success: true })
}
