'use client'
// ============================================================
// MercadoRD — Ofertas del día (contenido + cuenta regresiva en vivo)
// Ruta: src/components/shop/DailyDealsGrid.tsx
// ============================================================
// DailyDeals.tsx es un Server Component (fetch a Supabase) y no puede
// usar useTranslation ni setInterval. Este componente recibe las
// ofertas ya resueltas, arma el grid, y cada tarjeta recalcula su
// propio countdown cada segundo — no es una imagen ni un texto
// estático. Si una oferta expira mientras el usuario tiene la página
// abierta, esa tarjeta se retira sola; si todas expiran, la sección
// desaparece igual que si nunca hubiera habido ofertas.
// ============================================================

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/types/database.types'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/utils'

export interface DealViewModel {
  dealId: string
  productId: string
  productName: string
  productImage: string | null
  vendorName: string | null
  dealPriceRdp: number
  originalPriceRdp: number
  discountPercent: number
  expiresAt: string
}

// null = ya expiró
function formatCountdown(expiresAt: string): string | null {
  const diffMs = new Date(expiresAt).getTime() - Date.now()
  if (diffMs <= 0) return null
  const totalMinutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function DealCard({ deal, onExpire }: { deal: DealViewModel; onExpire: () => void }) {
  const [countdown, setCountdown] = useState<string | null>(() => formatCountdown(deal.expiresAt))

  // Cuenta regresiva real — se recalcula cada segundo a partir de
  // expires_at, no es un valor congelado en el primer render.
  useEffect(() => {
    const interval = setInterval(() => {
      const next = formatCountdown(deal.expiresAt)
      setCountdown(next)
      if (!next) onExpire()
    }, 1000)
    return () => clearInterval(interval)
  }, [deal.expiresAt, onExpire])

  if (!countdown) return null

  return (
    <Link
      href={`/producto/${deal.productId}`}
      className="block overflow-hidden bg-[var(--color-card-bg)] [box-shadow:var(--shadow-card)] hover:[box-shadow:var(--shadow-card-hover)] hover:-translate-y-0.5"
      style={{ borderRadius: 'var(--radius-card)', transition: 'box-shadow var(--transition-base), transform var(--transition-base)' }}
    >
      <div
        className="relative aspect-square overflow-hidden bg-gray-50"
        style={{ borderRadius: 'var(--radius-product-image) var(--radius-product-image) 0 0' }}
      >
        <Image
          src={deal.productImage ?? PLACEHOLDER_PRODUCT_IMAGE}
          alt={deal.productName}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        <span
          className="absolute top-2 left-2 text-white text-xs font-bold px-2.5 py-1"
          style={{ background: 'var(--color-badge-orange)', borderRadius: 'var(--radius-pill)' }}
        >
          -{deal.discountPercent}%
        </span>
        <span
          className="absolute bottom-2 right-2 flex items-center gap-1 text-white text-xs font-bold px-2 py-1"
          style={{ background: 'rgba(0,0,0,0.72)', borderRadius: 'var(--radius-pill)' }}
        >
          ⏱ {countdown}
        </span>
      </div>

      <div className="p-3">
        {deal.vendorName && (
          <span className="text-xs truncate block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            {deal.vendorName}
          </span>
        )}
        <p
          className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 leading-snug"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {deal.productName}
        </p>
        <div className="flex items-baseline gap-2">
          <span
            className="text-lg font-bold"
            style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-heading)', letterSpacing: 'var(--tracking-heading)' }}
          >
            {formatPrice(deal.dealPriceRdp)}
          </span>
          <span className="text-xs text-gray-400 line-through">
            {formatPrice(deal.originalPriceRdp)}
          </span>
        </div>
      </div>
    </Link>
  )
}

export function DailyDealsGrid({ deals }: { deals: DealViewModel[] }) {
  const { t } = useTranslation('products')
  const [expiredIds, setExpiredIds] = useState<Set<string>>(new Set())

  const visibleDeals = deals.filter(d => !expiredIds.has(d.dealId))
  if (visibleDeals.length === 0) return null

  const markExpired = (dealId: string) => {
    setExpiredIds(prev => (prev.has(dealId) ? prev : new Set(prev).add(dealId)))
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 16px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          {t('dailyDealsTitle')}
        </h2>
      </div>
      <div className="grid-products">
        {visibleDeals.map(deal => (
          <DealCard key={deal.dealId} deal={deal} onExpire={() => markExpired(deal.dealId)} />
        ))}
      </div>
    </div>
  )
}
