// ============================================================
// MercadoRD — Formato de dinero en pesos dominicanos
// Ruta: src/lib/formatRdp.ts
// ============================================================
// Los montos viajan en centavos. Se muestran como en República
// Dominicana: RD$19,452.30 — coma para los miles, punto para los
// decimales y los dos decimales SOLO cuando el monto tiene centavos
// (RD$16,485 o RD$2,967.30, nunca RD$2,967.3). El ITBIS (18 %) casi
// siempre da centavos: redondear a pesos enteros haría que las líneas
// no sumen el total que se cobra.
//
// Se arma a mano (sin Intl) para que el resultado sea idéntico en todos
// los navegadores y en el servidor.
// ============================================================

export function formatRdp(cents: number): string {
  if (!Number.isFinite(cents)) return '—'
  const rounded = Math.round(cents)
  const abs = Math.abs(rounded)
  const pesos = Math.floor(abs / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const centavos = abs % 100
  const decimals = centavos === 0 ? '' : `.${centavos.toString().padStart(2, '0')}`
  return `${rounded < 0 ? '-' : ''}RD$${pesos}${decimals}`
}
