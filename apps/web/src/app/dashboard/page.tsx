// ============================================================
// MercadoRD — Dashboard del vendor
// Ruta: src/app/dashboard/page.tsx
// ============================================================
// Server Component — el texto traducido vive en DashboardContent
// (Client Component).
// ============================================================

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import {
  getCurrentVendor, getVendorOrders, getVendorKPIs, getVendorMonthlyRevenue,
  getVendorProducts, getVendorRealStats, getVendorCompletenessFlags, getVendorUnreadMessagesCount,
} from '@/lib/queries/vendor-dashboard'
import { computeVendorCompleteness } from '@/lib/vendorCompleteness'
import { isStockAlert } from '@/lib/productStock'
import { DashboardSidebar } from '@/components/vendor/DashboardSidebar'
import { DashboardContent, NoStoreNotice } from './DashboardContent'

// Pedidos que todavía no se despacharon -- "necesita tu atención".
const UNSHIPPED_STATUSES = new Set(['pending', 'confirmed', 'preparing'])

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

  const [allOrders, kpis, monthlyRevenue, products, realStats, completenessFlags, unreadMessages] = await Promise.all([
    getVendorOrders(vendor.id),
    getVendorKPIs(vendor.id),
    getVendorMonthlyRevenue(vendor.id),
    getVendorProducts(vendor.id),
    getVendorRealStats(vendor.id),
    getVendorCompletenessFlags(vendor.id, user.id),
    getVendorUnreadMessagesCount(vendor.id),
  ])

  // Solo los 5 más recientes en el resumen — el resto vive en /dashboard/pedidos
  const orders = allOrders.slice(0, 5)
  const firstName = vendor.business_name.split(' ')[0]

  const lowStockProducts = products.filter((p: any) => isStockAlert(p))
  const pendingShipmentCount = allOrders.filter(o => UNSHIPPED_STATUSES.has(o.status)).length

  // Top vendidos — solo si hay al menos un producto con ventas reales.
  // Nunca un ranking de productos con sold_count = 0 (eso no es un
  // ranking, es una lista cualquiera disfrazada de uno).
  const topSelling = [...products]
    .filter((p: any) => (p.sold_count ?? 0) > 0)
    .sort((a: any, b: any) => (b.sold_count ?? 0) - (a.sold_count ?? 0))
    .slice(0, 3)

  const completeness = computeVendorCompleteness(vendor, completenessFlags)

  return (
    <div className="dashboard-grid" style={{ minHeight: '100vh', fontFamily: 'inherit' }}>
      <DashboardSidebar />
      <DashboardContent
        firstName={firstName}
        vendor={{
          businessName: vendor.business_name,
          logoUrl: vendor.logo_url,
          isVerified: vendor.is_verified,
          provinceName: (vendor.province as any)?.name ?? null,
          id: vendor.id,
        }}
        realStats={realStats}
        completeness={completeness}
        kpis={kpis}
        productStats={{ total: products.length, lowStock: lowStockProducts.length }}
        monthlyRevenue={monthlyRevenue}
        allOrdersCount={allOrders.length}
        orders={orders as any}
        pendingShipmentCount={pendingShipmentCount}
        lowStockCount={lowStockProducts.length}
        unreadMessagesCount={unreadMessages}
        recentProducts={products.slice(0, 4) as any}
        topSelling={topSelling as any}
      />
    </div>
  )
}
