'use client'
// ============================================================
// MercadoRD — Mensajes (chat interno, comprador y/o vendedor)
// Ruta: src/app/mensajes/page.tsx
// ============================================================
// Reemplaza el directorio de WhatsApp por conversaciones reales
// de la tabla conversations + chat_messages. Sirve tanto al rol
// comprador (conversations.buyer_id) como vendedor
// (conversations.vendor_id) para que un vendor pueda entrar
// aquí desde el Navbar sin pasar por /dashboard/mensajes.
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/shop/Navbar'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatDate } from '@/lib/utils'
import { BRAND } from '@/lib/colors'

interface ConversationRow {
  id: string
  name: string | null
  avatarUrl: string | null
  lastMessage: string | null
  lastMessageAt: string
  unreadCount: number
}

function ConversationList({ rows, emptyMessage, defaultName }: { rows: ConversationRow[]; emptyMessage: string; defaultName: string }) {
  const { t, language } = useTranslation('chat')

  const timeAgo = (dateStr: string): string => {
    const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
    if (minutes < 1) return t('justNow')
    if (minutes < 60) return t('minutesAgo', { count: minutes })
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return t('hoursAgo', { count: hours })
    const days = Math.floor(hours / 24)
    if (days < 7) return t('daysAgo', { count: days })
    return formatDate(dateStr, language, { day: 'numeric', month: 'short' })
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <div className="text-5xl mb-4">💬</div>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {rows.map(c => {
        const name = c.name ?? defaultName
        return (
        <a
          key={c.id}
          href={`/mensajes/${c.id}`}
          className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 no-underline hover:bg-gray-50 transition-colors"
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden"
            style={{ background: BRAND.blue }}
          >
            {c.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
              <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(c.lastMessageAt)}</span>
            </div>
            <p className="text-xs text-gray-500 truncate mt-0.5">{c.lastMessage ?? t('noMessagesInConvoShort')}</p>
          </div>
          {c.unreadCount > 0 && (
            <span
              className="text-white rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: BRAND.red, width: 20, height: 20, fontSize: 11, fontWeight: 700 }}
            >
              {c.unreadCount > 9 ? '9+' : c.unreadCount}
            </span>
          )}
        </a>
        )
      })}
    </div>
  )
}

export default function MessagesPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useTranslation('chat')

  const [buyerConversations, setBuyerConversations] = useState<ConversationRow[]>([])
  const [vendorConversations, setVendorConversations] = useState<ConversationRow[]>([])
  const [isVendor, setIsVendor] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/mensajes')
        return
      }

      const { data: buyerConvs, error: buyerError } = await supabase
        .from('conversations')
        .select('id, last_message, last_message_at, buyer_unread, vendor:vendors(id, business_name, logo_url)')
        .eq('buyer_id', user.id)
        .order('last_message_at', { ascending: false })

      if (buyerError) console.error('[MessagesPage buyer]', buyerError)
      setBuyerConversations(
        (buyerConvs ?? []).map((c: any) => ({
          id: c.id,
          name: c.vendor?.business_name ?? null,
          avatarUrl: c.vendor?.logo_url ?? null,
          lastMessage: c.last_message,
          lastMessageAt: c.last_message_at,
          unreadCount: c.buyer_unread,
        }))
      )

      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (vendor) {
        setIsVendor(true)

        const { data: vendorConvs, error: vendorError } = await supabase
          .from('conversations')
          .select('id, buyer_id, last_message, last_message_at, vendor_unread')
          .eq('vendor_id', vendor.id)
          .order('last_message_at', { ascending: false })

        if (vendorError) console.error('[MessagesPage vendor]', vendorError)

        // Nombres de compradores — consulta separada (no embebida), mismo
        // patrón seguro ya usado en /dashboard/mensajes
        const buyerIds = [...new Set((vendorConvs ?? []).map(c => c.buyer_id))]
        const { data: buyers } = buyerIds.length > 0
          ? await supabase.from('users').select('id, full_name, avatar_url').in('id', buyerIds)
          : { data: [] as { id: string; full_name: string; avatar_url: string | null }[] }

        const buyerMap = new Map((buyers ?? []).map(b => [b.id, b]))

        setVendorConversations(
          (vendorConvs ?? []).map(c => {
            const buyer = buyerMap.get(c.buyer_id)
            return {
              id: c.id,
              name: buyer?.full_name ?? null,
              avatarUrl: buyer?.avatar_url ?? null,
              lastMessage: c.last_message,
              lastMessageAt: c.last_message_at,
              unreadCount: c.vendor_unread,
            }
          })
        )
      }

      setLoading(false)
    }
    load()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-400 text-sm">{t('loadingConversations')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('messagesPageTitle')}</h1>
        <p className="text-sm text-gray-400 mb-6">{t('messagesPageSubtitle')}</p>

        {isVendor ? (
          <div className="space-y-8">
            <section>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('asBuyerSectionTitle')}</h2>
              <ConversationList rows={buyerConversations} emptyMessage={t('emptyAsBuyer')} defaultName={t('defaultVendorName')} />
            </section>
            <section>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('asVendorSectionTitle')}</h2>
              <ConversationList rows={vendorConversations} emptyMessage={t('emptyAsVendor')} defaultName={t('defaultBuyerName')} />
            </section>
          </div>
        ) : (
          <ConversationList rows={buyerConversations} emptyMessage={t('emptyGeneric')} defaultName={t('defaultVendorName')} />
        )}
      </main>
    </div>
  )
}
