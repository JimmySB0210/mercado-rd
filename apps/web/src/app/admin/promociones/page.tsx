// ============================================================
// MercadoRD — Administración de banners promocionales
// Ruta: src/app/admin/promociones/page.tsx
// ============================================================

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { isCurrentUserAdmin } from '@/lib/queries/admin'
import { PromoBannerManager } from '@/components/admin/PromoBannerManager'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import type { PromoBanner } from '@/types/database.types'

export default async function AdminPromocionesPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/admin/promociones')

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Acceso restringido</h1>
          <p className="text-gray-500 text-sm mb-6">
            Esta sección es solo para administradores de MercadoRD.
          </p>
          <a href="/" className="text-blue-600 underline text-sm">Volver al inicio</a>
        </div>
      </div>
    )
  }

  const { data: banners, error } = await supabase
    .from('promo_banners')
    .select('*')
    .order('sort_order')

  if (error) console.error('[AdminPromocionesPage]', error)

  const bannerList = (banners ?? []) as PromoBanner[]

  return (
    <div className="dashboard-grid" style={{ minHeight: '100vh', fontFamily: 'inherit' }}>

      <AdminSidebar />

      {/* Contenido */}
      <div style={{ padding: 28, background: '#f5f5f5' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Banners promocionales</h1>
          <p style={{ color: '#666', fontSize: 14 }}>
            Diapositivas del carrusel en el home, después de la de marca de MercadoRD
          </p>
        </div>

        <PromoBannerManager initialBanners={bannerList} />
      </div>
    </div>
  )
}
