'use client'
// ============================================================
// MercadoRD — Botón "Preguntar al vendedor" (chat interno)
// Ruta: src/components/product/ContactVendorButton.tsx
// ============================================================
// El flujo (login, send_chat_message y lectura del conversation_id)
// vive en lib/chat/openVendorChat.ts, compartido con el botón de chat
// de las tiendas (StoreChatButton).
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { openVendorChat } from '@/lib/chat/openVendorChat'

interface Props {
  vendorId: string
  productId: string
  productName: string
  // Mensaje/etiqueta/ícono personalizables — VolumePricingBanner.tsx reusa
  // este mismo botón (mismo RPC, mismo flujo de login) con un mensaje de
  // apertura distinto, en vez de duplicar la llamada a send_chat_message.
  message?: string
  label?: string
  icon?: string
}

export function ContactVendorButton({ vendorId, productId, productName, message, label, icon = '💬' }: Props) {
  const { t } = useTranslation('products')
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    const result = await openVendorChat(supabase, {
      vendorId,
      productId,
      message: message ?? `Hola, tengo una pregunta sobre ${productName}`,
      returnTo: `/producto/${productId}`,
    })
    if (result.status === 'login') {
      router.push(result.url)
      return
    }
    setLoading(false)
    if (result.status === 'opened') router.push(`/mensajes/${result.conversationId}`)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 font-medium transition-colors disabled:opacity-60"
      style={{ borderColor: 'var(--brand-blue)', color: 'var(--brand-blue)' }}
    >
      {icon} {loading ? t('openingChat') : (label ?? t('askVendorButton'))}
    </button>
  )
}
