// ============================================================
// MercadoRD — Regla de envío gratis (fuente única de verdad)
// Ruta: src/lib/shipping.ts
// ============================================================
// Lo que se cobra lo calcula el servidor: create_order_from_cart, y para
// mostrarlo antes de pagar, quote_cart (lib/cart/quote.ts), que usan la
// misma regla. Precio unitario: tramo por cantidad (product_pricing_tiers)
// > precio de la variante > precio base. El envío es gratis cuando el
// subtotal (antes del ITBIS y del cupón) llega al umbral, evaluado sobre
// el pedido completo (todos los vendedores juntos), no por vendedor.
//
// Lo de aquí son estimaciones locales para la página de producto, las
// tarjetas y FreeShippingBadge; carrito y checkout usan quote_cart. El
// umbral se lee de aquí, nunca se redeclara.
// ============================================================

export const FREE_SHIPPING_THRESHOLD_RDP = 250000 // RD$2,500

export function qualifiesForFreeShipping(subtotalRdp: number): boolean {
  return subtotalRdp >= FREE_SHIPPING_THRESHOLD_RDP
}

export function amountUntilFreeShippingRdp(subtotalRdp: number): number {
  return Math.max(0, FREE_SHIPPING_THRESHOLD_RDP - subtotalRdp)
}

export interface PricingTierLike {
  min_quantity: number
  max_quantity: number | null
  price_rdp: number
}

// Misma regla que el servidor: el tramo más específico cuyo rango incluye
// la cantidad (ORDER BY min_quantity DESC LIMIT 1); si ninguno aplica, el
// precio de la variante; si no hay variante con precio, el precio base.
export function resolveEffectiveUnitPriceRdp(
  basePriceRdp: number,
  tiers: PricingTierLike[],
  quantity: number,
  variantPriceRdp?: number | null
): number {
  const qualifying = tiers
    .filter(t => t.min_quantity <= quantity && (t.max_quantity === null || t.max_quantity >= quantity))
    .sort((a, b) => b.min_quantity - a.min_quantity)
  return qualifying[0]?.price_rdp ?? variantPriceRdp ?? basePriceRdp
}
