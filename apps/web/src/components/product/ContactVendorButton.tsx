'use client'
// ============================================================
// MercadoRD — Botón "Preguntar al vendedor" (chat interno)
// Ruta: src/components/product/ContactVendorButton.tsx
// ============================================================
// send_chat_message retorna el id del MENSAJE, no de la
// conversación — por eso, después de llamarlo, consultamos
// chat_messages para obtener el conversation_id real.
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  vendorId: string
  productId: string
  productName: string
}

export function ContactVendorButton({ vendorId, productId, productName }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(`/producto/${productId}`))
      return
    }

    const { data: messageId, error } = await supabase.rpc('send_chat_message', {
      p_vendor_id: vendorId,
      p_product_id: productId,
      p_message: `Hola, tengo una pregunta sobre ${productName}`,
    })

    if (error || !messageId) {
      console.error('[ContactVendorButton]', error)
      setLoading(false)
      return
    }

    const { data: message } = await supabase
      .from('chat_messages')
      .select('conversation_id')
      .eq('id', messageId)
      .single()

    setLoading(false)

    if (message?.conversation_id) {
      router.push(`/mensajes/${message.conversation_id}`)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 font-medium transition-colors disabled:opacity-60"
      style={{ borderColor: 'var(--brand-blue)', color: 'var(--brand-blue)' }}
    >
      💬 {loading ? 'Abriendo chat...' : 'Preguntar al vendedor'}
    </button>
  )
}
