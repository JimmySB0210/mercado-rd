'use client'
// ============================================================
// MercadoRD — Línea de envío real (buy-box + pestaña "Envío y entrega")
// Ruta: src/components/product/ShippingEstimateLine.tsx
// ============================================================
// Mismo hook que ya usa ProductCard.tsx para "Envío desde RD$X":
// tarifa real por provincia (shipping_rates), nunca un rango de días
// ni una ruta origen→destino — esos datos no existen en el schema
// (shipping_rates solo tiene province_id + price_rdp). Sin provincia
// seleccionada no se muestra nada, igual que en las tarjetas de
// producto — nunca se adivina.
// ============================================================

import { Truck } from 'lucide-react'
import { useShippingRateForCurrentProvince } from '@/lib/hooks/useShippingRate'
import { useCartSubtotal } from '@/lib/store/cart'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatPrice } from '@/types/database.types'

// Mismo umbral que FreeShippingBadge.tsx / cart / checkout
const FREE_SHIPPING_THRESHOLD_RDP = 250000 // RD$2,500

export function ShippingEstimateLine({ className }: { className?: string }) {
  const { t } = useTranslation('products')
  const shippingRate = useShippingRateForCurrentProvince()
  const cartSubtotal = useCartSubtotal()
  const qualifiesFreeShipping = cartSubtotal >= FREE_SHIPPING_THRESHOLD_RDP

  // Mismo criterio que ProductCard.tsx (showShippingInfo): sin provincia
  // no se muestra nada; con provincia pero sin tarifa configurada
  // (shippingRate === null) tampoco, salvo que el carrito ya califique
  // para envío gratis — eso es cierto sin importar la tarifa real.
  const showShippingInfo = shippingRate !== undefined && (qualifiesFreeShipping || shippingRate !== null)
  if (!showShippingInfo) return null

  return (
    <p className={`flex items-center gap-1.5 text-sm ${className ?? ''}`} style={{ color: qualifiesFreeShipping ? 'var(--color-green)' : 'var(--color-text-secondary)', fontWeight: qualifiesFreeShipping ? 600 : 400 }}>
      <Truck size={15} className="flex-shrink-0" aria-hidden="true" />
      {qualifiesFreeShipping
        ? t('shippingFreeToProvinceLabel')
        : t('shippingToProvinceLabel', { amount: formatPrice(shippingRate!) })}
    </p>
  )
}
