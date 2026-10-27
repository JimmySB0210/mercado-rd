'use client'
// ============================================================
// MercadoRD — Tarjetas secundarias del Centro de operaciones
// Ruta: src/components/admin/ops/SecondaryCards.tsx
// ============================================================
// Lo que ya existía en el panel (pedidos recientes, pagos, carritos abandonados,
// proveedores) con las mismas fuentes de datos pero leído de forma comprobada:
//   · un error dice «No disponible» (nunca se convierte en 0 ni en lista vacía);
//   · las sumas dicen si son parciales; los conteos que no se pudieron hacer
//     salen como «—», no como 0;
//   · un valor de la base que todavía no tiene texto traducido se muestra tal cual.
// ============================================================

import Link from 'next/link'
import { ArrowRight, Info } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { AbandonedCartsData, PaymentsSummary, RecentOrder, RecentVendor } from '@/lib/queries/adminOps'
import { formatDayMonthYear, formatRdp, shortRef, type Section } from '@/lib/admin/ops'
import { EmptyState, SectionError, labelOr } from './OpsPrimitives'

type Tone = 'amber' | 'blue' | 'green' | 'muted'

const ORDER_STATUS_TONE: Record<string, Tone> = {
  pending: 'amber',
  confirmed: 'blue',
  preparing: 'blue',
  shipped: 'blue',
  delivered: 'green',
  cancelled: 'muted',
}

function CardHead({ id, title, subtitle }: { id: string; title: string; subtitle?: string }) {
  return (
    <div className="adm-card-head">
      <div>
        <h2 className="adm-card-title" id={id}>{title}</h2>
        {subtitle && <p className="adm-card-sub">{subtitle}</p>}
      </div>
    </div>
  )
}

// ─── Pedidos recientes ───────────────────────────────────────────────────────

export function RecentOrdersCard({ data }: { data: Section<RecentOrder[]> }) {
  const { t, language } = useTranslation('admin')

  return (
    <section className="adm-card" aria-labelledby="adm-orders-title" id="pedidos-recientes">
      <CardHead id="adm-orders-title" title={t('ops.ordersTitle')} subtitle={t('ops.ordersSubtitle')} />
      {!data.ok ? (
        <div style={{ padding: 16 }}><SectionError /></div>
      ) : data.data.length === 0 ? (
        <EmptyState title={t('ops.ordersEmptyTitle')} body={t('ops.ordersEmptyBody')} />
      ) : (
        <div className="adm-card-body-flush adm-table-wrap">
          <table className="adm-table" data-stack>
            <caption className="adm-vh">{t('ops.ordersTitle')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('ops.colOrder')}</th>
                <th scope="col">{t('ops.colCustomer')}</th>
                <th scope="col" className="adm-num">{t('ops.colItems')}</th>
                <th scope="col" className="adm-num">{t('ops.colTotal')}</th>
                <th scope="col">{t('ops.colState')}</th>
                <th scope="col">{t('ops.colDate')}</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map(o => (
                <tr key={o.id} data-order={o.id}>
                  <td data-label={t('ops.colOrder')}><span className="adm-ref">{shortRef(o.id)}</span></td>
                  <td data-label={t('ops.colCustomer')}>{o.buyer_name ?? '—'}</td>
                  <td data-label={t('ops.colItems')} className="adm-num">{o.item_count ?? '—'}</td>
                  <td data-label={t('ops.colTotal')} className="adm-num adm-strong">{formatRdp(o.total_rdp)}</td>
                  <td data-label={t('ops.colState')}>
                    <span className="adm-badge" data-tone={ORDER_STATUS_TONE[o.status] ?? 'muted'}>
                      {labelOr(t, `opsOrderStatus.${o.status}`, o.status)}
                    </span>
                  </td>
                  <td data-label={t('ops.colDate')}>{formatDayMonthYear(o.created_at, language)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// ─── Pagos registrados ───────────────────────────────────────────────────────

export function PaymentsCard({ data }: { data: Section<PaymentsSummary> }) {
  const { t } = useTranslation('admin')

  const unit = (n: number) => (n === 1 ? t('paymentSingular') : t('paymentPlural'))
  const rows = (group: Record<string, { count: number; amount: number }>, prefix: 'paymentMethod' | 'paymentStatus') =>
    Object.entries(group)
      .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
      .map(([key, v]) => (
        <li key={key} data-key={key}>
          <span>{labelOr(t, `${prefix}.${key}`, key)}</span>
          <span><strong>{v.count}</strong> {unit(v.count)} · {formatRdp(v.amount)}</span>
        </li>
      ))

  return (
    <section className="adm-card" aria-labelledby="adm-payments-title" id="pagos-registrados">
      <CardHead id="adm-payments-title" title={t('ops.paymentsTitle')} subtitle={t('ops.paymentsSubtitle')} />
      {!data.ok ? (
        <div style={{ padding: 16 }}><SectionError /></div>
      ) : data.data.totalCount === 0 ? (
        <EmptyState title={t('noPaymentsYet')} />
      ) : (
        <div className="adm-card-body" style={{ display: 'grid', gap: 14 }}>
          <div>
            <p className="adm-card-sub" style={{ margin: 0, fontWeight: 600, color: 'var(--adm-text)' }}>{t('ops.paymentsByMethod')}</p>
            <ul className="adm-legend">{rows(data.data.byMethod, 'paymentMethod')}</ul>
          </div>
          <div>
            <p className="adm-card-sub" style={{ margin: 0, fontWeight: 600, color: 'var(--adm-text)' }}>{t('paymentsByStatusTitle')}</p>
            <ul className="adm-legend">{rows(data.data.byStatus, 'paymentStatus')}</ul>
          </div>
          {!data.data.complete && (
            <div className="adm-note" data-tone="amber" role="note">
              <Info size={14} aria-hidden="true" />
              <span>{t('ops.paymentsPartial')}</span>
            </div>
          )}
        </div>
      )}
      <div className="adm-card-foot"><span>{t('ops.paymentsNote')}</span></div>
    </section>
  )
}

// ─── Carritos abandonados ────────────────────────────────────────────────────

export function AbandonedCartsCard({ data }: { data: Section<AbandonedCartsData> }) {
  const { t } = useTranslation('admin')

  return (
    <section className="adm-card" aria-labelledby="adm-carts-title" id="carritos-abandonados">
      <CardHead id="adm-carts-title" title={t('ops.cartsTitle')} subtitle={t('ops.cartsSubtitle')} />
      {!data.ok ? (
        <div style={{ padding: 16 }}><SectionError /></div>
      ) : data.data.totalUnrecovered === 0 ? (
        <EmptyState title={t('ops.cartsEmptyTitle')} body={t('ops.cartsEmptyBody')} />
      ) : (
        <div className="adm-card-body" style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div className="adm-kpi-sub">{t('unrecoveredLabel')}</div>
              <div className="adm-kpi-val">{data.data.totalUnrecovered}</div>
            </div>
            <div>
              <div className="adm-kpi-sub">{t('ops.cartsPotentialValue')}</div>
              <div className="adm-kpi-val">{formatRdp(data.data.totalPotentialValue)}</div>
            </div>
          </div>
          <ul className="adm-legend" style={{ marginTop: 0 }}>
            {data.data.recent.map(c => (
              <li key={c.id}>
                <span>{c.buyer_name ?? '—'}</span>
                <strong>{formatRdp(c.total_rdp)}</strong>
              </li>
            ))}
          </ul>
          {!data.data.complete && (
            <div className="adm-note" data-tone="amber" role="note">
              <Info size={14} aria-hidden="true" />
              <span>{t('ops.cartsPartial')}</span>
            </div>
          )}
        </div>
      )}
      <div className="adm-card-foot"><span>{t('ops.cartsNote')}</span></div>
    </section>
  )
}

// ─── Proveedores recientes ───────────────────────────────────────────────────

export function RecentVendorsCard({ data }: { data: Section<RecentVendor[]> }) {
  const { t } = useTranslation('admin')
  const { t: tv } = useTranslation('vendorOptions')
  const levelLabel = (level: number) => {
    const key = `verificationLevel.${level}`
    const label = tv(key as Parameters<typeof tv>[0])
    return label === key ? `${t('ops.colLevel')} ${level}` : label
  }

  return (
    <section className="adm-card" aria-labelledby="adm-vendors-title" id="proveedores-recientes">
      <CardHead id="adm-vendors-title" title={t('ops.vendorsTitle')} subtitle={t('ops.vendorsSubtitle')} />
      {!data.ok ? (
        <div style={{ padding: 16 }}><SectionError /></div>
      ) : data.data.length === 0 ? (
        <EmptyState title={t('ops.vendorsEmptyTitle')} body={t('ops.vendorsEmptyBody')} />
      ) : (
        <div className="adm-card-body-flush adm-table-wrap">
          <table className="adm-table" data-stack>
            <caption className="adm-vh">{t('ops.vendorsTitle')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('tableHeaderStore')}</th>
                <th scope="col">{t('tableHeaderProvince')}</th>
                <th scope="col" className="adm-num">{t('tableHeaderProducts')}</th>
                <th scope="col">{t('tableHeaderPlan')}</th>
                <th scope="col" className="adm-num">{t('tableHeaderSales')}</th>
                <th scope="col">{t('ops.colLevel')}</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map(v => (
                <tr key={v.id} data-vendor={v.id}>
                  <td data-label={t('tableHeaderStore')}>
                    <Link href={`/admin/proveedores?vendor=${v.id}`} className="adm-link" style={{ whiteSpace: 'normal' }}>{v.business_name}</Link>
                  </td>
                  <td data-label={t('tableHeaderProvince')}>{v.province_name ?? '—'}</td>
                  <td data-label={t('tableHeaderProducts')} className="adm-num">{v.product_count ?? '—'}</td>
                  <td data-label={t('tableHeaderPlan')} style={{ textTransform: 'capitalize' }}>{v.plan}</td>
                  <td data-label={t('tableHeaderSales')} className="adm-num">{v.real_total_sales ?? '—'}</td>
                  <td data-label={t('ops.colLevel')}>
                    <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <span className="adm-badge" data-tone={v.verification_level >= 2 ? 'green' : 'muted'}>
                        {levelLabel(v.verification_level)}
                      </span>
                      {!v.onboarding_completed && <span className="adm-badge" data-tone="amber">{t('ops.vendorsIncomplete')}</span>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="adm-card-foot">
        <span>{t('ops.vendorsFooter')}</span>
        <Link href="/admin/proveedores" className="adm-link">
          {t('ops.vendorsViewAll')}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
