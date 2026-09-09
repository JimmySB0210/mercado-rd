'use client'
// ============================================================
// MercadoRD — Contenido de la lista de regalos pública
// Ruta: src/app/regalo/[slug]/RegaloPublicContent.tsx
// ============================================================
// "Regalar esto" llama a create_gift_order() (función atómica —
// bloquea la fila con FOR UPDATE, así dos personas no pueden comprar
// el mismo regalo casi simultáneo). Los mensajes de error que retorna
// se muestran tal cual, sin reformular — ya cubren los casos de
// artículo ya comprado, lista inactiva, dueño comprándose a sí mismo,
// y sin stock.
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Gift } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatPrice } from '@/types/database.types'
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/utils'
import { BRAND } from '@/lib/colors'

type Priority = 1 | 2 | 3

interface GiftItem {
  id: string
  priority: Priority
  purchased_by: string | null
  product: { id: string; name: string; images: string[] | null; price_rdp: number; compare_rdp: number | null }
}

interface Props {
  slug: string
  displayName: string
  provinceName: string | null
  isUnavailable: boolean
  items: GiftItem[]
}

const PAYMENT_METHODS: { id: string; labelKey: 'paymentAzulLabel' | 'paymentCardnetLabel' | 'paymentTransferLabel' | 'paymentCashLabel'; emoji: string }[] = [
  { id: 'azul', labelKey: 'paymentAzulLabel', emoji: '💳' },
  { id: 'cardnet', labelKey: 'paymentCardnetLabel', emoji: '🏦' },
  { id: 'transfer', labelKey: 'paymentTransferLabel', emoji: '🏧' },
  { id: 'cash', labelKey: 'paymentCashLabel', emoji: '💵' },
]

const priorityLabelKey: Record<Priority, 'priorityHigh' | 'priorityMedium' | 'priorityLow'> = {
  1: 'priorityHigh',
  2: 'priorityMedium',
  3: 'priorityLow',
}

export function RegaloPublicContent({ slug, displayName, provinceName, isUnavailable, items }: Props) {
  const { t } = useTranslation('giftLists')
  const router = useRouter()
  const supabase = createClient()

  const [openItemId, setOpenItemId] = useState<string | null>(null)
  const [submittingItemId, setSubmittingItemId] = useState<string | null>(null)
  const [errorByItem, setErrorByItem] = useState<Record<string, string>>({})

  const handleChoosePayment = async (itemId: string, method: string) => {
    setSubmittingItemId(itemId)
    setErrorByItem(prev => ({ ...prev, [itemId]: '' }))

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(`/regalo/${slug}`))
      return
    }

    const { data, error } = await supabase.rpc('create_gift_order', {
      p_gift_list_item_id: itemId,
      p_payment_method: method,
    })

    if (error) {
      console.error('[RegaloPublicContent] create_gift_order', error)
      setErrorByItem(prev => ({ ...prev, [itemId]: t('genericGiftError') }))
      setSubmittingItemId(null)
      return
    }

    if (!data?.success) {
      setErrorByItem(prev => ({ ...prev, [itemId]: data?.error ?? t('genericGiftError') }))
      setSubmittingItemId(null)
      return
    }

    router.push(`/regalo/${slug}/gracias`)
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 text-center">
        <div className="text-4xl mb-2">🎁</div>
        <h1 className="text-xl font-bold text-gray-900">{t('creatorHeading', { alias: displayName })}</h1>
        {provinceName && (
          <p className="text-sm text-gray-400 mt-1">{t('locationLine', { city: provinceName })}</p>
        )}
      </div>

      {isUnavailable ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <div className="text-4xl mb-3">😕</div>
          <p className="text-gray-700 font-medium mb-1">{t('listUnavailableTitle')}</p>
          <p className="text-sm text-gray-400">{t('listUnavailableHint')}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-gray-500">{t('emptyListMessage')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const isPurchased = !!item.purchased_by
            const isOpen = openItemId === item.id
            const isSubmitting = submittingItemId === item.id
            const itemError = errorByItem[item.id]
            const hasDiscount = item.product.compare_rdp && item.product.compare_rdp > item.product.price_rdp

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-100 p-4"
                style={{ opacity: isPurchased ? 0.6 : 1 }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                    <Image
                      src={item.product.images?.[0] ?? PLACEHOLDER_PRODUCT_IMAGE}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium text-gray-900"
                      style={{ textDecoration: isPurchased ? 'line-through' : 'none' }}
                    >
                      {item.product.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-bold" style={{ color: BRAND.blue }}>
                        {formatPrice(item.product.price_rdp)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(item.product.compare_rdp!)}
                        </span>
                      )}
                    </div>
                    <span className="inline-block text-xs font-medium mt-1 px-2 py-0.5 rounded-full" style={{ background: BRAND.bg, color: BRAND.gray }}>
                      {t(priorityLabelKey[item.priority])}
                    </span>
                  </div>
                  {isPurchased ? (
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ background: 'color-mix(in srgb, var(--color-success) 12%, transparent)', color: 'var(--color-success)' }}
                    >
                      {t('alreadyGiftedBadge')}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setOpenItemId(isOpen ? null : item.id)}
                      className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border flex-shrink-0"
                      style={{ borderColor: BRAND.blue, color: BRAND.blue }}
                    >
                      <Gift size={14} />
                      {t('giftThisButton')}
                    </button>
                  )}
                </div>

                {isOpen && !isPurchased && (
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <p className="text-sm font-medium text-gray-700 mb-2">{t('choosePaymentLabel')}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {PAYMENT_METHODS.map(method => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => handleChoosePayment(item.id, method.id)}
                          disabled={isSubmitting}
                          className="flex items-center gap-1.5 justify-center text-sm py-2 rounded-lg border disabled:opacity-60"
                          style={{ borderColor: BRAND.blue, color: BRAND.blue }}
                        >
                          {method.emoji} {t(method.labelKey)}
                        </button>
                      ))}
                    </div>
                    {isSubmitting && <p className="text-xs text-gray-400 mt-2">{t('givingButton')}</p>}
                    {itemError && <p className="text-xs mt-2" style={{ color: BRAND.red }}>{itemError}</p>}
                    <button
                      type="button"
                      onClick={() => setOpenItemId(null)}
                      className="text-xs text-gray-400 mt-2 underline"
                    >
                      {t('cancelButton')}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
