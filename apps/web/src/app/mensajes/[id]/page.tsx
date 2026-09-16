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
import { QuoteCard, type ChatQuote } from '@/components/chat/QuoteCard'

interface ProvinceOption {
  id: number
  name: string
}

const MAX_RECORDING_SECONDS = 180 // 3 minutos

function formatRecordingTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

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
  chat_quote_id: string | null
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
  const [otherOnline, setOtherOnline] = useState(false)
  const [signedUrls, setSignedUrls] = useState<Map<string, string>>(new Map())
  const [pendingFiles, setPendingFiles] = useState<{ file: File; type: ChatAttachmentType }[]>([])
  const [attachError, setAttachError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mensajes de voz — reusa por completo el flujo de adjuntos (mismo
  // bucket, mismo RLS, mismo jsonb) agregando 'audio' como un tipo
  // más. El audio grabado termina en pendingFiles como cualquier otro
  // adjunto, no tiene un camino de subida aparte.
  const [recording, setRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [micError, setMicError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cotizaciones (Solicitar cotización)
  const [quotes, setQuotes] = useState<Map<string, ChatQuote>>(new Map())
  const [productInfo, setProductInfo] = useState<{ name: string; price_rdp: number } | null>(null)
  const [provinces, setProvinces] = useState<ProvinceOption[]>([])
  const [showQuoteRequestForm, setShowQuoteRequestForm] = useState(false)
  const [quoteQuantity, setQuoteQuantity] = useState('1')
  const [requestingQuote, setRequestingQuote] = useState(false)
  const [quoteRequestError, setQuoteRequestError] = useState<string | null>(null)

  // Traducción de mensajes — nunca se guarda, se recalcula cada vez
  // que alguien pide traducir ese mensaje específico.
  const [translations, setTranslations] = useState<Map<string, string>>(new Map())
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set())
  const [translateErrors, setTranslateErrors] = useState<Map<string, string>>(new Map())

  const isBuyer = !!userId && !!conversation && conversation.buyer_id === userId

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('id, sender_id, message, attachments, chat_quote_id, created_at')
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

  const fetchQuotes = async () => {
    const { data } = await supabase
      .from('chat_quotes')
      .select('*')
      .eq('conversation_id', params.id)

    setQuotes(new Map((data ?? []).map((q: any) => [q.id as string, q as ChatQuote])))
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

    if (conv.product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('name, price_rdp')
        .eq('id', conv.product_id)
        .maybeSingle()
      setProductInfo(product ?? null)
    }

    const { data: provinceRows } = await supabase.from('provinces_rd').select('id, name').order('name')
    setProvinces(provinceRows ?? [])

    await fetchQuotes()
    await fetchMessages()
    await supabase.rpc('mark_conversation_read', { p_conversation_id: params.id })
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  // Realtime — nuevos mensajes llegan vía Supabase Realtime en vez de
  // polling. Presence comparte este mismo canal (misma conexión
  // WebSocket, scopeado por conversación vía el nombre del canal) en
  // vez de abrir uno aparte — es estado efímero, nunca se persiste en
  // una tabla.
  useEffect(() => {
    let cancelled = false
    let myUserId: string | null = null

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
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ user_id: string }>()
        const someoneElse = Object.values(state).some(presences =>
          presences.some(p => p.user_id && p.user_id !== myUserId)
        )
        setOtherOnline(someoneElse)
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return
        const { data: { user } } = await supabase.auth.getUser()
        if (cancelled || !user) return
        myUserId = user.id
        await channel.track({ user_id: user.id, online_at: new Date().toISOString() })
      })

    return () => {
      cancelled = true
      // removeChannel ya hace untrack + cierra la conexión — no hace
      // falta un channel.untrack() manual antes.
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  // chat_quotes se actualiza por POLLING (cada 4s), no Realtime —
  // decisión tomada tras verificar en vivo, con varios intentos
  // reales (canal separado del de mensajes/presence, y también
  // REPLICA IDENTITY FULL en la tabla, necesaria para que Realtime
  // pueda evaluar RLS en eventos UPDATE), que la entrega de eventos
  // postgres_changes para esta tabla es inconsistente en este
  // proyecto — a veces llega, a veces no, sin un patrón 100%
  // reproducible. chat_messages con Realtime sí es sólido (probado
  // repetidas veces) y se queda como está. Para el precio de una
  // cotización, una actualización dentro de ~4s es "en vivo" para
  // efectos prácticos y evita depender de un mecanismo que demostró
  // no ser confiable acá.
  useEffect(() => {
    const interval = setInterval(fetchQuotes, 4000)
    return () => clearInterval(interval)
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

  const pickSupportedAudioMimeType = (): string | undefined => {
    if (typeof MediaRecorder === 'undefined') return undefined
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
    return candidates.find(candidate => MediaRecorder.isTypeSupported(candidate))
  }

  const stopRecordingTimer = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }
  }

  const handleStopRecording = () => {
    stopRecordingTimer()
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
  }

  const handleStartRecording = async () => {
    setMicError(null)

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (error) {
      console.error('[ChatPage recording] getUserMedia', error)
      setMicError(t('micPermissionError'))
      return
    }

    mediaStreamRef.current = stream
    recordedChunksRef.current = []
    const mimeType = pickSupportedAudioMimeType()
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      mediaStreamRef.current?.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null

      const blobType = recorder.mimeType || 'audio/webm'
      const blob = new Blob(recordedChunksRef.current, { type: blobType })
      const ext = blobType.split(';')[0].split('/')[1] || 'webm'
      const file = new File([blob], `mensaje-de-voz-${Date.now()}.${ext}`, { type: blobType })

      const result = validateChatFile(file)
      if (result.type === null) {
        setAttachError(result.error)
        return
      }
      const type = result.type
      setPendingFiles(prev => [...prev, { file, type }])
    }

    mediaRecorderRef.current = recorder
    recorder.start()
    setRecording(true)
    setRecordingSeconds(0)

    let elapsed = 0
    recordingIntervalRef.current = setInterval(() => {
      elapsed += 1
      setRecordingSeconds(elapsed)
      if (elapsed >= MAX_RECORDING_SECONDS) {
        handleStopRecording()
      }
    }, 1000)
  }

  // Libera el micrófono si el usuario sale de la conversación a media grabación
  useEffect(() => {
    return () => {
      stopRecordingTimer()
      mediaStreamRef.current?.getTracks().forEach(track => track.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const handleRequestQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!conversation?.product_id || requestingQuote) return

    const qty = parseInt(quoteQuantity, 10)
    if (isNaN(qty) || qty <= 0) {
      setQuoteRequestError(t('invalidQuantityError'))
      return
    }

    setRequestingQuote(true)
    setQuoteRequestError(null)

    const { error } = await supabase.rpc('request_chat_quote', {
      p_conversation_id: conversation.id,
      p_product_id: conversation.product_id,
      p_quantity: qty,
    })

    if (error) {
      console.error('[ChatPage requestQuote]', error)
      setQuoteRequestError(t('quoteActionError'))
      setRequestingQuote(false)
      return
    }

    setQuoteQuantity('1')
    setShowQuoteRequestForm(false)
    setRequestingQuote(false)
    await fetchQuotes()
    await fetchMessages()
  }

  const handleTranslate = async (messageId: string, text: string) => {
    setTranslatingIds(prev => new Set(prev).add(messageId))
    setTranslateErrors(prev => { const next = new Map(prev); next.delete(messageId); return next })

    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, target_language: language }),
      })
      const data = await res.json()

      if (!res.ok) {
        setTranslateErrors(prev => new Map(prev).set(messageId, data?.error ?? t('translateError')))
        return
      }

      setTranslations(prev => new Map(prev).set(messageId, data.text))
    } catch (error) {
      console.error('[ChatPage translate]', error)
      setTranslateErrors(prev => new Map(prev).set(messageId, t('translateError')))
    } finally {
      setTranslatingIds(prev => { const next = new Set(prev); next.delete(messageId); return next })
    }
  }

  const handleHideTranslation = (messageId: string) => {
    setTranslations(prev => { const next = new Map(prev); next.delete(messageId); return next })
    setTranslateErrors(prev => { const next = new Map(prev); next.delete(messageId); return next })
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
            <div className="flex items-center gap-2 flex-wrap">
              {otherLink ? (
                <a href={otherLink} className="text-sm font-semibold no-underline" style={{ color: BRAND.dark }}>
                  {otherName}
                </a>
              ) : (
                <span className="text-sm font-semibold" style={{ color: BRAND.dark }}>{otherName}</span>
              )}
              <span className="text-xs" style={{ color: otherOnline ? 'var(--color-green)' : BRAND.gray }}>
                {otherOnline ? t('onlineStatusLabel') : t('offlineStatusLabel')}
              </span>
            </div>
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

                // Tarjeta de cotización en vez de burbuja de texto —
                // los datos vivos vienen del state `quotes` (mantenido
                // por la suscripción realtime a chat_quotes), no del
                // mensaje en sí.
                if (m.chat_quote_id) {
                  const quote = quotes.get(m.chat_quote_id)
                  if (!quote) return null
                  return (
                    <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <QuoteCard
                        quote={quote}
                        productName={productInfo?.name ?? ''}
                        catalogPriceRdp={productInfo?.price_rdp ?? 0}
                        isBuyer={isBuyer}
                        provinces={provinces}
                      />
                    </div>
                  )
                }

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

                      {/* Traducción — nunca reemplaza el original, se
                          agrega al lado. Nunca se guarda: se recalcula
                          cada vez que se pide. Solo en mensajes ajenos
                          con texto (no aplica a burbujas propias ni a
                          mensajes solo-adjunto/solo-cotización). */}
                      {!isMine && m.message && (
                        <div className="mt-1">
                          {translations.has(m.id) ? (
                            <>
                              <p className="text-sm leading-relaxed whitespace-pre-line italic mt-1" style={{ color: '#444' }}>
                                {translations.get(m.id)}
                              </p>
                              <button
                                type="button"
                                onClick={() => handleHideTranslation(m.id)}
                                className="text-[11px] underline mt-0.5 border-none bg-transparent cursor-pointer p-0"
                                style={{ color: '#999' }}
                              >
                                {t('hideTranslationButton')}
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleTranslate(m.id, m.message)}
                              disabled={translatingIds.has(m.id)}
                              className="text-[11px] underline border-none bg-transparent cursor-pointer p-0 disabled:opacity-60"
                              style={{ color: '#999' }}
                            >
                              {translatingIds.has(m.id) ? t('translatingButton') : `🌐 ${t('translateButton')}`}
                            </button>
                          )}
                          {translateErrors.has(m.id) && (
                            <p className="text-[11px] mt-0.5" style={{ color: BRAND.red }}>{translateErrors.get(m.id)}</p>
                          )}
                        </div>
                      )}

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
                            if (a.type === 'audio') {
                              return (
                                // eslint-disable-next-line jsx-a11y/media-has-caption
                                <audio key={a.path} src={a.url} controls className="max-w-full" style={{ height: 32 }} />
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
            {isBuyer && conversation.product_id && (
              showQuoteRequestForm ? (
                <form onSubmit={handleRequestQuote} className="mb-2 p-3 rounded-lg border border-gray-200 flex flex-col gap-1.5">
                  <label className="text-xs text-gray-500">{t('quoteQuantityInputLabel')}</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min={1}
                      value={quoteQuantity}
                      onChange={e => setQuoteQuantity(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowQuoteRequestForm(false)}
                      className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 bg-white cursor-pointer"
                    >
                      {t('cancelButton')}
                    </button>
                    <button
                      type="submit"
                      disabled={requestingQuote}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white border-none cursor-pointer disabled:opacity-60"
                      style={{ background: BRAND.blue }}
                    >
                      {requestingQuote ? t('sendingButton') : t('sendQuoteRequestButton')}
                    </button>
                  </div>
                  {quoteRequestError && <p className="text-xs" style={{ color: BRAND.red }}>{quoteRequestError}</p>}
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowQuoteRequestForm(true)}
                  className="mb-2 text-xs font-medium hover:underline border-none bg-transparent cursor-pointer p-0"
                  style={{ color: BRAND.blue }}
                >
                  💰 {t('requestQuoteButton')}
                </button>
              )
            )}

            {attachError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-2">
                {attachError}
              </div>
            )}

            {micError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-2">
                {micError}
              </div>
            )}

            {recording && (
              <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: BRAND.red, background: '#fef2f2' }}>
                <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: BRAND.red }} />
                <span className="text-sm font-medium" style={{ color: BRAND.red }}>
                  {t('recordingLabel')} {formatRecordingTime(recordingSeconds)}
                </span>
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="ml-auto text-xs font-medium px-3 py-1.5 rounded-lg text-white border-none cursor-pointer"
                  style={{ background: BRAND.red }}
                >
                  {t('stopRecordingButton')}
                </button>
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
                        <span>{pf.type === 'video' ? '🎬' : pf.type === 'audio' ? '🎤' : '📄'}</span>
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
              <button
                type="button"
                onClick={recording ? handleStopRecording : handleStartRecording}
                aria-label={recording ? t('stopRecordingButton') : t('recordVoiceMessageAria')}
                className="flex-shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center text-lg bg-white cursor-pointer"
                style={{ borderColor: recording ? BRAND.red : 'var(--color-border, #e5e7eb)', color: recording ? BRAND.red : undefined }}
              >
                {recording ? '⏹️' : '🎤'}
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
