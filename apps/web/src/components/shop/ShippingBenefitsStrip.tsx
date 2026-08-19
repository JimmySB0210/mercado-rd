'use client'
// ============================================================
// MercadoRD — Franja de envío gratis + beneficios (home)
// Ruta: src/components/shop/ShippingBenefitsStrip.tsx
// ============================================================
// Nueva — Fase 2A Batch 2, a pedido explícito del usuario, separada
// del carrusel del hero. NO reemplaza PerksSlide (dentro de
// HeroBanner.tsx, dentro del carrusel) ni el trust bar de
// HomeProductGrid.tsx — hoy conviven 3 franjas de beneficios
// distintas; la reconciliación queda para un batch de limpieza aparte.
// ============================================================

import { ShieldCheck, Store, Headset } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'

// Mismo umbral real que ya usa todo el sitio (cart/page.tsx,
// checkout/page.tsx, FreeShippingBadge.tsx) — no cambiar aquí sin
// cambiarlo en los otros 3 lugares.
const FREE_SHIPPING_THRESHOLD_RDP = 250000 // RD$2,500

const EXTRA_PERKS = [
  { icon: ShieldCheck, key: 'shippingStripProtected' as const },
  { icon: Store, key: 'shippingStripStores' as const },
  { icon: Headset, key: 'shippingStripSupport' as const },
]

export function ShippingBenefitsStrip() {
  const { t } = useTranslation('home')
  const amount = (FREE_SHIPPING_THRESHOLD_RDP / 100).toLocaleString('es-DO')

  return (
    <div style={{ background: 'var(--color-card-bg)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
      <div className="max-w-[1400px] mx-auto px-4 md-860:px-6 scroll-hide-x flex items-center gap-6 md-860:gap-10 whitespace-nowrap py-3">
        <span
          className="flex-shrink-0 text-sm md-860:text-base font-bold"
          style={{ color: 'var(--color-primary)' }}
        >
          {t('shippingStripMain', { amount })}
        </span>

        {EXTRA_PERKS.map(perk => {
          const Icon = perk.icon
          return (
            <span
              key={perk.key}
              className="flex-shrink-0 flex items-center gap-1.5 text-xs md-860:text-sm font-medium text-gray-600"
            >
              <Icon size={16} color="var(--color-text-secondary)" />
              {t(perk.key)}
            </span>
          )
        })}
      </div>
    </div>
  )
}
