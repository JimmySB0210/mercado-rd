'use client'
// ============================================================
// MercadoRD — Botón "Chatear con el proveedor" (sin producto)
// Ruta: src/components/vendor/StoreChatButton.tsx
// ============================================================
// Lo usan la tarjeta de /proveedores y la cabecera del perfil de
// tienda, para que no diverjan. El flujo es el de la página de producto
// (lib/chat/openVendorChat.ts) con productId null: abre la conversación
// comprador-tienda que ya exista o la crea con un primer mensaje.
// Sin sesión: /login con regreso a la página actual.
//
// No se renderiza en la tienda propia (ownVendorId === vendorId) ni
// mientras ownVendorId carga (undefined), para que el dueño no lo vea
// un instante. previewOnly: no hace nada al pulsar (página de ejemplos
// con ids falsos).
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { openVendorChat } from '@/lib/chat/openVendorChat'

interface Props {
  vendorId: string
  businessName: string
  ownVendorId: string | null | undefined
  // 'short' muestra "Chatear" (aria-label con el texto completo) donde
  // el texto completo no cabe.
  labelSize?: 'full' | 'short'
  className?: string
  previewOnly?: boolean
}

export function StoreChatButton({ vendorId, businessName, ownVendorId, labelSize = 'full', className = '', previewOnly = false }: Props) {
  const { t } = useTranslation('directory')
  const { t: tp } = useTranslation('products')
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (ownVendorId === undefined || ownVendorId === vendorId) return null

  const fullLabel = t('chatWithProviderButton')

  const handleClick = async () => {
    if (previewOnly || loading) return
    setLoading(true)
    const result = await openVendorChat(createClient(), {
      vendorId,
      productId: null,
      message: `Hola, vi tu tienda ${businessName} en MercadoRD`,
      returnTo: window.location.pathname + window.location.search,
    })
    if (result.status === 'login') {
      router.push(result.url)
      return
    }
    if (result.status === 'opened') {
      router.push(`/mensajes/${result.conversationId}`)
      return
    }
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={labelSize === 'short' ? `${fullLabel}: ${businessName}` : undefined}
      title={labelSize === 'short' ? fullLabel : undefined}
      className={`inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 border-none cursor-pointer text-small font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-70 disabled:cursor-wait focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ${className}`}
      style={{ borderRadius: 'var(--radius-control)' }}
    >
      <MessageCircle size={16} aria-hidden="true" />
      {loading ? tp('openingChat') : labelSize === 'short' ? t('chatShortButton') : fullLabel}
    </button>
  )
}
