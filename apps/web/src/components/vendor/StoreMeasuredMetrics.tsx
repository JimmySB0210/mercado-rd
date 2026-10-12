'use client'
// ============================================================
// MercadoRD — Métricas medidas de una tienda (perfil /tienda/[id])
// Ruta: src/components/vendor/StoreMeasuredMetrics.tsx
// ============================================================
// Tiempo de respuesta (get_vendor_response_minutes) y entregas a tiempo
// (get_vendor_on_time_rate), con el mismo hook y el mismo mínimo de
// muestra (MIN_SAMPLE_SIZE) que VendorTrustBar. Cada métrica muestra
// el tamaño de su muestra: respuestas del vendedor y entregas
// confirmadas. Si ninguna alcanza el mínimo, la sección no se
// renderiza.
// ============================================================

import { Clock, PackageCheck } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { responseTimeKey, useVendorTrustStats } from '@/lib/hooks/useVendorTrustStats'

export function StoreMeasuredMetrics({ vendorId }: { vendorId: string }) {
  const { t } = useTranslation('directory')
  const { t: tp } = useTranslation('products')
  const { loading, response, onTime, showResponse, showOnTime } = useVendorTrustStats(vendorId)

  if (loading || (!showResponse && !showOnTime)) return null

  return (
    <section aria-labelledby="store-metrics-title" className="store-section">
      <h2 id="store-metrics-title" className="store-section-title">{t('measuredMetricsTitle')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {showResponse && (
          <Metric
            icon={<Clock size={18} aria-hidden="true" />}
            label={t('responseTimeMetric')}
            value={tp(responseTimeKey(response!.median_minutes!))}
            basis={t('basedOnResponses', { count: response!.sample_size })}
          />
        )}
        {showOnTime && (
          <Metric
            icon={<PackageCheck size={18} aria-hidden="true" />}
            label={t('onTimeMetric')}
            value={`${Math.round(onTime!.rate!)}%`}
            basis={t('basedOnDeliveries', { count: onTime!.sample_size })}
          />
        )}
      </div>
    </section>
  )
}

function Metric({ icon, label, value, basis }: { icon: React.ReactNode; label: string; value: string; basis: string }) {
  return (
    <div className="flex items-start gap-3 p-3.5 border border-[var(--color-divider)] bg-[var(--color-bg-main)]" style={{ borderRadius: 'var(--radius-control)' }}>
      <span className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">{icon}</span>
      <div className="min-w-0">
        <p className="m-0 text-caption text-[var(--color-text-tertiary)]">{label}</p>
        <p className="m-0 text-h4 font-bold text-[var(--color-text-primary)]">{value}</p>
        <p className="m-0 text-badge text-[var(--color-text-tertiary)]">{basis}</p>
      </div>
    </div>
  )
}
