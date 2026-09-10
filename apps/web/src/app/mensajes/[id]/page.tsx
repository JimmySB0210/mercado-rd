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
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatDate } from '@/lib/utils'
import { BRAND } from '@/lib/colors'
import {
  validateChatFile,
  uploadChatAttachment,
  getChatAttachmentSignedUrls,
  type ChatAttachment,
  type ChatAttachmentType,
} from '@/lib/storage/upload'

interface ConversationInfo {
  id: string
  buyer_id: string
  vendor_id: string
  product_id: string | null
  vendor: {
    id: string
    business_name: string
    logo_url: string | null
    is_verified: boolean
    created_at: string
    province: { name: string } | null
  } | null
}

interface MessageRow {
  id: string
  sender_id: string
  message: string
  attachments: ChatAttachment[] | null
  created_at: string
}

export default function ChatPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const bottomRef = useRef<HTMLDivElement>(null)
  const { t, language } = useTranslation('chat')

  // Recalcula la duración de membresía localmente y traducida, en vez de
  // usar getMembershipDuration() de lib/utils.ts — esa función también la
  // usa app/tienda/[id] (ya resuelto vía "directory") y no se toca.
  const membershipText = (createdAt: string): string => {
    const created = new Date(createdAt)
    const now = new Date()
    const months = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth())
    if (months < 1) return t('newOnMercadoRD')
    const duration = months < 12
      ? t(months === 1 ? 'membershipMonthsSingular' : 'membershipMonthsPlural', { count: months })
      : t(Math.floor(months / 12) === 1 ? 'membershipYearsSingular' : 'membershipYearsPlural', { count: Math.floor(months / 12) })
    return t('onMercadoRDSince', { duration })
  }

  const [userId, setUserId] = useState<string | null>(null)
  const [conversation, setConversation] = useState<ConversationInfo | null>(null)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [buyerName, setBuyerName] = useState<string | null>(null)
  const [buyerCreatedAt, setBuyerCreatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [signedUrls, setSignedUrls] = useState<Map<string, string>>(new Map())
  const [pendingFiles, setPendingFiles] = useState<{ file: File; type: ChatAttachmentType }[]>([])
  const [attachError, setAttachError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isBuyer = !!userId && !!conversation && conversation.buyer_id === userId

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('id, sender_id, message, attachments, created_at')
      .eq('conversation_id', params.id)
      .order('created_at', { ascending: true })

    const rows = (data ?? []) as MessageRow[]
    setMessages(rows)

    const allPaths = rows.flatMap(m => (m.attachments ?? []).map(a => a.path))
    if (allPaths.length > 0) {
      const urls = await getChatAttachmentSignedUrls(allPaths)
      setSignedUrls(prev => new Map([...prev, ...urls]))
    }
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
      .select('id, buyer_id, vendor_id, product_id, vendor:vendors(id, business_name, logo_url, is_verified, created_at, province:provinces_rd(name))')
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
        .select('full_name, created_at')
        .eq('id', conv.buyer_id)
        .maybeSingle()
      setBuyerName(buyer?.full_name ?? null)
      setBuyerCreatedAt(buyer?.created_at ?? null)
    }

    await fetchMessages()
    await supabase.rpc('mark_conversation_read', { p_conversation_id: params.id })
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  // Realtime — nuevos mensajes llegan vía Supabase Realtime en vez de polling
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${params.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${params.id}`,
        },
        async (payload) => {
          const incoming = payload.new as MessageRow
          // Evita duplicados si fetchMessages() ya trajo este mensaje
          setMessages(prev => (prev.some(m => m.id === incoming.id) ? prev : [...prev, incoming]))

          const paths = (incoming.attachments ?? []).map(a => a.path)
          if (paths.length > 0) {
            const urls = await getChatAttachmentSignedUrls(paths)
            setSignedUrls(prev => new Map([...prev, ...urls]))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    for (const file of files) {
      const result = validateChatFile(file)
      if (result.type === null) {
        setAttachError(result.error)
        continue
      }
      const type = result.type
      setPendingFiles(prev => [...prev, { file, type }])
    }
  }

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSend = async () => {
    if ((!newMessage.trim() && pendingFiles.length === 0) || !conversation || sending) return
    setSending(true)
    setAttachError(null)

    let attachments: ChatAttachment[] | null = null
    if (pendingFiles.length > 0) {
      const uploads = await Promise.all(
        pendingFiles.map(pf => uploadChatAttachment(pf.file, conversation.id, pf.type))
      )
      const failedUpload = uploads.find(u => u.error)
      if (failedUpload) {
        console.error('[ChatPage send] upload', failedUpload.error)
        setAttachError(t('attachmentUploadError'))
        setSending(false)
        return
      }
      attachments = uploads.map(u => u.attachment).filter((a): a is ChatAttachment => !!a)
    }

    const { error } = await supabase.rpc('send_chat_message', {
      p_vendor_id: conversation.vendor_id,
      p_product_id: conversation.product_id,
      p_message: newMessage.trim(),
      p_conversation_id: conversation.id,
      p_attachments: attachments,
    })

    if (error) console.error('[ChatPage send]', error)

    setNewMessage('')
    setPendingFiles([])
    await fetchMessages()
    setSending(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-400 text-sm">{t('loadingChat')}</div>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <p className="text-gray-500">{t('conversationNotFound')}</p>
          <a href="/mensajes" className="text-blue-600 underline mt-4 inline-block">{t('backToMessagesLink')}</a>
        </div>
      </div>
    )
  }

  const otherName = isBuyer ? (conversation.vendor?.business_name ?? t('defaultVendorName')) : (buyerName ?? t('defaultBuyerName'))
  const otherLink = isBuyer && conversation.vendor ? `/tienda/${conversation.vendor.id}` : null
  const otherAvatarUrl = isBuyer ? (conversation.vendor?.logo_url ?? null) : null

  // Señales de confianza debajo del nombre — de la tienda cuando el
  // comprador ve al vendor, de la antigüedad cuando el vendor ve al comprador
  const otherTrustLine = isBuyer
    ? (conversation.vendor
        ? [
            conversation.vendor.is_verified ? t('verifiedTrustBadge') : null,
            membershipText(conversation.vendor.created_at),
            conversation.vendor.province?.name ?? null,
          ].filter(Boolean).join(' · ')
        : null)
    : (buyerCreatedAt ? membershipText(buyerCreatedAt) : null)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="max-w-2xl w-full mx-auto px-4 py-6 flex-1 flex flex-col">
        <a href="/mensajes" className="text-sm no-underline mb-3" style={{ color: BRAND.gray }}>
          ← {t('backToMessagesLink')}
        </a>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 mb-3 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden"
            style={{ background: otherAvatarUrl ? 'transparent' : BRAND.blue }}
          >
            {otherAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={otherAvatarUrl} alt={otherName} className="w-full h-full object-cover" />
            ) : (
              otherName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            {otherLink ? (
              <a href={otherLink} className="text-sm font-semibold no-underline" style={{ color: BRAND.dark }}>
                {otherName}
              </a>
            ) : (
              <span className="text-sm font-semibold" style={{ color: BRAND.dark }}>{otherName}</span>
            )}
            {otherTrustLine && (
              <p className="text-xs text-gray-400 mt-0.5">{otherTrustLine}</p>
            )}
          </div>
        </div>

        {/* Hilo de mensajes */}
        <div className="bg-white rounded-2xl border border-gray-100 flex-1 flex flex-col overflow-hidden">
          <div className="px-5 py-4 flex-1 flex flex-col gap-3" style={{ overflowY: 'auto', maxHeight: 440 }}>
            {messages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">{t('noMessagesInThread')}</p>
            ) : (
              messages.map(m => {
                const isMine = m.sender_id === userId
                const attachments = (m.attachments ?? [])
                  .map(a => ({ ...a, url: signedUrls.get(a.path) }))
                  .filter(a => !!a.url)

                return (
                  <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="max-w-[75%] rounded-2xl px-4 py-2.5"
                      style={{ background: isMine ? BRAND.blue : '#f1f1f1', color: isMine ? '#fff' : '#111' }}
                    >
                      {m.message && <p className="text-sm leading-relaxed whitespace-pre-line">{m.message}</p>}

                      {attachments.length > 0 && (
                        <div className="flex flex-col gap-1.5 mt-1.5">
                          {attachments.map(a => {
                            if (a.type === 'image') {
                              return (
                                <a key={a.path} href={a.url} target="_blank" rel="noopener noreferrer">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={a.url}
                                    alt={t('viewAttachmentAria')}
                                    className="w-32 h-32 rounded-lg object-cover"
                                    style={{ border: isMine ? '1px solid rgba(255,255,255,0.3)' : '1px solid #e5e7eb' }}
                                  />
                                </a>
                              )
                            }
                            if (a.type === 'video') {
                              return (
                                // eslint-disable-next-line jsx-a11y/media-has-caption
                                <video key={a.path} src={a.url} controls className="w-56 rounded-lg" />
                              )
                            }
                            return (
                              <a
                                key={a.path}
                                href={a.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm no-underline"
                                style={{
                                  background: isMine ? 'rgba(255,255,255,0.15)' : '#fff',
                                  color: isMine ? '#fff' : '#111',
                                  border: isMine ? '1px solid rgba(255,255,255,0.3)' : '1px solid #e5e7eb',
                                }}
                              >
                                📄 <span className="truncate flex-1">{a.filename}</span> {t('downloadAttachmentLabel')}
                              </a>
                            )
                          })}
                        </div>
                      )}

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

          {/* Input */}
          <div className="px-5 py-4 border-t border-gray-100">
            {attachError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-2">
                {attachError}
              </div>
            )}

            {pendingFiles.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-2">
                {pendingFiles.map((pf, i) => (
                  <div key={i} className="relative">
                    {pf.type === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={URL.createObjectURL(pf.file)} alt={pf.file.name} className="w-14 h-14 rounded-lg object-cover border border-gray-200" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg border border-gray-200 flex flex-col items-center justify-center text-[10px] text-gray-500 px-1 text-center">
                        <span>{pf.type === 'video' ? '🎬' : '📄'}</span>
                        <span className="truncate w-full">{pf.file.name}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removePendingFile(i)}
                      aria-label={t('removeAttachmentAria')}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-800 text-white text-xs flex items-center justify-center border-none cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,application/pdf"
                multiple
                onChange={handleFilesSelected}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label={t('attachFileAria')}
                className="flex-shrink-0 w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-lg bg-white cursor-pointer"
              >
                📎
              </button>
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
                placeholder={t('messagePlaceholder')}
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none"
              />
              <button
                onClick={handleSend}
                disabled={sending || (!newMessage.trim() && pendingFiles.length === 0)}
                style={{ background: sending || (!newMessage.trim() && pendingFiles.length === 0) ? '#ccc' : BRAND.blue }}
                className="text-white font-medium px-5 rounded-lg text-sm border-none cursor-pointer"
              >
                {sending && pendingFiles.length > 0 ? t('uploadingAttachmentsLabel') : t('sendButton')}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
