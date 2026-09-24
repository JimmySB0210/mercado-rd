// ============================================================
// MercadoRD — "Productos de este vendedor" (página de producto)
// Ruta: src/components/shop/VendorProductsCarousel.tsx
// ============================================================
// Server Component — separado de RelatedProducts.tsx (que antes hacía
// esta misma consulta "byVendor" y la mezclaba/deduplicaba con la de
// categoría en un solo grid). Mismo SELECT, misma fuente real de
// datos, ahora en su propia sección con el estilo de carrusel de
// FeaturedProductsGrid.tsx en vez del grid fijo anterior.
// ============================================================

import { createPublicClient } from '@/lib/supabase/public'
import { VendorProductsCarouselSection } from '@/components/shop/VendorProductsCarouselSection'

interface Props {
  vendorId: string
  currentProductId: string
}

const SELECT = `
  id, vendor_id, category_id, province_id, name, description,
  price_rdp, compare_rdp, images, stock, sizes, colors, is_active,
  rating_avg, rating_count, sold_count, view_count, created_at,
  vendor:vendors(id, business_name, logo_url, is_verified, rating_avg, whatsapp)
`

export async function VendorProductsCarousel({ vendorId, currentProductId }: Props) {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('products')
    .select(SELECT)
    .eq('vendor_id', vendorId)
    .eq('is_active', true)
    .neq('id', currentProductId)
    .limit(8)

  if (!data || data.length === 0) return null

  return <VendorProductsCarouselSection products={data as any} />
}
