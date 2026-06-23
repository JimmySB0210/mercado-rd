'use client'
// ============================================================
// MercadoRD — Ventana de chat de una conversación
// Ruta: src/app/mensajes/[id]/page.tsx
// ============================================================
// send_chat_message necesita el mismo product_id con el que se
// creó la conversación (la tabla tiene un UNIQUE en buyer_id +
// vendor_id + product_id) — si se envía un product_id distinto
// se crearía una conversación nueva en vez de continuar esta.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/shop/Navbar'
import { BRAND } from '@/lib/colors'

interface ConversationInfo {
  id: string
  buyer_id: string
  vendor_id: string
  product_id: string | null
  vendor: { id: string; business_name: string; logo_url: string | null } | null
}

interface MessageRow {
  id: string
  sender_id: string
  message: string
  created_at: string
}

const POLL_MS = 5000

export default function ChatPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [conversation, setConversation] = useState<ConversationInfo | null>(null)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [buyerName, setBuyerName] = useState<string>('Comprador')
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  const isBuyer = !!userId && !!conversation && conversation.buyer_id === userId

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('id, sender_id, message, created_at')
      .eq('conversation_id', params.id)
      .order('created_at', { ascending: true })

    setMessages(data ?? [])
  }

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/login?redirect=/mensajes/${params.id}`)
      return
    }
    setUserId(user.id)

    const { data: conv, error } = await supabase
      .from('conversations')
      .select('id, buyer_id, vendor_id, product_id, vendor:vendors(id, business_name, logo_url)')
      .eq('id', params.id)
      .single()

    if (error || !conv) {
      console.error('[ChatPage]', error)
      setLoading(false)
      return
    }
    setConversation(conv as any)

    // Si quien ve esta conversación NO es el buyer, es el vendor —
    // traer el nombre del comprador con consulta separada (no embebida)
    if (conv.buyer_id !== user.id) {
      const { data: buyer } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', conv.buyer_id)
        .maybeSingle()
      setBuyerName(buyer?.full_name ?? 'Comprador')
    }

    await fetchMessages()
    await supabase.rpc('mark_conversation_read', { p_conversation_id: params.id })
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  // Polling simple — sin Realtime por ahora
  useEffect(() => {
    const interval = setInterval(fetchMessages, POLL_MS)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || !conversation || sending) return
    setSending(true)

    const { error } = await supabase.rpc('send_chat_message', {
      p_vendor_id: conversation.vendor_id,
      p_product_id: conversation.product_id,
      p_message: newMessage.trim(),
    })

    if (error) console.error('[ChatPage send]', error)

    setNewMessage('')
    await fetchMessages()
    setSending(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-400 text-sm">Cargando chat...</div>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <p className="text-gray-500">No se encontró esta conversación.</p>
          <a href="/mensajes" className="text-blue-600 underline mt-4 inline-block">Volver a mensajes</a>
        </div>
      </div>
    )
  }

  const otherName = isBuyer ? (conversation.vendor?.business_name ?? 'Vendedor') : buyerName
  const otherLink = isBuyer && conversation.vendor ? `/tienda/${conversation.vendor.id}` : null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="max-w-2xl w-full mx-auto px-4 py-6 flex-1 flex flex-col">
        <a href="/mensajes" className="text-sm no-underline mb-3" style={{ color: BRAND.gray }}>
          ← Volver a mensajes
        </a>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 mb-3 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{ background: BRAND.blue }}
          >
            {otherName.charAt(0).toUpperCase()}
          </div>
          {otherLink ? (
            <a href={otherLink} className="text-sm font-semibold no-underline" style={{ color: BRAND.dark }}>
              {otherName}
            </a>
          ) : (
            <span className="text-sm font-semibold" style={{ color: BRAND.dark }}>{otherName}</span>
          )}
        </div>

        {/* Hilo de mensajes */}
        <div className="bg-white rounded-2xl border border-gray-100 flex-1 flex flex-col overflow-hidden">
          <div className="px-5 py-4 flex-1 flex flex-col gap-3" style={{ overflowY: 'auto', maxHeight: 440 }}>
            {messages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Aún no hay mensajes en esta conversación.</p>
            ) : (
              messages.map(m => {
                const isMine = m.sender_id === userId
                return (
                  <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="max-w-[75%] rounded-2xl px-4 py-2.5"
                      style={{ background: isMine ? BRAND.blue : '#f1f1f1', color: isMine ? '#fff' : '#111' }}
                    >
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

          {/* Input */}
          <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
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
      </main>
    </div>
  )
}
