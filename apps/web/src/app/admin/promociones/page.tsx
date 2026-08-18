// ============================================================
// MercadoRD — Administración de banners promocionales
// Ruta: src/app/admin/promociones/page.tsx
// ============================================================

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { isCurrentUserAdmin } from '@/lib/queries/admin'
import { PromoBannerManager } from '@/components/admin/PromoBannerManager'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { RestrictedAccess } from '@/components/admin/RestrictedAccess'
import { PromoBannerPageHeader } from '@/components/admin/PromoBannerPageHeader'
import { BrandBannerToggle } from '@/components/admin/BrandBannerToggle'
import type { PromoBanner } from '@/types/database.types'

export default async function AdminPromocionesPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/admin/promociones')

  const isAdmin = await isCurrentUserAdmin()
  if (!isAdmin) return <RestrictedAccess />

  const { data: banners, error } = await supabase
    .from('promo_banners')
    .select('*')
    .order('sort_order')

  if (error) console.error('[AdminPromocionesPage]', error)

  const { data: settingRow } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'show_brand_banner')
    .maybeSingle()

  const showBrandBanner = (settingRow?.value as boolean | undefined) ?? true
  const bannerList = (banners ?? []) as PromoBanner[]

  return (
    <div className="dashboard-grid" style={{ minHeight: '100vh', fontFamily: 'inherit' }}>

      <AdminSidebar />

      {/* Contenido */}
      <div style={{ padding: 28, background: '#f5f5f5' }}>
        <PromoBannerPageHeader />
        <BrandBannerToggle initialValue={showBrandBanner} />
        <PromoBannerManager initialBanners={bannerList} />
      </div>
    </div>
  )
}
