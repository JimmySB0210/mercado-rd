'use client'
// ============================================================
// MercadoRD — Detalle de disputa (comprador)
// Ruta: src/app/perfil/disputas/[id]/page.tsx
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/shop/Navbar'
import { DisputeEvidenceCard } from '@/components/order/DisputeEvidenceCard'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatDate } from '@/lib/utils'
import { BRAND } from '@/lib/colors'

interface DisputeDetail {
  id: string
  order_id: string
  vendor_id: string
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

// El texto de razón/estado se resuelve en render vía
// t('disputeReason.<reason>') / t('disputeStatus.<status>') — aquí solo
// quedan los colores del badge de estado, que no dependen del idioma.
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open:      { bg: '#FEF9C3', text: '#713f12' },
  reviewing: { bg: '#DBEAFE', text: '#1e3a8a' },
  resolved:  { bg: '#DCFCE7', text: '#166534' },
  closed:    { bg: '#F3F4F6', text: '#666' },
}

export default function DisputeDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const bottomRef = useRef<HTMLDivElement>(null)
  const { t, language } = useTranslation('profile')

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
      .select('id, order_id, vendor_id, reason, description, status, resolution, created_at')
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
      setError(t('sendMessageError'))
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
          <div className="text-gray-400 text-sm">{t('loadingDisputeDetail')}</div>
        </div>
      </div>
    )
  }

  if (!dispute) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <p className="text-gray-500">{t('disputeNotFound')}</p>
          <a href="/perfil/disputas" className="text-blue-600 underline mt-4 inline-block">{t('backToDisputesLink')}</a>
        </div>
      </div>
    )
  }

  const shortId = dispute.order_id.split('-')[0].toUpperCase()
  const knownStatus = dispute.status in STATUS_COLORS ? dispute.status : 'open'
  const statusColors = STATUS_COLORS[knownStatus]
  const statusLabel = t(`disputeStatus.${knownStatus}` as 'disputeStatus.open')
  const isClosed = dispute.status === 'resolved' || dispute.status === 'closed'
  const date = formatDate(dispute.created_at, language, {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <a href="/perfil/disputas" className="text-sm no-underline" style={{ color: BRAND.gray }}>
          ← {t('backToDisputesLink')}
        </a>

        {/* Info de la disputa */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-3 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <span style={{ color: BRAND.blue }} className="font-bold text-base">
              {t('orderNumberLabel', { id: `RD-${shortId}` })}
            </span>
            <span style={{ background: statusColors.bg, color: statusColors.text }} className="text-xs font-bold px-3 py-1 rounded-full">
              {statusLabel}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {t(`disputeReason.${dispute.reason}` as 'disputeReason.other')}
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-2">{dispute.description}</p>
          <p className="text-xs text-gray-400">{t('openedOnLabel', { date })}</p>

          {isClosed && dispute.resolution && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">{t('resolutionTitle')}</p>
              <p className="text-sm text-gray-700 leading-relaxed">{dispute.resolution}</p>
            </div>
          )}
        </div>

        {/* Evidencia objetiva — lo que se anunció + estado de entrega */}
        <div className="mb-4">
          <DisputeEvidenceCard orderId={dispute.order_id} vendorId={dispute.vendor_id} />
        </div>

        {/* Hilo de mensajes */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">{t('messagesTitle')}</span>
          </div>

          <div className="px-5 py-4 flex flex-col gap-3" style={{ maxHeight: 380, overflowY: 'auto' }}>
            {messages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">{t('noMessagesYet')}</p>
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
                          {m.sender_role === 'admin' ? 'MercadoRD' : t('senderVendorLabel')}
                        </p>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-line">{m.message}</p>
                      <p className="text-[11px] mt-1" style={{ color: isMine ? 'rgba(255,255,255,0.7)' : '#999' }}>
                        {formatDate(m.created_at, language, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
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
                {t('disputeClosedNotice', { status: statusLabel.toLowerCase() })}
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
                  placeholder={t('messagePlaceholder')}
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  style={{ background: sending || !newMessage.trim() ? '#ccc' : BRAND.blue }}
                  className="text-white font-medium px-5 rounded-lg text-sm border-none cursor-pointer"
                >
                  {t('sendButton')}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
