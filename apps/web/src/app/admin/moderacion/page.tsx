// ============================================================
// MercadoRD — Moderación de contenido (admin)
// Ruta: src/app/admin/moderacion/page.tsx
// ============================================================
// content_flag_terms es editable libremente por admin. flagged_content
// se llena solo (trigger en Supabase al publicar un producto o enviar
// un mensaje de chat con algún término marcado) — nunca bloquea nada,
// solo queda pendiente de revisión acá. Mismo patrón que
// /admin/promociones: Server Component hace el fetch directo, un
// manager Client Component se encarga del CRUD.
// ============================================================

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { isCurrentUserAdmin, getContentFlagTerms, getUnreviewedFlaggedContent } from '@/lib/queries/admin'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { RestrictedAccess } from '@/components/admin/RestrictedAccess'
import { AdminModeracionContent } from './AdminModeracionContent'

export default async function AdminModeracionPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/admin/moderacion')

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) return <RestrictedAccess />

  const [terms, flags] = await Promise.all([
    getContentFlagTerms(),
    getUnreviewedFlaggedContent(),
  ])

  return (
    <div className="dashboard-grid" style={{ minHeight: '100vh', fontFamily: 'inherit' }}>
      <AdminSidebar />
      <AdminModeracionContent initialTerms={terms} initialFlags={flags} />
    </div>
  )
}
