'use client'
// ============================================================
// MercadoRD — Hilo de mensajes de una disputa (con fotos)
// Ruta: src/components/order/DisputeMessageThread.tsx
// ============================================================
// Compartido entre perfil/disputas/[id]/page.tsx (comprador) y el
// panel de admin (DisputeAdminRow.tsx) — mismo hilo, mismo composer,
// para que se vea y funcione idéntico en ambos lados. Self-fetching
// (dispute_messages + su propia sesión vía auth.getUser()), igual que
// DisputeEvidenceCard.tsx.
//
// Las fotos van al bucket privado dispute-evidence — no hay
// getPublicUrl() ahí, solo se guarda la ruta relativa en
// dispute_messages.attachments. Para mostrarlas hay que pedir URLs
// firmadas (1h de validez) justo antes de renderizar cada mensaje.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatDate } from '@/lib/utils'
import { validateImageFile, uploadDisputeEvidence, getDisputeEvidenceSignedUrls } from '@/lib/storage/upload'
import { BRAND } from '@/lib/colors'

interface MessageRow {
  id: string
  sender_id: string
  sender_role: string
  message: string
  attachments: string[] | null
  created_at: string
}

interface Props {
  disputeId: string
  senderRole: 'buyer' | 'admin'
  status: string
}

const KNOWN_STATUSES = new Set(['open', 'reviewing', 'resolved', 'closed'])
const CLOSED_STATUSES = new Set(['resolved', 'closed'])

export function DisputeMessageThread({ disputeId, senderRole, status }: Props) {
  const { t, language } = useTranslation('profile')
  const supabase = createClient()
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [signedUrls, setSignedUrls] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isClosed = CLOSED_STATUSES.has(status)

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUserId(user?.id ?? null)

    const { data } = await supabase
      .from('dispute_messages')
      .select('id, sender_id, sender_role, message, attachments, created_at')
      .eq('dispute_id', disputeId)
      .order('created_at', { ascending: true })

    const rows = (data ?? []) as MessageRow[]
    setMessages(rows)

    const allPaths = rows.flatMap(m => m.attachments ?? [])
    if (allPaths.length > 0) {
      setSignedUrls(await getDisputeEvidenceSignedUrls(allPaths))
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disputeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    for (const file of files) {
      const validationError = validateImageFile(file)
      if (validationError) {
        setError(validationError)
        continue
      }
      setPendingFiles(prev => [...prev, file])
    }
  }

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSend = async () => {
    if ((!newMessage.trim() && pendingFiles.length === 0) || !userId) return
    setSending(true)
    setError(null)

    const uploads = await Promise.all(pendingFiles.map(file => uploadDisputeEvidence(file, disputeId)))
    const failedUpload = uploads.find(u => u.error)
    if (failedUpload) {
      console.error('[DisputeMessageThread]', failedUpload.error)
      setError(t('attachmentUploadError'))
      setSending(false)
      return
    }
    const attachmentPaths = uploads.map(u => u.path).filter((p): p is string => !!p)

    const { error: insertError } = await supabase
      .from('dispute_messages')
      .insert({
        dispute_id: disputeId,
        sender_id: userId,
        sender_role: senderRole,
        message: newMessage.trim(),
        attachments: attachmentPaths.length > 0 ? attachmentPaths : null,
      })

    if (insertError) {
      console.error('[DisputeMessageThread send]', insertError)
      setError(t('sendMessageError'))
      setSending(false)
      return
    }

    setNewMessage('')
    setPendingFiles([])
    setSending(false)
    load()
  }

  const knownStatus = KNOWN_STATUSES.has(status) ? status : 'open'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-900">{t('messagesTitle')}</span>
      </div>

      <div className="px-5 py-4 flex flex-col gap-3" style={{ maxHeight: 380, overflowY: 'auto' }}>
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-6">{t('loadingEvidence')}</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">{t('noMessagesYet')}</p>
        ) : (
          messages.map(m => {
            const isMine = m.sender_id === userId
            const senderLabel = m.sender_role === 'admin' ? 'MercadoRD' : m.sender_role === 'vendor' ? t('senderVendorLabel') : t('senderBuyerLabel')
            const attachments = (m.attachments ?? []).map(path => ({ path, url: signedUrls.get(path) })).filter(a => !!a.url)

            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[75%] rounded-2xl px-4 py-2.5"
                  style={{ background: isMine ? BRAND.blue : '#f1f1f1', color: isMine ? '#fff' : '#111' }}
                >
                  {!isMine && (
                    <p className="text-xs font-semibold mb-0.5" style={{ color: BRAND.blue }}>
                      {senderLabel}
                    </p>
                  )}
                  {m.message && <p className="text-sm leading-relaxed whitespace-pre-line">{m.message}</p>}

                  {attachments.length > 0 && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {attachments.map(a => (
                        <a key={a.path} href={a.url} target="_blank" rel="noopener noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={a.url}
                            alt={t('viewAttachmentAria')}
                            className="w-16 h-16 rounded-lg object-cover"
                            style={{ border: isMine ? '1px solid rgba(255,255,255,0.3)' : '1px solid #e5e7eb' }}
                          />
                        </a>
                      ))}
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

      {isClosed ? (
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 text-center">
          <p className="text-sm text-gray-500">
            {t('disputeClosedNotice', { status: t(`disputeStatus.${knownStatus}` as 'disputeStatus.open').toLowerCase() })}
          </p>
        </div>
      ) : (
        <div className="px-5 py-4 border-t border-gray-100">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-2">
              {error}
            </div>
          )}

          {pendingFiles.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-2">
              {pendingFiles.map((file, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(file)} alt={file.name} className="w-14 h-14 rounded-lg object-cover border border-gray-200" />
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
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFilesSelected}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label={t('attachPhotoAria')}
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
      )}
    </div>
  )
}
