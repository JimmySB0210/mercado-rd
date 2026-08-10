// ============================================================
// MercadoRD — Panel de administración
// Ruta: src/app/admin/page.tsx
// ============================================================
// Server Component — el texto traducido vive en AdminDashboardContent
// (Client Component). El estado de "Acceso restringido" usa
// RestrictedAccess (Client Component) por el mismo motivo.
// ============================================================

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { isCurrentUserAdmin, getMarketplaceKPIs, getAllVendors, getRecentOrders, getPaymentMetrics, getOpenDisputes, getAbandonedCarts } from '@/lib/queries/admin'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { RestrictedAccess } from '@/components/admin/RestrictedAccess'
import { AdminDashboardContent } from './AdminDashboardContent'

export default async function AdminPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/admin')

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) return <RestrictedAccess />

  const [kpis, vendors, orders, paymentMetrics, openDisputes, abandonedCarts] = await Promise.all([
    getMarketplaceKPIs(),
    getAllVendors(),
    getRecentOrders(15),
    getPaymentMetrics(),
    getOpenDisputes(),
    getAbandonedCarts(),
  ])

  return (
    <div className="dashboard-grid" style={{ minHeight: '100vh', fontFamily: 'inherit' }}>
      <AdminSidebar />
      <AdminDashboardContent
        kpis={kpis}
        vendors={vendors}
        orders={orders}
        paymentMetrics={paymentMetrics}
        openDisputes={openDisputes}
        abandonedCarts={abandonedCarts}
      />
    </div>
  )
}
