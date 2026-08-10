'use client'
// ============================================================
// MercadoRD — Timeline visual de seguimiento de pedido
// Ruta: src/components/shop/OrderTimeline.tsx
// ============================================================

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { BRAND } from '@/lib/colors'

interface HistoryRow {
  status: string
  created_at: string
}

interface Props {
  orderId: string
}

const MAIN_STEPS = ['pending', 'confirmed', 'shipped', 'delivered'] as const

export function OrderTimeline({ orderId }: Props) {
  const { t } = useTranslation('profile')
  const [history, setHistory] = useState<HistoryRow[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const load = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('order_status_history')
        .select('status, created_at')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true })

      if (!active) return
      if (error) console.error('[OrderTimeline]', error)
      setHistory(data ?? [])
      setLoading(false)
    }

    load()
    return () => { active = false }
  }, [orderId])

  if (loading) {
    return <div style={{ fontSize: 12, color: '#999', padding: '10px 4px' }}>{t('loadingTimeline')}</div>
  }

  if (!history || history.length === 0) {
    return null
  }

  // Primera vez que ocurrió cada estado
  const firstSeenAt = new Map<string, string>()
  for (const row of history) {
    if (!firstSeenAt.has(row.status)) firstSeenAt.set(row.status, row.created_at)
  }

  const isCancelled = firstSeenAt.has('cancelled')

  // Último paso principal alcanzado — para cortar la cadena ahí si se canceló
  let lastReachedIndex = -1
  MAIN_STEPS.forEach((status, i) => {
    if (firstSeenAt.has(status)) lastReachedIndex = i
  })

  const steps = isCancelled
    ? [...MAIN_STEPS.slice(0, lastReachedIndex + 1), 'cancelled' as const]
    : MAIN_STEPS

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('es-DO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

  return (
    <div style={{ padding: '12px 4px' }}>
      {steps.map((status, i) => {
        const reachedAt = firstSeenAt.get(status)
        const isReached = !!reachedAt
        const isLast = i === steps.length - 1
        const isCancelledStep = status === 'cancelled'
        const dotColor = isCancelledStep ? '#C62828' : BRAND.blue

        return (
          <div key={status} style={{ display: 'flex', gap: 12 }}>
            {/* Círculo + línea conectora */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14 }}>
              <div
                style={{
                  width: 14, height: 14, borderRadius: '50%', flexShrink: 0, boxSizing: 'border-box',
                  border: `2px solid ${isReached || isCancelledStep ? dotColor : '#ccc'}`,
                  background: isReached || isCancelledStep ? dotColor : '#fff',
                }}
              />
              {!isLast && (
                <div style={{ width: 2, flex: 1, minHeight: 28, background: isReached ? BRAND.blue : '#ddd' }} />
              )}
            </div>

            {/* Texto */}
            <div style={{ paddingBottom: isLast ? 0 : 16 }}>
              <p style={{
                fontSize: 13, fontWeight: 600, margin: 0,
                color: isCancelledStep ? '#C62828' : (isReached ? BRAND.dark : '#999'),
              }}>
                {t(`timelineStep.${status}` as 'timelineStep.pending')}
              </p>
              {reachedAt && (
                <p style={{ fontSize: 11, color: '#999', margin: '2px 0 0' }}>
                  {formatDate(reachedAt)}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
