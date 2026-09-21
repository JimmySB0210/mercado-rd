// ============================================================
// MercadoRD — Administración del Centro de ayuda
// Ruta: src/app/admin/centro-ayuda/page.tsx
// ============================================================
// help_articles: lectura pública solo de los publicados, escritura solo
// admin (RLS con is_admin()). Mismo patrón que /admin/promociones: un
// Server Component valida al admin y trae los datos, un manager Client
// Component hace el CRUD directo contra Supabase (la RLS es la barrera
// real; el isCurrentUserAdmin() de acá evita mostrar el panel a quien
// no puede usarlo).
// ============================================================

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { isCurrentUserAdmin, getAllHelpArticles } from '@/lib/queries/admin'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { RestrictedAccess } from '@/components/admin/RestrictedAccess'
import { HelpCenterPageHeader } from '@/components/admin/HelpCenterPageHeader'
import { HelpArticleManager } from '@/components/admin/HelpArticleManager'

export default async function AdminCentroAyudaPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/admin/centro-ayuda')

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) return <RestrictedAccess />

  const articles = await getAllHelpArticles()

  return (
    <div className="dashboard-grid" style={{ minHeight: '100vh', fontFamily: 'inherit' }}>

      <AdminSidebar />

      {/* Contenido */}
      <div style={{ padding: 28, background: '#f5f5f5' }}>
        <HelpCenterPageHeader />
        <HelpArticleManager initialArticles={articles} />
      </div>
    </div>
  )
}
