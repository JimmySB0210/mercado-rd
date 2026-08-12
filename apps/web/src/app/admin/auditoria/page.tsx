// ============================================================
// MercadoRD — Bitácora de auditoría (admin)
// Ruta: src/app/admin/auditoria/page.tsx
// ============================================================
// Vista de solo lectura de audit_logs — sin ninguna acción de
// escritura. El texto traducido vive en AdminAuditoriaContent
// (Client Component).
// ============================================================

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { isCurrentUserAdmin, getAuditLogs, getDistinctAuditEventTypes } from '@/lib/queries/admin'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { RestrictedAccess } from '@/components/admin/RestrictedAccess'
import { AdminAuditoriaContent } from './AdminAuditoriaContent'

export default async function AdminAuditoriaPage(
  { searchParams }: { searchParams: Promise<{ eventType?: string; dateFrom?: string; dateTo?: string }> }
) {
  const { eventType, dateFrom, dateTo } = await searchParams

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/admin/auditoria')

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) return <RestrictedAccess />

  const [logs, eventTypes] = await Promise.all([
    getAuditLogs({ eventType, dateFrom, dateTo }),
    getDistinctAuditEventTypes(),
  ])

  return (
    <div className="dashboard-grid" style={{ minHeight: '100vh', fontFamily: 'inherit' }}>
      <AdminSidebar />
      <AdminAuditoriaContent logs={logs} eventTypes={eventTypes} />
    </div>
  )
}
