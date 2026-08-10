'use client'
// ============================================================
// MercadoRD — Contenido traducido de /dashboard/mensajes
// Ruta: src/app/dashboard/mensajes/MensajesContent.tsx
// ============================================================
// page.tsx es un Server Component (fetch directo a Supabase) y no
// puede usar useTranslation. Este componente recibe las conversaciones
// ya resueltas como props y se encarga de todo el texto traducido,
// incluido el helper timeAgo (necesita t()).
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'
import { BRAND } from '@/lib/colors'

interface ConversationRow {
  id: string
  last_message: string | null
  last_message_at: string
  vendor_unread: number
  buyer: { full_name: string | null; avatar_url: string | null }
}

export function MensajesContent({ rows }: { rows: ConversationRow[] }) {
  const { t } = useTranslation('dashboard')

  const timeAgo = (dateStr: string): string => {
    const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
    if (minutes < 1) return t('justNow')
    if (minutes < 60) return t('minutesAgo', { count: minutes })
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return t('hoursAgo', { count: hours })
    const days = Math.floor(hours / 24)
    if (days < 7) return t('daysAgo', { count: days })
    return new Date(dateStr).toLocaleDateString('es-DO', { day: 'numeric', month: 'short' })
  }

  return (
    <div style={{ padding: 28, background: '#f5f5f5' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{t('messagesPageTitle')}</h1>
        <p style={{ color: '#666', fontSize: 14 }}>
          {rows.length === 1 ? t('conversationCountOne', { count: rows.length }) : t('conversationCountOther', { count: rows.length })}
        </p>
      </div>

      {rows.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 48, textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
          <p style={{ color: '#999', fontSize: 14 }}>{t('noMessagesYet')}</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          {rows.map((c, i) => {
            const buyerName = c.buyer.full_name ?? t('defaultBuyerName')
            return (
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
                  <img src={c.buyer.avatar_url} alt={buyerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  buyerName.charAt(0).toUpperCase()
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{buyerName}</span>
                  <span style={{ fontSize: 12, color: '#999', flexShrink: 0 }}>{timeAgo(c.last_message_at)}</span>
                </div>
                <p style={{ fontSize: 13, color: '#666', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.last_message ?? t('noMessagesInConvo')}
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
            )
          })}
        </div>
      )}
    </div>
  )
}
