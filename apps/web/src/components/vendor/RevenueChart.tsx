'use client'
// ============================================================
// MercadoRD — Gráfica de ingresos (vendor dashboard)
// Ruta: src/components/vendor/RevenueChart.tsx
// ============================================================
// recharts necesita el navegador (ResizeObserver, mediciones de
// SVG) — por eso vive en un Client Component aparte, alimentado
// con datos ya calculados en el Server Component del dashboard.
// ============================================================

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatPrice } from '@/types/database.types'
import { useTranslation } from '@/lib/hooks/useTranslation'

interface Props {
  data: { month: string; revenue: number }[]
}

export function RevenueChart({ data }: Props) {
  const { t } = useTranslation('dashboard')
  const hasRevenue = data.some(p => p.revenue > 0)

  if (!hasRevenue) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
        <p style={{ color: '#999', fontSize: 14 }}>{t('noRevenueYet')}</p>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: 260, padding: '12px 8px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#999' }}
            axisLine={{ stroke: '#eee' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => formatPrice(v)}
            tick={{ fontSize: 11, fill: '#999' }}
            axisLine={false}
            tickLine={false}
            width={72}
          />
          <Tooltip
            formatter={(value) => [formatPrice(Number(value)), t('revenueTooltipLabel')]}
            labelStyle={{ color: '#111', fontWeight: 700 }}
            contentStyle={{ borderRadius: 8, border: '1px solid #eee', fontSize: 13 }}
          />
          <Bar dataKey="revenue" fill="#0D47A1" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
