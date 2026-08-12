'use client'
// ============================================================
// MercadoRD — Evidencia objetiva de una disputa
// Ruta: src/components/order/DisputeEvidenceCard.tsx
// ============================================================
// Compartido entre perfil/disputas/[id]/page.tsx (comprador) y el
// panel de admin (DisputeAdminRow.tsx) — misma evidencia, mismo
// componente, para que se vea idéntico en ambos lados. Self-fetching:
// consulta order_items.product_snapshot y delivery_otps directo (RLS
// ya decide qué puede ver cada rol), en vez de depender de que cada
// página resuelva estos datos por su cuenta.
//
// Una orden puede tener items de más de un vendor — una disputa es
// siempre contra UN vendor, así que se filtra order_items por
// order_id Y vendor_id, no por toda la orden.
// ============================================================

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatDate } from '@/lib/utils'
import { formatPrice } from '@/types/database.types'

interface ProductSnapshot {
  name: string
  description: string | null
  price_rdp: number
  images: string[] | null
  category: string | null
  vendor_business_name: string | null
  attributes: { label: string; value: string }[]
  snapshot_at: string
}

type DeliveryStatus =
  | { state: 'loading' }
  | { state: 'no_otp' }
  | { state: 'verified'; verifiedAt: string }
  | { state: 'unverified' }

interface Props {
  orderId: string
  vendorId: string
}

export function DisputeEvidenceCard({ orderId, vendorId }: Props) {
  const { t, language } = useTranslation('profile')
  const [snapshot, setSnapshot] = useState<ProductSnapshot | null>(null)
  const [delivery, setDelivery] = useState<DeliveryStatus>({ state: 'loading' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const load = async () => {
      const supabase = createClient()

      const [{ data: items }, { data: otp }] = await Promise.all([
        supabase
          .from('order_items')
          .select('product_snapshot')
          .eq('order_id', orderId)
          .eq('vendor_id', vendorId),
        supabase
          .from('delivery_otps')
          .select('verified_at')
          .eq('order_id', orderId)
          .maybeSingle(),
      ])

      if (!active) return

      const firstSnapshot = items?.find(i => !!i.product_snapshot)?.product_snapshot as ProductSnapshot | undefined
      setSnapshot(firstSnapshot ?? null)

      if (!otp) {
        setDelivery({ state: 'no_otp' })
      } else if (otp.verified_at) {
        setDelivery({ state: 'verified', verifiedAt: otp.verified_at })
      } else {
        setDelivery({ state: 'unverified' })
      }

      setLoading(false)
    }

    load()
    return () => { active = false }
  }, [orderId, vendorId])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4 text-sm text-gray-400">
        {t('loadingEvidence')}
      </div>
    )
  }

  if (!snapshot && delivery.state === 'no_otp') return null

  return (
    <div className="flex flex-col gap-4">
      {snapshot && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('announcedProductHeading')}</h2>
          <div className="flex gap-3">
            <div className="w-16 h-16 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden">
              {snapshot.images?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={snapshot.images[0]} alt={snapshot.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{snapshot.name}</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{formatPrice(snapshot.price_rdp)}</p>
              <p className="text-xs text-gray-400 mt-1">
                {t('snapshotDateLabel', { date: formatDate(snapshot.snapshot_at, language, { day: 'numeric', month: 'long', year: 'numeric' }) })}
              </p>
            </div>
          </div>

          {snapshot.attributes.length > 0 && (
            <dl className="text-sm mt-3 pt-3 border-t border-gray-50">
              {snapshot.attributes.map((attr, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-1">
                  <dt className="text-gray-400">{attr.label}</dt>
                  <dd className="text-gray-700 font-medium text-right">{attr.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      {delivery.state !== 'no_otp' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">{t('deliveryStatusHeading')}</h2>
          {delivery.state === 'verified' ? (
            <p className="text-sm text-green-700">
              {t('deliveryConfirmedWithCode', { date: formatDate(delivery.verifiedAt, language, { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' }) })}
            </p>
          ) : delivery.state === 'unverified' ? (
            <p className="text-sm text-amber-700">{t('deliveryNeverConfirmed')}</p>
          ) : null}
        </div>
      )}
    </div>
  )
}
