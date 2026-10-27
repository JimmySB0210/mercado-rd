'use client'
// ============================================================
// MercadoRD — Estado técnico
// Ruta: src/components/admin/ops/SystemStatusCard.tsx
// ============================================================
// Mercado RD todavía NO guarda disponibilidad, errores de servidor, latencia ni
// colas: por eso esta tarjeta no muestra semáforos «Operativo» ni porcentajes.
// Dice con claridad que la monitorización no está conectada y lista lo que está
// pendiente de integrar con «Sin datos».
//
// Lo único real que se muestra es lo que sí existe en la base: las solicitudes
// de verificación externa (KYC, RNC, IMEI, VIN) que quedaron «unavailable»
// porque todavía no hay proveedor conectado. Si esa lectura falla se dice
// «No disponible», no 0.
// ============================================================

import { AlertTriangle, PlugZap } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { TechnicalStatusData } from '@/lib/queries/adminOps'
import type { Section } from '@/lib/admin/ops'

const PENDING_ITEMS = [
  'ops.statusItemUptime',
  'ops.statusItemErrors',
  'ops.statusItemLatency',
  'ops.statusItemJobs',
] as const

export function SystemStatusCard({ data }: { data: Section<TechnicalStatusData> }) {
  const { t } = useTranslation('admin')

  return (
    <section className="adm-card" aria-labelledby="adm-status-title" id="estado-tecnico">
      <div className="adm-card-head">
        <div>
          <h2 className="adm-card-title" id="adm-status-title">{t('ops.statusTitle')}</h2>
          <p className="adm-card-sub">{t('ops.statusSubtitle')}</p>
        </div>
      </div>

      <div className="adm-card-body" style={{ display: 'grid', gap: 12 }}>
        <div>
          <span className="adm-badge" data-tone="muted"><PlugZap size={12} aria-hidden="true" />{t('ops.statusBadge')}</span>
        </div>
        <p className="adm-card-sub" style={{ margin: 0 }}>{t('ops.statusBody')}</p>

        <ul className="adm-pending-list" aria-label={t('ops.statusPendingTitle')}>
          {PENDING_ITEMS.map(key => (
            <li key={key}>
              <span>{t(key)}</span>
              <span className="adm-badge" data-tone="muted">{t('ops.statusNoData')}</span>
            </li>
          ))}
        </ul>

        <div>
          <p className="adm-card-sub" style={{ margin: '0 0 6px', fontWeight: 600, color: 'var(--adm-text)' }}>{t('ops.statusRealTitle')}</p>
          {data.ok ? (
            <div className="adm-note" data-tone="muted" data-status="external-verifications">
              <PlugZap size={14} aria-hidden="true" />
              <span>{t('ops.statusExtVerif', { n: data.data.externalVerificationsWithoutProvider })}</span>
            </div>
          ) : (
            <div className="adm-note" data-tone="red" role="alert">
              <AlertTriangle size={14} aria-hidden="true" />
              <span>{t('ops.statusExtVerifError')}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
