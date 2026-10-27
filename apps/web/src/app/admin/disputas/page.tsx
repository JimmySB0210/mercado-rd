// ============================================================
// MercadoRD — Disputas (/admin/disputas)
// Ruta: src/app/admin/disputas/page.tsx
// ============================================================
// Lista las disputas REALES (tabla disputes) con filtro por estado y
// paginación. Cada fila es el mismo DisputeAdminRow que ya usaba el panel
// (cambiar estado, nota de resolución, evidencia y mensajes), así que aquí no
// hay ninguna acción nueva ni se toca ninguna política: el cambio de estado
// sigue pasando por la política RLS disputes_admin_update.
//
// Parámetros de la URL (todos validados antes de llegar a la consulta):
//   estado  = pendientes | abiertas | en_revision | resueltas | cerradas | todas
//   pagina  = número entero ≥ 1
//   caso    = UUID de una disputa concreta (enlace desde «Tareas pendientes»)
// ============================================================

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { isCurrentUserAdmin } from '@/lib/queries/admin'
import { getDisputeCounts, getDisputesPage } from '@/lib/queries/adminOps'
import { disputesHref, parseDisputeFilter } from '@/lib/admin/ops'
import { AdminShell } from '@/components/admin/AdminShell'
import { RestrictedAccess } from '@/components/admin/RestrictedAccess'
import { AdminDisputasContent } from './AdminDisputasContent'

export const metadata: Metadata = { title: 'Disputas | Mercado RD' }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface PageProps {
  searchParams: { estado?: string; pagina?: string; caso?: string }
}

export default async function AdminDisputasPage({ searchParams }: PageProps) {
  const filter = parseDisputeFilter(searchParams.estado)
  const requestedPage = Number.parseInt(searchParams.pagina ?? '1', 10)
  const page = Number.isFinite(requestedPage) && requestedPage >= 1 ? requestedPage : 1
  const caseId = searchParams.caso && UUID_RE.test(searchParams.caso) ? searchParams.caso.toLowerCase() : undefined

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  // Solo se reenvían valores ya validados (filtro de la lista blanca, número, UUID).
  if (!user) redirect(`/login?redirect=${encodeURIComponent(disputesHref({ filter, page, caseId }))}`)

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) return <RestrictedAccess />

  const nowMs = Date.now()
  const [list, counts] = await Promise.all([getDisputesPage({ filter, page, caseId }), getDisputeCounts()])

  // Una página fuera de rango (por ejemplo ?pagina=99) vuelve a la última que existe.
  if (list.ok && !caseId && list.data.rows.length === 0 && list.data.total > 0 && page > list.data.pageCount) {
    redirect(disputesHref({ filter, page: list.data.pageCount }))
  }

  return (
    <AdminShell>
      <AdminDisputasContent list={list} counts={counts} filter={filter} caseId={caseId} nowMs={nowMs} />
    </AdminShell>
  )
}
