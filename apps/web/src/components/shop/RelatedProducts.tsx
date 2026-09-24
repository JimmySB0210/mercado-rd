// ============================================================
// MercadoRD — "También te puede interesar"
// Ruta: src/components/shop/RelatedProducts.tsx
// ============================================================
// Server Component — misma categoría, EXCLUYE el vendedor actual (sus
// productos ya tienen su propia sección, ver VendorProductsCarousel.tsx
// — antes esta consulta los incluía y se deduplicaba contra "byVendor"
// en un solo grid; separarlas evita mostrar el mismo producto dos veces
// en la página). Límite subido de 4 a 8 — con el carrusel horizontal
// nuevo (antes era un grid fijo), 4 apenas llenaba una fila sin dejar
// nada que desplazar.
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
  if (!categoryId) return null

  const supabase = createPublicClient()
  const { data } = await supabase
    .from('products')
    .select(SELECT)
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .neq('id', currentProductId)
    .neq('vendor_id', vendorId)
    .limit(8)

  if (!data || data.length === 0) return null

  return <RelatedProductsSection products={data as any} />
}
