// ============================================================
// MercadoRD — Administración de banners promocionales
// Ruta: src/app/admin/promociones/page.tsx
// ============================================================

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { isCurrentUserAdmin } from '@/lib/queries/admin'
import { PromoBannerManager } from '@/components/admin/PromoBannerManager'
import { BRAND } from '@/lib/colors'
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
    <div style={{ minHeight: '100vh', fontFamily: 'inherit', display: 'grid', gridTemplateColumns: '220px 1fr' }}>

      {/* Sidebar admin */}
      <div style={{ background: '#0a0a0a', padding: '24px 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #222', marginBottom: 16 }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontWeight: 900, fontSize: 18, color: '#fff', marginBottom: 4 }}>
              Mercado<span style={{ color: BRAND.red }}>RD</span>
            </div>
          </a>
          <div style={{ fontSize: 12, color: '#888' }}>🛡️ Panel de administración</div>
        </div>
        <a href="/admin" style={{ padding: '10px 20px', color: '#666', fontSize: 14, textDecoration: 'none' }}>
          📊 Resumen
        </a>
        <div style={{ padding: '10px 20px', color: '#fff', fontSize: 14, fontWeight: 600, background: 'rgba(255,255,255,0.08)', borderLeft: '2px solid #fff' }}>
          🖼️ Promociones
        </div>
        <a href="/dashboard" style={{ padding: '10px 20px', color: '#666', fontSize: 14, textDecoration: 'none' }}>
          ← Mi panel de vendedor
        </a>
      </div>

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
