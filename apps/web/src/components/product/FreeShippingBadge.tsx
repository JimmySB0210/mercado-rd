'use client'
// ============================================================
// MercadoRD — Aviso de envío gratis (producto)
// Ruta: src/components/product/FreeShippingBadge.tsx
// ============================================================

import { useCartSubtotal } from '@/lib/store/cart'
import { useTranslation } from '@/lib/hooks/useTranslation'

// Mismo umbral que cart/page.tsx y checkout/page.tsx
const FREE_SHIPPING_THRESHOLD_RDP = 250000 // RD$2,500

export function FreeShippingBadge() {
  const { t } = useTranslation('products')
  const cartSubtotal = useCartSubtotal()

  return (
    <div
      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-medium text-sm"
      style={{ background: 'rgba(13,71,161,0.08)', color: 'var(--brand-blue)' }}
    >
      {cartSubtotal >= FREE_SHIPPING_THRESHOLD_RDP
        ? t('freeShippingApplied')
        : t('freeShippingProgress', {
            threshold: (FREE_SHIPPING_THRESHOLD_RDP / 100).toLocaleString('es-DO'),
            amount: ((FREE_SHIPPING_THRESHOLD_RDP - cartSubtotal) / 100).toLocaleString('es-DO'),
          })}
    </div>
  )
}
