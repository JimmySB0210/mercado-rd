// ============================================================
// MercadoRD — Gestión de verificación de vendors (admin)
// Ruta: src/app/admin/proveedores/page.tsx
// ============================================================
// Página dedicada, separada de la tabla básica del dashboard general
// (/admin). Lista filtrable + panel de detalle con toda la info del
// wizard de registro + control de nivel de verificación (1-4). El
// texto traducido vive en AdminProveedoresContent (Client Component).
//
// ?estado= (lo usa «Requiere tu atención» y «Tareas pendientes» del Centro
// de operaciones): por_revisar = registro completo y todavía en nivel 1;
// registro_incompleto = no terminó el onboarding. Cualquier otro valor se
// ignora. Es la MISMA regla que cuenta el panel, así que lista y contador
// coinciden.
// ============================================================

import { redirect } from 'next/navigation'
import { isCurrentUserAdmin, getAllVendorsForVerification, getVendorDetailForAdmin } from '@/lib/queries/admin'
import { AdminShell } from '@/components/admin/AdminShell'
import { parseVendorStateFilter } from '@/lib/admin/ops'
import { AdminProveedoresContent } from './AdminProveedoresContent'

export default async function AdminProveedoresPage(
  { searchParams }: { searchParams: Promise<{ vendor?: string; level?: string; businessType?: string; estado?: string }> }
) {
  const { vendor: vendorId, level: levelFilter, businessType: businessTypeFilter, estado } = await searchParams
  const estadoFilter = parseVendorStateFilter(estado)

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) redirect('/admin')

  const [allVendors, selectedVendor] = await Promise.all([
    getAllVendorsForVerification(),
    vendorId ? getVendorDetailForAdmin(vendorId) : Promise.resolve(null),
  ])

  const vendors = allVendors.filter(v => {
    if (levelFilter && String(v.verification_level) !== levelFilter) return false
    if (businessTypeFilter && !v.business_types.includes(businessTypeFilter as any)) return false
    if (estadoFilter === 'por_revisar' && !(v.onboarding_completed && v.verification_level === 1)) return false
    if (estadoFilter === 'registro_incompleto' && v.onboarding_completed) return false
    return true
  })

  return (
    <AdminShell>
      <AdminProveedoresContent
        vendors={vendors}
        selectedVendor={selectedVendor}
        selectedVendorId={vendorId}
        levelFilter={levelFilter}
        businessTypeFilter={businessTypeFilter}
        estadoFilter={estadoFilter}
      />
    </AdminShell>
  )
}
