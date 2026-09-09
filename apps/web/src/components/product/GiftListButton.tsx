'use client'
// ============================================================
// MercadoRD — Botón "Agregar a mi lista de regalos"
// Ruta: src/components/product/GiftListButton.tsx
// ============================================================
// Mismo patrón que ContactVendorButton: sin chequeo de auth al montar,
// solo al hacer clic (auth.getUser() + redirect '?redirect=' de vuelta
// a este producto). Si el usuario no tiene lista de regalos todavía,
// lo mandamos a crearla primero (perfil/lista-regalos?add=productId),
// que se encarga de agregar este producto en cuanto la lista exista.
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/hooks/useTranslation'

interface Props {
  productId: string
}

type Priority = 1 | 2 | 3

type Status = 'idle' | 'checking' | 'picking' | 'saving' | 'done'

export function GiftListButton({ productId }: Props) {
  const { t } = useTranslation('products')
  const router = useRouter()
  const supabase = createClient()

  const [status, setStatus] = useState<Status>('idle')
  const [giftListId, setGiftListId] = useState<string | null>(null)
  const [priority, setPriority] = useState<Priority | null>(null)

  const handleStart = async () => {
    setStatus('checking')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(`/producto/${productId}`))
      return
    }

    const { data: list, error: listError } = await supabase
      .from('gift_lists')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (listError) {
      console.error('[GiftListButton] gift_lists', listError)
      setStatus('idle')
      return
    }

    if (!list) {
      router.push(`/perfil/lista-regalos?add=${productId}`)
      return
    }

    const { data: existingItem, error: itemError } = await supabase
      .from('gift_list_items')
      .select('id, priority')
      .eq('gift_list_id', list.id)
      .eq('product_id', productId)
      .maybeSingle()

    if (itemError) {
      console.error('[GiftListButton] gift_list_items', itemError)
      setStatus('idle')
      return
    }

    if (existingItem) {
      setPriority(existingItem.priority as Priority)
      setStatus('done')
      return
    }

    setGiftListId(list.id)
    setStatus('picking')
  }

  const handlePick = async (chosen: Priority) => {
    if (!giftListId) return
    setStatus('saving')

    const { error } = await supabase
      .from('gift_list_items')
      .insert({ gift_list_id: giftListId, product_id: productId, priority: chosen })

    if (error) {
      console.error('[GiftListButton] insert', error)
      setStatus('picking')
      return
    }

    setPriority(chosen)
    setStatus('done')
  }

  if (status === 'done') {
    return (
      <button
        type="button"
        onClick={() => router.push('/perfil/lista-regalos')}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 font-medium transition-colors"
        style={{ borderColor: 'var(--color-success)', color: 'var(--color-success)' }}
      >
        {t('addedToGiftListButton')}
      </button>
    )
  }

  if (status === 'picking' || status === 'saving') {
    const priorityOptions: { value: Priority; labelKey: 'giftPriorityHigh' | 'giftPriorityMedium' | 'giftPriorityLow' }[] = [
      { value: 1, labelKey: 'giftPriorityHigh' },
      { value: 2, labelKey: 'giftPriorityMedium' },
      { value: 3, labelKey: 'giftPriorityLow' },
    ]

    return (
      <div className="border-2 rounded-xl p-3" style={{ borderColor: 'var(--brand-blue)' }}>
        <p className="text-sm font-medium text-gray-700 mb-2">{t('choosePriorityLabel')}</p>
        <div className="flex gap-2">
          {priorityOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handlePick(opt.value)}
              disabled={status === 'saving'}
              className="flex-1 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-60"
              style={{ borderColor: 'var(--brand-blue)', color: 'var(--brand-blue)' }}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={handleStart}
      disabled={status === 'checking'}
      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 font-medium transition-colors disabled:opacity-60"
      style={{ borderColor: 'var(--brand-blue)', color: 'var(--brand-blue)' }}
    >
      {status === 'checking' ? t('addingToGiftList') : t('addToGiftListButton')}
    </button>
  )
}
