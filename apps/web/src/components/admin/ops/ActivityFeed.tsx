'use client'
// ============================================================
// MercadoRD — Actividad reciente
// Ruta: src/components/admin/ops/ActivityFeed.tsx
// ============================================================
// Resume los últimos eventos de auditoría (audit_logs). Un evento es un REGISTRO
// de que algo pasó, no una alerta: aquí no se pintan en rojo ni cuentan para
// «Requiere tu atención». Cada línea enlaza a la auditoría completa filtrada por
// ese tipo de evento y ese día. No se muestra `metadata` (puede ser sensible).
//
// Los tipos de evento conocidos tienen texto propio (auditEvent.*); uno nuevo
// que todavía no esté en el diccionario sale con un texto genérico y su nombre
// técnico, sin ocultarse.
// ============================================================

import Link from 'next/link'
import {
  Activity, ArrowRight, BadgeCheck, Gift, KeyRound, MessageSquare, PackageCheck, Scale, ShoppingCart, UserMinus,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { ActivityItem } from '@/lib/queries/adminOps'
import { KNOWN_AUDIT_EVENTS, auditEventIcon, formatClock, formatDayMonthYear, type EventIcon, type Section } from '@/lib/admin/ops'
import { EmptyState, SectionError, useAgeLabel } from './OpsPrimitives'

const ICONS: Record<EventIcon, LucideIcon> = {
  order: ShoppingCart,
  delivery: PackageCheck,
  dispute: Scale,
  verification: BadgeCheck,
  gift: Gift,
  chat: MessageSquare,
  user: UserMinus,
  security: KeyRound,
  generic: Activity,
}

const TONES: Record<EventIcon, 'blue' | 'green' | 'amber' | 'muted'> = {
  order: 'blue',
  delivery: 'green',
  dispute: 'amber',
  verification: 'blue',
  gift: 'blue',
  chat: 'blue',
  user: 'muted',
  security: 'amber',
  generic: 'muted',
}

export function ActivityFeed({ data }: { data: Section<ActivityItem[]> }) {
  const { t, language } = useTranslation('admin')
  const ageLabel = useAgeLabel()

  return (
    <section className="adm-card" aria-labelledby="adm-activity-title" id="actividad-reciente">
      <div className="adm-card-head">
        <div>
          <h2 className="adm-card-title" id="adm-activity-title">{t('ops.activityTitle')}</h2>
          <p className="adm-card-sub">{t('ops.activitySubtitle')}</p>
        </div>
      </div>

      {!data.ok ? (
        <div style={{ padding: 16 }}><SectionError /></div>
      ) : data.data.length === 0 ? (
        <EmptyState title={t('ops.activityEmptyTitle')} body={t('ops.activityEmptyBody')} />
      ) : (
        <div className="adm-card-body">
          <ul className="adm-feed">
            {data.data.map(item => {
              const kind = auditEventIcon(item.eventType)
              const Icon = ICONS[kind]
              const known = Object.prototype.hasOwnProperty.call(KNOWN_AUDIT_EVENTS, item.eventType)
              const label = known
                ? t(`auditEvent.${item.eventType}` as Parameters<typeof t>[0])
                : t('ops.activityUnknown', { type: item.eventType })
              const exact = `${formatDayMonthYear(item.createdAt, language)}, ${formatClock(item.createdAt)}`
              return (
                <li key={item.id} data-event={item.eventType}>
                  <span className="adm-feed-ic" data-tone={TONES[kind]} aria-hidden="true"><Icon size={16} /></span>
                  <div className="adm-feed-main">
                    <Link href={item.href} className="adm-feed-label">{label}</Link>
                    <div className="adm-feed-meta">
                      {item.relatedRef && <span className="adm-ref">{item.relatedRef}</span>}
                      {item.relatedRef && item.actorName && ' · '}
                      {item.actorName && t('ops.activityBy', { name: item.actorName })}
                    </div>
                  </div>
                  <time className="adm-feed-time" dateTime={item.createdAt} title={exact}>{ageLabel(item.ageMinutes)}</time>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="adm-card-foot">
        <span>{t('ops.activityFooter')}</span>
        <Link href="/admin/auditoria" className="adm-link">
          {t('ops.activityViewAll')}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
