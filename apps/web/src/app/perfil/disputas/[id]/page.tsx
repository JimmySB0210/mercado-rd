'use client'
// ============================================================
// MercadoRD — Detalle de disputa (comprador)
// Ruta: src/app/perfil/disputas/[id]/page.tsx
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/shop/Navbar'
import { BRAND } from '@/lib/colors'

interface DisputeDetail {
  id: string
  order_id: string
  reason: string
  description: string
  status: string
  resolution: string | null
  created_at: string
}

interface MessageRow {
  id: string
  sender_id: string
  sender_role: string
  message: string
  created_at: string
}

const REASON_LABELS: Record<string, string> = {
  not_received: 'No recibí el pedido',
  not_as_described: 'No es como se describe',
  damaged: 'Llegó dañado',
  wrong_item: 'Producto equivocado',
  refund_request: 'Solicito reembolso',
  other: 'Otro',
}

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  open:      { label: 'Abierta',     bg: '#FEF9C3', text: '#713f12' },
  reviewing: { label: 'En revisión', bg: '#DBEAFE', text: '#1e3a8a' },
  resolved:  { label: 'Resuelta',    bg: '#DCFCE7', text: '#166534' },
  closed:    { label: 'Cerrada',     bg: '#F3F4F6', text: '#666' },
}

export default function DisputeDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [dispute, setDispute] = useState<DisputeDetail | null>(null)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/login?redirect=/perfil/disputas/${params.id}`)
      return
    }
    setUserId(user.id)

    const { data: disputeData, error: disputeError } = await supabase
      .from('disputes')
      .select('id, order_id, reason, description, status, resolution, created_at')
      .eq('id', params.id)
      .single()

    if (disputeError || !disputeData) {
      console.error('[DisputeDetailPage]', disputeError)
      setLoading(false)
      return
    }
    setDispute(disputeData)

    const { data: messagesData } = await supabase
      .from('dispute_messages')
      .select('id, sender_id, sender_role, message, created_at')
      .eq('dispute_id', params.id)
      .order('created_at', { ascending: true })

    setMessages(messagesData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || !userId || !dispute) return
    setSending(true)
    setError(null)

    const { error: insertError } = await supabase
      .from('dispute_messages')
      .insert({
        dispute_id: dispute.id,
        sender_id: userId,
        sender_role: 'buyer',
        message: newMessage.trim(),
      })

    if (insertError) {
      console.error('[DisputeDetailPage send]', insertError)
      setError('No se pudo enviar el mensaje. Intenta de nuevo.')
      setSending(false)
      return
    }

    setNewMessage('')
    setSending(false)
    load()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-400 text-sm">Cargando disputa...</div>
        </div>
      </div>
    )
  }

  if (!dispute) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <p className="text-gray-500">No se encontró esta disputa.</p>
          <a href="/perfil/disputas" className="text-blue-600 underline mt-4 inline-block">Volver a mis disputas</a>
        </div>
      </div>
    )
  }

  const shortId = dispute.order_id.split('-')[0].toUpperCase()
  const status = STATUS_LABELS[dispute.status] ?? STATUS_LABELS.open
  const isClosed = dispute.status === 'resolved' || dispute.status === 'closed'
  const date = new Date(dispute.created_at).toLocaleDateString('es-DO', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <a href="/perfil/disputas" className="text-sm no-underline" style={{ color: BRAND.gray }}>
          ← Volver a mis disputas
        </a>

        {/* Info de la disputa */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-3 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <span style={{ color: BRAND.blue }} className="font-bold text-base">
              Pedido #RD-{shortId}
            </span>
            <span style={{ background: status.bg, color: status.text }} className="text-xs font-bold px-3 py-1 rounded-full">
              {status.label}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {REASON_LABELS[dispute.reason] ?? dispute.reason}
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-2">{dispute.description}</p>
          <p className="text-xs text-gray-400">Abierta el {date}</p>

          {isClosed && dispute.resolution && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Resolución de MercadoRD</p>
              <p className="text-sm text-gray-700 leading-relaxed">{dispute.resolution}</p>
            </div>
          )}
        </div>

        {/* Hilo de mensajes */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">Mensajes</span>
          </div>

          <div className="px-5 py-4 flex flex-col gap-3" style={{ maxHeight: 380, overflowY: 'auto' }}>
            {messages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Aún no hay mensajes en esta disputa.</p>
            ) : (
              messages.map(m => {
                const isMine = m.sender_id === userId
                return (
                  <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="max-w-[75%] rounded-2xl px-4 py-2.5"
                      style={{ background: isMine ? BRAND.blue : '#f1f1f1', color: isMine ? '#fff' : '#111' }}
                    >
                      {!isMine && (
                        <p className="text-xs font-semibold mb-0.5" style={{ color: BRAND.blue }}>
                          {m.sender_role === 'admin' ? 'MercadoRD' : 'Vendedor'}
                        </p>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-line">{m.message}</p>
                      <p className="text-[11px] mt-1" style={{ color: isMine ? 'rgba(255,255,255,0.7)' : '#999' }}>
                        {new Date(m.created_at).toLocaleString('es-DO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          {isClosed ? (
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 text-center">
              <p className="text-sm text-gray-500">
                Esta disputa está {status.label.toLowerCase()} — no se pueden enviar más mensajes.
              </p>
            </div>
          ) : (
            <div className="px-5 py-4 border-t border-gray-100">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-2">
                  {error}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  style={{ background: sending || !newMessage.trim() ? '#ccc' : BRAND.blue }}
                  className="text-white font-medium px-5 rounded-lg text-sm border-none cursor-pointer"
                >
                  Enviar
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
