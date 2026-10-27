'use client'
// ============================================================
// MercadoRD — Resumen de disputas
// Ruta: src/components/admin/ops/DisputesSummary.tsx
// ============================================================
// Cuenta TODAS las disputas por estado (open, reviewing, resolved, closed) con
// contadores exactos de la base; cada disputa cuenta una sola vez. La barra es
// solo una ayuda visual: los números están en la lista de al lado (y cada fila
// enlaza a /admin/disputas con ese filtro). Si la lectura falla se muestra el
// error, nunca ceros.
// ============================================================

import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { DisputeCounts } from '@/lib/queries/adminOps'
import { PRIORITY_THRESHOLD_HOURS, ageMinutesSince, disputesHref, type Section } from '@/lib/admin/ops'
import { EmptyState, SectionError, useAgeLabel, type AdminT } from './OpsPrimitives'

const SEGMENTS = [
  { key: 'open', filter: 'abiertas', color: '#c77700', label: 'ops.disputesOpen' },
  { key: 'reviewing', filter: 'en_revision', color: '#0458b4', label: 'ops.disputesReviewing' },
  { key: 'resolved', filter: 'resueltas', color: '#00a86b', label: 'ops.disputesResolved' },
  { key: 'closed', filter: 'cerradas', color: '#8895a5', label: 'ops.disputesClosed' },
] as const

export function DisputesSummary({ data, nowMs }: { data: Section<DisputeCounts>; nowMs: number }) {
  const { t } = useTranslation('admin')
  const ageLabel = useAgeLabel()

  return (
    <section className="adm-card" aria-labelledby="adm-disputes-title" id="resumen-disputas">
      <div className="adm-card-head">
        <div>
          <h2 className="adm-card-title" id="adm-disputes-title">{t('ops.disputesTitle')}</h2>
          <p className="adm-card-sub">{t('ops.disputesSubtitle')}</p>
        </div>
      </div>

      {!data.ok ? (
        <div style={{ padding: 16 }}><SectionError /></div>
      ) : (
        <DisputesBody counts={data.data} nowMs={nowMs} t={t} ageLabel={ageLabel} />
      )}
    </section>
  )
}

function DisputesBody({
  counts,
  nowMs,
  t,
  ageLabel,
}: {
  counts: DisputeCounts
  nowMs: number
  t: AdminT
  ageLabel: (ageMinutes: number) => string
}) {
  const total = counts.open + counts.reviewing + counts.resolved + counts.closed
  if (total === 0) {
    return <EmptyState title={t('ops.disputesEmptyTitle')} body={t('ops.disputesEmptyBody')} />
  }
  const oldest = counts.oldestPendingAt ? ageMinutesSince(counts.oldestPendingAt, nowMs) : null

  return (
    <div className="adm-card-body">
      <div className="adm-bar" aria-hidden="true">
        {SEGMENTS.map(s => {
          const n = counts[s.key]
          return n > 0 ? <span key={s.key} style={{ width: `${(n / total) * 100}%`, background: s.color }} /> : null
        })}
      </div>
      <ul className="adm-legend" aria-label={t('ops.disputesLegendAria', { total })}>
        {SEGMENTS.map(s => (
          <li key={s.key}>
            <Link href={`/admin/disputas?estado=${s.filter}`} className="adm-legend-key adm-link" style={{ color: 'inherit', fontWeight: 500 }}>
              <span className="adm-swatch" style={{ background: s.color }} aria-hidden="true" />
              {t(s.label)}
            </Link>
            <strong>{counts[s.key]}</strong>
          </li>
        ))}
      </ul>
      {counts.pending > 0 && oldest !== null && (
        <div className="adm-note" data-tone={oldest >= PRIORITY_THRESHOLD_HOURS.high * 60 ? 'red' : 'amber'} style={{ marginTop: 14 }}>
          <Clock size={14} aria-hidden="true" />
          <span>{t('ops.disputesOldestPending', { age: ageLabel(oldest) })}</span>
        </div>
      )}
      <div style={{ marginTop: 14 }}>
        <Link href={disputesHref({ filter: 'todas' })} className="adm-link">
          {t('ops.disputesViewAll')}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
