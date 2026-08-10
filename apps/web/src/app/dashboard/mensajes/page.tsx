// ============================================================
// MercadoRD — Mensajes (vendor dashboard)
// Ruta: src/app/dashboard/mensajes/page.tsx
// ============================================================
// Server Component — el texto traducido (incluido timeAgo) vive en
// MensajesContent (Client Component).
// ============================================================

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentVendor } from '@/lib/queries/vendor-dashboard'
import { DashboardSidebar } from '@/components/vendor/DashboardSidebar'
import { MensajesContent } from './MensajesContent'

export default async function VendorMessagesPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/dashboard/mensajes')

  const vendor = await getCurrentVendor()
  if (!vendor) redirect('/vendor/register')

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('id, buyer_id, last_message, last_message_at, vendor_unread')
    .eq('vendor_id', vendor.id)
    .order('last_message_at', { ascending: false })

  if (error) console.error('[VendorMessagesPage]', error)

  // Nombres de compradores — consulta separada (no embebida), mismo
  // patrón seguro ya usado en el resto del dashboard/admin
  const buyerIds = [...new Set((conversations ?? []).map(c => c.buyer_id))]
  const { data: buyers } = buyerIds.length > 0
    ? await supabase.from('users').select('id, full_name, avatar_url').in('id', buyerIds)
    : { data: [] as { id: string; full_name: string; avatar_url: string | null }[] }

  const buyerMap = new Map((buyers ?? []).map(b => [b.id, b]))

  // full_name null → MensajesContent resuelve el fallback traducido ("Comprador")
  const rows = (conversations ?? []).map(c => ({
    ...c,
    buyer: buyerMap.get(c.buyer_id) ?? { full_name: null, avatar_url: null },
  }))

  return (
    <div className="dashboard-grid" style={{ minHeight: '100vh', fontFamily: 'inherit' }}>
      <DashboardSidebar />
      <MensajesContent rows={rows} />
    </div>
  )
}
