'use client'
// ============================================================
// MercadoRD — Indicadores principales
// Ruta: src/components/admin/ops/KpiCards.tsx
// ============================================================
// Cada cifra dice de dónde sale y qué incluye:
//   · Ventas brutas = pedidos confirmados, en preparación, enviados y entregados.
//     NO incluye pendientes ni cancelados y NO es ingreso de Mercado RD (no hay
//     comisiones registradas en la base).
//   · Pedidos creados = todos los pedidos; completados = estado «delivered».
//   · Productos publicados = estado «published». Usuarios = cuentas no eliminadas.
// Período: por ahora «todo el tiempo» (más «este mes» en ventas). El selector de
// período y las comparaciones con el período anterior llegan en el siguiente lote;
// no se muestra ninguna comparación porque todavía no hay una base válida.
// Si una consulta falla, la tarjeta dice «No disponible» (nunca 0).
// ============================================================

import { AlertTriangle, Banknote, Info, Package, PackageCheck, ShoppingCart, Store, Users, type LucideIcon } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { KpiData } from '@/lib/queries/adminOps'
import { formatClock, formatRdp } from '@/lib/admin/ops'
import { SectionError } from './OpsPrimitives'

type Tone = 'amber' | 'red' | 'green' | 'blue' | 'muted'

interface Kpi {
  key: string
  icon: LucideIcon
  tone: Tone
  label: string
  value?: string
  sub?: string
}

export function KpiCards({ data }: { data: KpiData }) {
  const { t } = useTranslation('admin')
  const unavailable = t('ops.unavailable')

  const kpis: Kpi[] = []

  if (data.orders.ok) {
    const o = data.orders.data
    kpis.push({
      key: 'sales', icon: Banknote, tone: 'green', label: t('ops.kpiSalesLabel'), value: formatRdp(o.salesAll),
      sub: t('ops.kpiSalesSub', { amount: formatRdp(o.salesMonth), count: o.salesMonthCount }),
    })
    kpis.push({
      key: 'orders', icon: ShoppingCart, tone: 'blue', label: t('ops.kpiOrdersLabel'), value: String(o.total),
      sub: t('ops.kpiOrdersSub', { pending: o.pending, cancelled: o.cancelled }),
    })
    kpis.push({
      key: 'delivered', icon: PackageCheck, tone: 'green', label: t('ops.kpiDeliveredLabel'), value: String(o.delivered),
      sub: t('ops.kpiDeliveredSub', { total: o.total }),
    })
  } else {
    kpis.push({ key: 'sales', icon: Banknote, tone: 'red', label: t('ops.kpiSalesLabel') })
    kpis.push({ key: 'orders', icon: ShoppingCart, tone: 'red', label: t('ops.kpiOrdersLabel') })
    kpis.push({ key: 'delivered', icon: PackageCheck, tone: 'red', label: t('ops.kpiDeliveredLabel') })
  }

  if (data.vendors.ok) {
    const v = data.vendors.data
    kpis.push({
      key: 'vendors', icon: Store, tone: 'amber', label: t('ops.kpiVendorsLabel'), value: String(v.total),
      sub: t('ops.kpiVendorsSub', { complete: v.onboardingComplete, verified: v.level2Plus }),
    })
  } else kpis.push({ key: 'vendors', icon: Store, tone: 'red', label: t('ops.kpiVendorsLabel') })

  if (data.products.ok) {
    const p = data.products.data
    kpis.push({
      key: 'products', icon: Package, tone: 'blue', label: t('ops.kpiProductsLabel'), value: String(p.published),
      sub: t('ops.kpiProductsSub', { total: p.total }),
    })
  } else kpis.push({ key: 'products', icon: Package, tone: 'red', label: t('ops.kpiProductsLabel') })

  if (data.users.ok) {
    kpis.push({
      key: 'users', icon: Users, tone: 'blue', label: t('ops.kpiUsersLabel'), value: String(data.users.data.active),
      sub: t('ops.kpiUsersSub'),
    })
  } else kpis.push({ key: 'users', icon: Users, tone: 'red', label: t('ops.kpiUsersLabel') })

  const anyError = !data.orders.ok || !data.vendors.ok || !data.products.ok || !data.users.ok
  const partial = data.orders.ok && !data.orders.data.salesComplete ? data.orders.data : null

  return (
    <section aria-labelledby="adm-kpi-title" style={{ display: 'grid', gap: 12 }}>
      <div className="adm-kpi-head">
        <h2 className="adm-card-title" id="adm-kpi-title">{t('ops.kpiTitle')}</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className="adm-chip">{t('ops.kpiPeriod')}</span>
          <span className="adm-chip">{t('ops.kpiUpdated', { time: formatClock(data.generatedAt) })}</span>
        </div>
      </div>

      {anyError && <SectionError compact />}

      <div className="adm-kpi-grid">
        {kpis.map(k => {
          const Icon = k.icon
          return (
            <article key={k.key} className="adm-card adm-kpi" data-tone={k.tone} data-kpi={k.key}>
              <div className="adm-kpi-top">
                <span className="adm-kpi-ic" aria-hidden="true"><Icon size={16} /></span>
                <span>{k.label}</span>
              </div>
              {k.value !== undefined ? (
                <>
                  <div className="adm-kpi-val">{k.value}</div>
                  {k.sub && <div className="adm-kpi-sub">{k.sub}</div>}
                </>
              ) : (
                <div className="adm-kpi-err"><AlertTriangle size={16} aria-hidden="true" />{unavailable}</div>
              )}
            </article>
          )
        })}
      </div>

      {data.orders.ok && (
        <p className="adm-card-sub" style={{ margin: 0 }} data-note="sales-definition">
          <Info size={12} aria-hidden="true" style={{ verticalAlign: '-2px', marginRight: 4 }} />
          {t('ops.kpiSalesNote')}
        </p>
      )}

      {partial && (
        <div className="adm-note" data-tone="amber" role="note">
          <Info size={14} aria-hidden="true" />
          <span>{t('ops.kpiPartial', { read: partial.salesCount, total: partial.salesTotalExpected })}</span>
        </div>
      )}
    </section>
  )
}
