'use client'
// ============================================================
// MercadoRD — Detalle de disputa (comprador)
// Ruta: src/app/perfil/disputas/[id]/page.tsx
// ============================================================

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/shop/Navbar'
import { DisputeEvidenceCard } from '@/components/order/DisputeEvidenceCard'
import { DisputeMessageThread } from '@/components/order/DisputeMessageThread'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatDate } from '@/lib/utils'
import { BRAND } from '@/lib/colors'

interface DisputeDetail {
  id: string
  order_id: string
  vendor_id: string
  reason: string
  description: string
  status: string
  resolution: string | null
  created_at: string
}

// El texto de razón/estado se resuelve en render vía
// t('disputeReason.<reason>') / t('disputeStatus.<status>') — aquí solo
// quedan los colores del badge de estado, que no dependen del idioma.
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open:      { bg: '#FEF9C3', text: '#713f12' },
  reviewing: { bg: '#DBEAFE', text: '#1e3a8a' },
  resolved:  { bg: '#DCFCE7', text: '#166534' },
  closed:    { bg: '#F3F4F6', text: '#666' },
}

export default function DisputeDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const { t, language } = useTranslation('profile')

  const [dispute, setDispute] = useState<DisputeDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/login?redirect=/perfil/disputas/${params.id}`)
      return
    }

    const { data: disputeData, error: disputeError } = await supabase
      .from('disputes')
      .select('id, order_id, vendor_id, reason, description, status, resolution, created_at')
      .eq('id', params.id)
      .single()

    if (disputeError || !disputeData) {
      console.error('[DisputeDetailPage]', disputeError)
      setLoading(false)
      return
    }
    setDispute(disputeData)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-400 text-sm">{t('loadingDisputeDetail')}</div>
        </div>
      </div>
    )
  }

  if (!dispute) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <p className="text-gray-500">{t('disputeNotFound')}</p>
          <a href="/perfil/disputas" className="text-blue-600 underline mt-4 inline-block">{t('backToDisputesLink')}</a>
        </div>
      </div>
    )
  }

  const shortId = dispute.order_id.split('-')[0].toUpperCase()
  const knownStatus = dispute.status in STATUS_COLORS ? dispute.status : 'open'
  const statusColors = STATUS_COLORS[knownStatus]
  const statusLabel = t(`disputeStatus.${knownStatus}` as 'disputeStatus.open')
  const isClosed = dispute.status === 'resolved' || dispute.status === 'closed'
  const date = formatDate(dispute.created_at, language, {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <a href="/perfil/disputas" className="text-sm no-underline" style={{ color: BRAND.gray }}>
          ← {t('backToDisputesLink')}
        </a>

        {/* Info de la disputa */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-3 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <span style={{ color: BRAND.blue }} className="font-bold text-base">
              {t('orderNumberLabel', { id: `RD-${shortId}` })}
            </span>
            <span style={{ background: statusColors.bg, color: statusColors.text }} className="text-xs font-bold px-3 py-1 rounded-full">
              {statusLabel}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {t(`disputeReason.${dispute.reason}` as 'disputeReason.other')}
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-2">{dispute.description}</p>
          <p className="text-xs text-gray-400">{t('openedOnLabel', { date })}</p>

          {isClosed && dispute.resolution && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">{t('resolutionTitle')}</p>
              <p className="text-sm text-gray-700 leading-relaxed">{dispute.resolution}</p>
            </div>
          )}
        </div>

        {/* Evidencia objetiva — lo que se anunció + estado de entrega */}
        <div className="mb-4">
          <DisputeEvidenceCard orderId={dispute.order_id} vendorId={dispute.vendor_id} />
        </div>

        {/* Hilo de mensajes */}
        <DisputeMessageThread disputeId={dispute.id} senderRole="buyer" status={dispute.status} />
      </main>
    </div>
  )
}
