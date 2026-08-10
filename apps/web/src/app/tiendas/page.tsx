// ============================================================
// MercadoRD — Directorio de tiendas
// Ruta: src/app/tiendas/page.tsx
// ============================================================
// Server Component — usa createPublicClient() (sin cookies) para
// que la página quede cacheable con ISR, igual que la homepage. El
// texto traducido vive en TiendasContent (Client Component).
// ============================================================

import { createPublicClient } from '@/lib/supabase/public'
import { Navbar } from '@/components/shop/Navbar'
import { TiendasContent } from './TiendasContent'

export const revalidate = 300

export default async function TiendasPage() {
  const supabase = createPublicClient()

  const { data: vendors, error } = await supabase
    .from('vendors')
    .select('id, business_name, logo_url, description, province_id, is_verified, plan, rating_avg, total_sales, provinces_rd(name)')
    .order('is_verified', { ascending: false })
    .order('total_sales', { ascending: false })

  if (error) console.error('[TiendasPage]', error)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <TiendasContent vendors={(vendors ?? []) as any} />
    </div>
  )
}
