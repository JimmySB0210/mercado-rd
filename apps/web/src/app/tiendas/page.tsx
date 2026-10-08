// ============================================================
// MercadoRD — Directorio de tiendas
// Ruta: src/app/tiendas/page.tsx
// ============================================================
// Server Component — usa createPublicClient() (sin cookies) para
// que la página quede cacheable con ISR, igual que la homepage. El
// texto traducido vive en TiendasContent (Client Component).
// ============================================================

import { createPublicClient } from '@/lib/supabase/public'
import { getVendorRealStatsBatch } from '@/lib/queries/vendorRealStatsBatch'
import { Navbar } from '@/components/shop/Navbar'
import { TiendasContent } from './TiendasContent'

export const revalidate = 300

export default async function TiendasPage() {
  const supabase = createPublicClient()

  // Orden: verificadas primero, luego las más nuevas. Las ventas y la
  // calificación no se ordenan por columnas sembradas: se muestran
  // desde vendor_real_stats (ver abajo).
  // Solo tiendas con al menos un producto publicado (misma regla que
  // search_providers, migración 044). products!inner() vacío filtra sin
  // traer los productos ni repetir la tienda.
  const { data: vendors, error } = await supabase
    .from('vendors')
    .select('id, business_name, logo_url, description, province_id, is_verified, plan, provinces_rd(name), products!inner()')
    .eq('products.status', 'published')
    .order('is_verified', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) console.error('[TiendasPage]', error)

  const realStats = await getVendorRealStatsBatch((vendors ?? []).map(v => v.id))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <TiendasContent vendors={(vendors ?? []) as any} realStats={realStats} />
    </div>
  )
}
