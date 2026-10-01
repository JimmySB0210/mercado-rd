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
import { useShippingRateForCurrentProvince, useMinShippingRate } from '@/lib/hooks/useShippingRate'
import { useOptionalProductActionsContext } from '@/components/product/ProductActions'
import { useCartSubtotal } from '@/lib/store/cart'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatPrice } from '@/types/database.types'
import { qualifiesForFreeShipping, amountUntilFreeShippingRdp, resolveEffectiveUnitPriceRdp, type PricingTierLike } from '@/lib/shipping'

interface Props {
  className?: string
  // Presentes solo en la instancia del buy-box (dentro de
  // ProductActionsProvider) — con esto + la cantidad seleccionada del
  // contexto se arma la 2da línea de envío gratis/"te faltan". La
  // instancia de la pestaña "Envío y entrega" no los pasa (vive fuera
  // del Provider) y se queda con el comportamiento simple de siempre.
  basePriceRdp?: number
  pricingTiers?: PricingTierLike[]
}

// Sin promoción de "envío gratis" en la línea base — siempre el costo
// real de la zona del comprador. Sin provincia conocida todavía, cae al
// mínimo real entre todas las tarifas (nunca se oculta ni se adivina un
// valor que no viene de shipping_rates). Cuando se conoce el precio del
// producto + la cantidad elegida (ver Props), se agrega una 2da línea
// con la MISMA regla de envío gratis que create_order_from_cart —
// ver lib/shipping.ts.
export function ShippingEstimateLine({ className, basePriceRdp, pricingTiers = [] }: Props) {
  const { t } = useTranslation('products')
  const shippingRate = useShippingRateForCurrentProvince()
  const minRate = useMinShippingRate()
  const cartSubtotal = useCartSubtotal()
  const actions = useOptionalProductActionsContext()

  // Con provincia conocida: tarifa real de esa provincia, "a tu
  // provincia". Sin provincia todavía: mínimo real entre todas las
  // tarifas, sin esa frase (no sabemos aún cuál es "su" provincia).
  const knownProvinceAmount = shippingRate ?? null
  const amount = knownProvinceAmount ?? (shippingRate === undefined ? minRate : null)

  // "Si agregara esto al carrito real, ¿el pedido completo (con todo lo
  // que ya está adentro) calificaría para envío gratis?" — mismo
  // subtotal (sin ITBIS) y misma resolución de tramo que el RPC. No es
  // "solo este ítem": el checkout normal cobra el carrito entero, así
  // que la pregunta honesta es sobre el carrito + este ítem.
  const freeShippingLine = (() => {
    if (basePriceRdp == null || !actions) return null
    const unitPrice = resolveEffectiveUnitPriceRdp(basePriceRdp, pricingTiers, actions.quantity)
    const projectedSubtotal = cartSubtotal + unitPrice * actions.quantity
    return qualifiesForFreeShipping(projectedSubtotal)
      ? { free: true as const }
      : { free: false as const, remaining: amountUntilFreeShippingRdp(projectedSubtotal) }
  })()

  if (amount == null && !freeShippingLine) return null

  return (
    <div className={`flex flex-col gap-1 ${className ?? ''}`}>
      {amount != null && (
        <p className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <Truck size={15} className="flex-shrink-0" aria-hidden="true" />
          {knownProvinceAmount != null
            ? t('shippingToProvinceLabel', { amount: formatPrice(amount) })
            : t('shippingFromLabel', { amount: formatPrice(amount) })}
        </p>
      )}
      {freeShippingLine && (
        <p className="text-xs font-medium" style={{ color: freeShippingLine.free ? 'var(--color-green)' : 'var(--color-text-secondary)' }}>
          {freeShippingLine.free
            ? t('freeShippingQualifiedShort')
            : t('freeShippingRemainingShort', { amount: formatPrice(freeShippingLine.remaining) })}
        </p>
      )}
    </div>
  )
}
