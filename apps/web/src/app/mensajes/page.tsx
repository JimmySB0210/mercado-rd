'use client'
// ============================================================
// MercadoRD — Mensajes (chat interno, comprador)
// Ruta: src/app/mensajes/page.tsx
// ============================================================
// Reemplaza el directorio de WhatsApp por conversaciones reales
// de la tabla conversations + chat_messages.
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/shop/Navbar'
import { BRAND } from '@/lib/colors'

interface ConversationRow {
  id: string
  last_message: string | null
  last_message_at: string
  buyer_unread: number
  vendor: {
    id: string
    business_name: string
    logo_url: string | null
  } | null
}

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

export default function MessagesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [conversations, setConversations] = useState<ConversationRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/mensajes')
        return
      }

      const { data, error } = await supabase
        .from('conversations')
        .select('id, last_message, last_message_at, buyer_unread, vendor:vendors(id, business_name, logo_url)')
        .eq('buyer_id', user.id)
        .order('last_message_at', { ascending: false })

      if (error) console.error('[MessagesPage]', error)
      setConversations((data ?? []) as any)
      setLoading(false)
    }
    load()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-400 text-sm">Cargando conversaciones...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Mensajes</h1>
        <p className="text-sm text-gray-400 mb-6">Tus conversaciones con tiendas</p>

        {conversations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4">💬</div>
            <p className="text-gray-500">Aún no tienes mensajes</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map(c => (
              <a
                key={c.id}
                href={`/mensajes/${c.id}`}
                className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 no-underline hover:bg-gray-50 transition-colors"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden"
                  style={{ background: BRAND.blue }}
                >
                  {c.vendor?.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.vendor.logo_url} alt={c.vendor.business_name} className="w-full h-full object-cover" />
                  ) : (
                    (c.vendor?.business_name ?? '?').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {c.vendor?.business_name ?? 'Vendedor'}
                    </p>
                    <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(c.last_message_at)}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{c.last_message ?? 'Sin mensajes todavía'}</p>
                </div>
                {c.buyer_unread > 0 && (
                  <span
                    className="text-white rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: BRAND.red, width: 20, height: 20, fontSize: 11, fontWeight: 700 }}
                  >
                    {c.buyer_unread > 9 ? '9+' : c.buyer_unread}
                  </span>
                )}
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
