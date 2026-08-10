// ============================================================
// MercadoRD — Estilos de badge por nivel de verificación
// Archivo: lib/vendorLabels.ts
// ============================================================
// El texto de cada nivel vive en vendorOptions.verificationLevel
// (namespace de traducción) — este archivo solo guarda el emoji y
// las clases Tailwind por nivel. Ver components/vendor/VerificationBadge.tsx.
// verification_level: 1 = sin badge, 2-4 = niveles crecientes de confianza.
// ============================================================

export const VERIFICATION_BADGES: Record<number, { emoji: string; bg: string; text: string }> = {
  2: { emoji: '✓', bg: 'bg-blue-50', text: 'text-blue-600' },
  3: { emoji: '🏭', bg: 'bg-indigo-50', text: 'text-indigo-600' },
  4: { emoji: '⭐', bg: 'bg-amber-50', text: 'text-amber-700' },
}
