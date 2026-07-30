// ============================================================
// MercadoRD — Mensajes (vendor dashboard)
// Ruta: src/app/dashboard/mensajes/page.tsx
// ============================================================

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentVendor } from '@/lib/queries/vendor-dashboard'
import { DashboardSidebar } from '@/components/vendor/DashboardSidebar'
import { BRAND } from '@/lib/colors'

function timeAgo(dateStr: string): string {
  const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days}d`
  return new Date(dateStr).toLocaleDateString('es-DO', { day: 'numeric', month: 'short' })
}

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

  const rows = (conversations ?? []).map(c => ({
    ...c,
    buyer: buyerMap.get(c.buyer_id) ?? { full_name: 'Comprador', avatar_url: null },
  }))

  return (
    <div className="dashboard-grid" style={{ minHeight: '100vh', fontFamily: 'inherit' }}>

      <DashboardSidebar />

      <div style={{ padding: 28, background: '#f5f5f5' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Mensajes</h1>
          <p style={{ color: '#666', fontSize: 14 }}>
            {rows.length} {rows.length === 1 ? 'conversación' : 'conversaciones'}
          </p>
        </div>

        {rows.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: 48, textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <p style={{ color: '#999', fontSize: 14 }}>Aún no tienes mensajes</p>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            {rows.map((c, i) => (
              <a
                key={c.id}
                href={`/mensajes/${c.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
                  borderBottom: i < rows.length - 1 ? '1px solid #f8f8f8' : 'none',
                  textDecoration: 'none', color: 'inherit',
                }}
              >
                <div
                  style={{
                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                    background: BRAND.blue, color: '#fff', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                  }}
                >
                  {c.buyer.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.buyer.avatar_url} alt={c.buyer.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    c.buyer.full_name.charAt(0).toUpperCase()
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{c.buyer.full_name}</span>
                    <span style={{ fontSize: 12, color: '#999', flexShrink: 0 }}>{timeAgo(c.last_message_at)}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#666', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.last_message ?? 'Sin mensajes todavía'}
                  </p>
                </div>
                {c.vendor_unread > 0 && (
                  <span
                    style={{
                      background: BRAND.red, color: '#fff', borderRadius: '50%',
                      width: 20, height: 20, fontSize: 11, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                  >
                    {c.vendor_unread > 9 ? '9+' : c.vendor_unread}
                  </span>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
