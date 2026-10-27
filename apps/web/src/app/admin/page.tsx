// ============================================================
// MercadoRD — Centro de operaciones (/admin)
// Ruta: src/app/admin/page.tsx
// ============================================================
// Server Component. Primero comprueba la sesión y que el usuario sea admin (los
// que no lo son ven «Acceso restringido» y NO se lee ningún dato). Luego cada
// sección se envuelve en <Suspense>: se pinta en cuanto su consulta termina y
// muestra su propio marcador de carga mientras tanto.
//
// Todo se lee con la sesión del admin (RLS + is_admin() siguen siendo la
// barrera). `nowMs` se calcula UNA vez aquí y se pasa a las secciones: así
// todas calculan «hace cuánto» con el mismo instante y el texto del servidor y
// el del navegador coinciden (sin diferencias de hidratación).
// ============================================================

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { isCurrentUserAdmin } from '@/lib/queries/admin'
import { AdminShell } from '@/components/admin/AdminShell'
import { AdminPageHead } from '@/components/admin/AdminPageHead'
import { RestrictedAccess } from '@/components/admin/RestrictedAccess'
import { AttentionSkeleton, CardSkeleton, KpiSkeleton } from '@/components/admin/ops/OpsPrimitives'
import {
  AttentionSection,
  KpiSection,
  TasksSection,
  DisputesSection,
  ActivitySection,
  StatusSection,
  OrdersSection,
  PaymentsSection,
  CartsSection,
  VendorsSection,
} from '@/components/admin/ops/OpsSections'

export const metadata: Metadata = { title: 'Centro de operaciones | Mercado RD' }

export default async function AdminPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/admin')

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) return <RestrictedAccess />

  const nowMs = Date.now()

  return (
    <AdminShell>
      <div className="adm-page">
        <AdminPageHead titleKey="ops.pageTitle" subtitleKey="ops.pageSubtitle" />

        <Suspense fallback={<AttentionSkeleton />}>
          <AttentionSection nowMs={nowMs} />
        </Suspense>

        <Suspense fallback={<KpiSkeleton />}>
          <KpiSection nowMs={nowMs} />
        </Suspense>

        <div className="adm-cols">
          <div className="adm-col">
            <Suspense fallback={<CardSkeleton rows={5} />}>
              <TasksSection nowMs={nowMs} />
            </Suspense>
            <Suspense fallback={<CardSkeleton rows={5} />}>
              <OrdersSection />
            </Suspense>
            <Suspense fallback={<CardSkeleton rows={4} />}>
              <VendorsSection />
            </Suspense>
          </div>

          <div className="adm-col">
            <Suspense fallback={<CardSkeleton rows={3} />}>
              <DisputesSection nowMs={nowMs} />
            </Suspense>
            <Suspense fallback={<CardSkeleton rows={5} />}>
              <ActivitySection nowMs={nowMs} />
            </Suspense>
            <Suspense fallback={<CardSkeleton rows={3} />}>
              <StatusSection />
            </Suspense>
            <Suspense fallback={<CardSkeleton rows={3} />}>
              <PaymentsSection />
            </Suspense>
            <Suspense fallback={<CardSkeleton rows={2} />}>
              <CartsSection />
            </Suspense>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}
