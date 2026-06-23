'use client'
// ============================================================
// MercadoRD — Carga diferida de RevenueChart (recharts)
// Ruta: src/components/vendor/RevenueChartLoader.tsx
// ============================================================
// next/dynamic con ssr:false no se puede usar directo en un
// Server Component — por eso este wrapper, que sí es Client
// Component, hace el lazy-load y dashboard/page.tsx solo lo
// renderiza normalmente.
// ============================================================

import dynamic from 'next/dynamic'

const RevenueChart = dynamic(
  () => import('./RevenueChart').then(m => m.RevenueChart),
  {
    ssr: false,
    loading: () => <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />,
  }
)

interface Props {
  data: { month: string; revenue: number }[]
}

export function RevenueChartLoader({ data }: Props) {
  return <RevenueChart data={data} />
}
