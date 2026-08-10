// ============================================================
// MercadoRD — Dashboard del vendor
// Ruta: src/app/dashboard/page.tsx
// ============================================================
// Server Component — el texto traducido vive en DashboardContent
// (Client Component).
// ============================================================

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentVendor, getVendorOrders, getVendorKPIs, getVendorMonthlyRevenue } from '@/lib/queries/vendor-dashboard'
import { DashboardSidebar } from '@/components/vendor/DashboardSidebar'
import { DashboardContent, NoStoreNotice } from './DashboardContent'

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/dashboard')

  const vendor = await getCurrentVendor()

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <NoStoreNotice />
      </div>
    )
  }

  const [allOrders, kpis, monthlyRevenue] = await Promise.all([
    getVendorOrders(vendor.id),
    getVendorKPIs(vendor.id),
    getVendorMonthlyRevenue(vendor.id),
  ])

  // Solo los 5 más recientes en el resumen — el resto vive en /dashboard/pedidos
  const orders = allOrders.slice(0, 5)
  const firstName = vendor.business_name.split(' ')[0]

  return (
    <div className="dashboard-grid" style={{ minHeight: '100vh', fontFamily: 'inherit' }}>
      <DashboardSidebar />
      <DashboardContent
        firstName={firstName}
        kpis={kpis}
        monthlyRevenue={monthlyRevenue}
        allOrdersCount={allOrders.length}
        orders={orders as any}
      />
    </div>
  )
}
