// ============================================================
// MercadoRD — "También te puede interesar"
// Ruta: src/components/shop/RelatedProducts.tsx
// ============================================================
// Server Component — dos queries en paralelo (misma categoría +
// mismo vendor), deduplicadas por id, máximo 4 productos.
// ============================================================

import { createPublicClient } from '@/lib/supabase/public'
import { RelatedProductsSection } from '@/components/shop/RelatedProductsSection'

interface Props {
  categoryId: number | null
  vendorId: string
  currentProductId: string
}

const SELECT = `
  id, vendor_id, category_id, province_id, name, description,
  price_rdp, compare_rdp, images, stock, sizes, colors, is_active,
  rating_avg, rating_count, sold_count, view_count, created_at,
  vendor:vendors(id, business_name, logo_url, is_verified, rating_avg, whatsapp)
`

export async function RelatedProducts({ categoryId, vendorId, currentProductId }: Props) {
  const supabase = createPublicClient()

  const [byCategory, byVendor] = await Promise.all([
    categoryId
      ? supabase
          .from('products')
          .select(SELECT)
          .eq('category_id', categoryId)
          .eq('is_active', true)
          .neq('id', currentProductId)
          .limit(4)
      : Promise.resolve({ data: [] as any[] }),
    supabase
      .from('products')
      .select(SELECT)
      .eq('vendor_id', vendorId)
      .eq('is_active', true)
      .neq('id', currentProductId)
      .limit(4),
  ])

  const combined = [...(byCategory.data ?? []), ...(byVendor.data ?? [])]
  const seen = new Set<string>()
  const deduped = combined
    .filter(p => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })
    .slice(0, 4)

  if (deduped.length === 0) return null

  return <RelatedProductsSection products={deduped as any} />
}
