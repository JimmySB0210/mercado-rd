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

  const { data: settingRows } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['show_brand_banner', 'brand_banner_image_url', 'brand_banner_mobile_image_url'])

  const settings = new Map((settingRows ?? []).map(row => [row.key, row.value]))
  const showBrandBanner = (settings.get('show_brand_banner') as boolean | undefined) ?? true
  const brandDesktopImageUrl = (settings.get('brand_banner_image_url') as string | null | undefined) ?? null
  const brandMobileImageUrl = (settings.get('brand_banner_mobile_image_url') as string | null | undefined) ?? null
  const bannerList = (banners ?? []) as PromoBanner[]

  return (
    <div className="dashboard-grid" style={{ minHeight: '100vh', fontFamily: 'inherit' }}>

      <AdminSidebar />

      {/* Contenido */}
      <div style={{ padding: 28, background: '#f5f5f5' }}>
        <PromoBannerPageHeader />
        <BrandBannerToggle
          initialValue={showBrandBanner}
          initialDesktopImageUrl={brandDesktopImageUrl}
          initialMobileImageUrl={brandMobileImageUrl}
        />
        <PromoBannerManager initialBanners={bannerList} />
      </div>
    </div>
  )
}
