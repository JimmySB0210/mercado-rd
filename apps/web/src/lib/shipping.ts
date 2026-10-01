// ============================================================
// MercadoRD — Regla de envío gratis (fuente única de verdad)
// Ruta: src/lib/shipping.ts
// ============================================================
// Replica EXACTA de create_order_from_cart (migración 015, la única
// función real que cobra un pedido) — no se puede "ajustar" este umbral
// ni esta forma de calcular el subtotal sin desincronizarse del backend:
//
//   SELECT price_rdp INTO v_delivery FROM shipping_rates WHERE ...
//   IF v_subtotal >= 250000 THEN v_delivery := 0; END IF;
//
// donde v_subtotal ya viene calculado ANTES del ITBIS (v_itbis se saca
// después) y CON el precio de tramo (product_pricing_tiers) cuando la
// cantidad pedida califica para uno — nunca el precio base si hay un
// tramo aplicable. El umbral se evalúa sobre el pedido COMPLETO (todos
// los vendedores juntos en el mismo p_items), no por vendedor — el RPC
// no agrupa por vendor_id en ningún punto de ese cálculo.
//
// Usado por: ProductPageContent.tsx (línea de envío + banner), checkout
// (normal y express) y ProductCard.tsx (tarjetas) — todos deben leer el
// umbral de acá, nunca redeclararlo, para que si algún día cambia sea un
// solo lugar el que se actualiza.
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

// Mismo criterio que el RPC (ORDER BY min_quantity DESC LIMIT 1 entre los
// tramos cuyo rango incluye la cantidad): el tramo más específico que
// califica, o si ninguno aplica, el precio base del catálogo. El RPC no
// considera precio de variante en este cálculo — tampoco acá, a
// propósito, para quedar byte-exacto con lo que de verdad se cobra.
export function resolveEffectiveUnitPriceRdp(
  basePriceRdp: number,
  tiers: PricingTierLike[],
  quantity: number
): number {
  const qualifying = tiers
    .filter(t => t.min_quantity <= quantity && (t.max_quantity === null || t.max_quantity >= quantity))
    .sort((a, b) => b.min_quantity - a.min_quantity)
  return qualifying[0]?.price_rdp ?? basePriceRdp
}
