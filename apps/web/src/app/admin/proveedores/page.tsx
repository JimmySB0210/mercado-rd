// ============================================================
// MercadoRD — Gestión de verificación de vendors (admin)
// Ruta: src/app/admin/proveedores/page.tsx
// ============================================================
// Página dedicada, separada de la tabla básica del dashboard general
// (/admin). Lista filtrable + panel de detalle con toda la info del
// wizard de registro + control de nivel de verificación (1-4). El
// texto traducido vive en AdminProveedoresContent (Client Component).
// ============================================================

import { redirect } from 'next/navigation'
import { isCurrentUserAdmin, getAllVendorsForVerification, getVendorDetailForAdmin } from '@/lib/queries/admin'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminProveedoresContent } from './AdminProveedoresContent'

export default async function AdminProveedoresPage(
  { searchParams }: { searchParams: Promise<{ vendor?: string; level?: string; businessType?: string }> }
) {
  const { vendor: vendorId, level: levelFilter, businessType: businessTypeFilter } = await searchParams

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) redirect('/admin')

  const [allVendors, selectedVendor] = await Promise.all([
    getAllVendorsForVerification(),
    vendorId ? getVendorDetailForAdmin(vendorId) : Promise.resolve(null),
  ])

  const vendors = allVendors.filter(v => {
    if (levelFilter && String(v.verification_level) !== levelFilter) return false
    if (businessTypeFilter && !v.business_types.includes(businessTypeFilter as any)) return false
    return true
  })

  return (
    <div className="dashboard-grid" style={{ minHeight: '100vh' }}>
      <AdminSidebar />
      <AdminProveedoresContent
        vendors={vendors}
        selectedVendor={selectedVendor}
        selectedVendorId={vendorId}
        levelFilter={levelFilter}
        businessTypeFilter={businessTypeFilter}
      />
    </div>
  )
}
