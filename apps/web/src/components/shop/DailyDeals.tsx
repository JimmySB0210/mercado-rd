// ============================================================
// MercadoRD — Ofertas del día (homepage)
// Ruta: src/components/shop/DailyDeals.tsx
// ============================================================
// Nueva — última pieza del rediseño. Llama a get_daily_deals(8) (ya
// ordena por % de descuento real, empate por plan del vendor) y trae
// los datos completos de cada producto por product_id. Si no hay
// ninguna oferta activa, no renderiza nada — sin estado vacío
// decorativo ni "próximamente".
// ============================================================

import { createPublicClient } from '@/lib/supabase/public'
import { DailyDealsGrid, type DealViewModel } from '@/components/shop/DailyDealsGrid'

export async function DailyDeals() {
  const supabase = createPublicClient()

  const { data: deals, error } = await supabase.rpc('get_daily_deals', { p_limit: 8 })
  if (error) console.error('[DailyDeals]', error)
  if (!deals || deals.length === 0) return null

  const productIds = deals.map((d: any) => d.product_id)
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, images, vendors(business_name)')
    .in('id', productIds)

  if (productsError) console.error('[DailyDeals] products', productsError)

  const productById = new Map((products ?? []).map((p: any) => [p.id, p]))

  const viewModels: DealViewModel[] = deals
    .map((d: any) => {
      const product = productById.get(d.product_id)
      if (!product) return null
      return {
        dealId: d.deal_id,
        productId: d.product_id,
        productName: product.name,
        productImage: product.images?.[0] ?? null,
        vendorName: product.vendors?.business_name ?? null,
        dealPriceRdp: d.deal_price_rdp,
        originalPriceRdp: d.original_price_rdp,
        discountPercent: Number(d.discount_percent),
        expiresAt: d.expires_at,
      }
    })
    .filter((v: DealViewModel | null): v is DealViewModel => v !== null)

  if (viewModels.length === 0) return null

  return <DailyDealsGrid deals={viewModels} />
}
