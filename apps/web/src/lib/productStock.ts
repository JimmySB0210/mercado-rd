// ============================================================
// MercadoRD — Definición única de "alerta de stock"
// Ruta: src/lib/productStock.ts
// ============================================================
// Umbral efectivo = products.low_stock_threshold si está definido,
// si no 5. Es bajo cuando stock <= umbral efectivo; agotado (stock 0)
// cuenta como bajo.
//
// La alerta solo aplica a productos PUBLICADOS: es una señal sobre
// inventario vendible. Un producto pausado o en borrador con poco stock
// no es accionable, así que no entra en contadores, filtros ni badges.
// Mis Productos y el dashboard usan este mismo helper.
// ============================================================

export const DEFAULT_LOW_STOCK_THRESHOLD = 5

interface StockFields {
  stock: number
  low_stock_threshold: number | null
}

interface StockAlertFields extends StockFields {
  status: string
}

export function effectiveLowStockThreshold(p: Pick<StockFields, 'low_stock_threshold'>): number {
  return p.low_stock_threshold ?? DEFAULT_LOW_STOCK_THRESHOLD
}

export function isLowStock(p: StockFields): boolean {
  return p.stock <= effectiveLowStockThreshold(p)
}

export function isStockAlert(p: StockAlertFields): boolean {
  return p.status === 'published' && isLowStock(p)
}
