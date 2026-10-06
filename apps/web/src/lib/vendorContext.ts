// ============================================================
// MercadoRD — Contexto de proveedor (vendedor mayorista)
// Ruta: src/lib/vendorContext.ts
// ============================================================
// Un vendedor es de contexto "proveedor" si su perfil declara un tipo de
// negocio mayorista. Es la misma regla que usa la página de producto para
// ofrecer el banner de precios por volumen. Se guarda aquí para que las dos
// páginas no mantengan copias separadas.
// ============================================================

export const WHOLESALE_BUSINESS_TYPES: ReadonlySet<string> = new Set(['wholesaler', 'distributor', 'manufacturer'])

export function isSupplierContext(businessTypes: string[]): boolean {
  return businessTypes.some(type => WHOLESALE_BUSINESS_TYPES.has(type))
}
