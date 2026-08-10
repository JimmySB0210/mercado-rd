// ============================================================
// MercadoRD — Mis Productos (vendor dashboard)
// Ruta: src/app/dashboard/productos/page.tsx
// ============================================================
// Server Component — el texto traducido vive en ProductosContent
// (Client Component).
// ============================================================

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentVendor, getVendorProducts } from '@/lib/queries/vendor-dashboard'
import { DashboardSidebar } from '@/components/vendor/DashboardSidebar'
import { ProductosContent } from './ProductosContent'

export default async function VendorProductsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/dashboard/productos')

  const vendor = await getCurrentVendor()
  if (!vendor) redirect('/vendor/register')

  const products = await getVendorProducts(vendor.id)

  return (
    <div className="dashboard-grid" style={{ minHeight: '100vh', fontFamily: 'inherit' }}>
      <DashboardSidebar />
      <ProductosContent products={products as any} isPro={vendor.plan === 'pro'} />
    </div>
  )
}
