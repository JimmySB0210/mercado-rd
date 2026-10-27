'use client'
// ============================================================
// MercadoRD — «Requiere tu atención»
// Ruta: src/components/admin/ops/AttentionCards.tsx
// ============================================================
// Cada tarjeta cuenta registros reales y enlaza a su lista:
//   · Proveedores por verificar: registro completo (onboarding) y nivel 1.
//   · Contenido marcado: flagged_content sin revisar.
//   · Disputas abiertas: estado open o reviewing (cada disputa cuenta una vez).
// Soporte e incidentes todavía no tienen datos en la base: salen atenuados y
// sin número, para no insinuar una monitorización que no existe.
// Si un contador falla se muestra «No disponible», nunca 0.
// ============================================================

import Link from 'next/link'
import { AlertTriangle, CheckCircle2, ChevronRight, Flag, Headphones, Scale, Siren, UserCheck, type LucideIcon } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { AttentionData } from '@/lib/queries/adminOps'
import { PRIORITY_THRESHOLD_HOURS, ageMinutesSince } from '@/lib/admin/ops'
import { SectionError, pluralize, useAgeLabel } from './OpsPrimitives'

type Tone = 'amber' | 'red' | 'green' | 'blue' | 'muted'

interface CardModel {
  key: string
  icon: LucideIcon
  label: string
  tone: Tone
  href?: string
  value?: number
  unit?: string
  text?: string
  hint?: string
  hint2?: string
}

export function AttentionCards({ data, nowMs }: { data: AttentionData; nowMs: number }) {
  const { t } = useTranslation('admin')
  const ageLabel = useAgeLabel()

  const cards: CardModel[] = []
  let anyError = false

  // Proveedores por verificar
  if (data.vendors.ok) {
    const n = data.vendors.data
    cards.push({
      key: 'vendors', icon: UserCheck, label: t('ops.attnVendorsLabel'), tone: n > 0 ? 'amber' : 'green',
      href: '/admin/proveedores?estado=por_revisar', value: n, unit: pluralize(t, n, 'ops.unitVendor', 'ops.unitVendors'),
      hint: n > 0 ? t('ops.attnVendorsHint') : t('ops.attnAllClear'),
    })
  } else {
    anyError = true
    cards.push({ key: 'vendors', icon: UserCheck, label: t('ops.attnVendorsLabel'), tone: 'red', text: t('ops.unavailable'), hint: t('ops.attnUnavailableHint') })
  }

  // Contenido marcado
  if (data.content.ok) {
    const n = data.content.data
    cards.push({
      key: 'content', icon: Flag, label: t('ops.attnContentLabel'), tone: n > 0 ? 'amber' : 'green',
      href: '/admin/moderacion', value: n, unit: t('ops.unitToReview'),
      hint: n > 0 ? t('ops.attnContentHint') : t('ops.attnAllClear'),
    })
  } else {
    anyError = true
    cards.push({ key: 'content', icon: Flag, label: t('ops.attnContentLabel'), tone: 'red', text: t('ops.unavailable'), hint: t('ops.attnUnavailableHint') })
  }

  // Disputas abiertas (open + reviewing)
  if (data.disputes.ok) {
    const d = data.disputes.data
    const oldestAge = d.oldestPendingAt ? ageMinutesSince(d.oldestPendingAt, nowMs) : null
    const overdue = oldestAge !== null && oldestAge >= PRIORITY_THRESHOLD_HOURS.high * 60
    cards.push({
      key: 'disputes', icon: Scale, label: t('ops.attnDisputesLabel'), tone: d.pending === 0 ? 'green' : overdue ? 'red' : 'amber',
      href: '/admin/disputas?estado=pendientes', value: d.pending, unit: pluralize(t, d.pending, 'ops.unitCase', 'ops.unitCases'),
      hint: d.pending > 0 ? t('ops.attnDisputesHint', { open: d.open, reviewing: d.reviewing }) : t('ops.attnAllClear'),
      hint2: d.pending > 0 && oldestAge !== null ? t('ops.attnDisputesOldest', { age: ageLabel(oldestAge) }) : undefined,
    })
  } else {
    anyError = true
    cards.push({ key: 'disputes', icon: Scale, label: t('ops.attnDisputesLabel'), tone: 'red', text: t('ops.unavailable'), hint: t('ops.attnUnavailableHint') })
  }

  // Sin datos todavía (no se inventa ningún número)
  cards.push({ key: 'support', icon: Headphones, label: t('ops.attnSupportLabel'), tone: 'muted', text: t('ops.attnNotConnected'), hint: t('ops.attnSupportHint') })
  cards.push({ key: 'incidents', icon: Siren, label: t('ops.attnIncidentsLabel'), tone: 'muted', text: t('ops.attnNotConnected'), hint: t('ops.attnIncidentsHint') })

  const total = data.vendors.ok && data.content.ok && data.disputes.ok
    ? data.vendors.data + data.content.data + data.disputes.data.pending
    : null

  return (
    <section className="adm-card" aria-labelledby="adm-attn-title" id="requiere-atencion">
      <div className="adm-attn-head">
        <div>
          <h2 className="adm-attn-title" id="adm-attn-title">
            {t('ops.attnTitle')}
            {total !== null && total > 0 && (
              <span className="adm-attn-total" aria-label={t('ops.attnTotalAria', { n: total })}>{total}</span>
            )}
            {total === 0 && (
              <span className="adm-badge" data-tone="green"><CheckCircle2 size={13} aria-hidden="true" />{t('ops.attnAllClear')}</span>
            )}
          </h2>
          <p className="adm-card-sub">{t('ops.attnSubtitle')}</p>
        </div>
      </div>

      {anyError && (
        <div style={{ padding: '12px 16px 0' }}>
          <SectionError compact />
        </div>
      )}

      <div className="adm-attn-grid">
        {cards.map(c => {
          const Icon = c.icon
          const body = (
            <>
              <span className="adm-attn-ic" aria-hidden="true">{c.tone === 'red' && c.text ? <AlertTriangle size={20} /> : <Icon size={20} />}</span>
              <span className="adm-attn-body">
                <span className="adm-attn-label" style={{ display: 'block' }}>{c.label}</span>
                <span className="adm-attn-value">
                  {c.value !== undefined ? (
                    <>
                      <span className="adm-attn-num">{c.value}</span>
                      <span className="adm-attn-unit">{c.unit}</span>
                    </>
                  ) : (
                    <span className="adm-attn-text">{c.text}</span>
                  )}
                </span>
                {c.hint && <span className="adm-attn-hint" style={{ display: 'block' }}>{c.hint}</span>}
                {c.hint2 && <span className="adm-attn-hint" style={{ display: 'block' }}>{c.hint2}</span>}
              </span>
              {c.href && <ChevronRight className="adm-attn-chev" size={18} aria-hidden="true" />}
            </>
          )
          return c.href ? (
            <Link key={c.key} href={c.href} className="adm-attn-card" data-tone={c.tone} data-card={c.key}>{body}</Link>
          ) : (
            <div key={c.key} className="adm-attn-card" data-tone={c.tone} data-card={c.key}>{body}</div>
          )
        })}
      </div>
    </section>
  )
}
