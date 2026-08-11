// ============================================================
// MercadoRD — Utilidades generales
// Archivo: lib/utils.ts
// ============================================================

import type { Language } from '@/lib/store/language'

const LOCALE_BY_LANGUAGE: Record<Language, string> = {
  es: 'es-DO',
  en: 'en-US',
  fr: 'fr-FR',
}

// Centraliza el formateo de fechas para que respete el idioma elegido
// (store de idioma) en vez de un locale fijo. `options` es obligatorio
// a propósito — cada call site ya sabía qué formato quería, así que no
// hay un "formato por defecto" implícito que pueda sorprender.
export function formatDate(date: Date | string, language: Language, options: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(LOCALE_BY_LANGUAGE[language], options)
}

// Fallback para product.images vacío o roto — antes apuntaba a
// public/placeholder-product.png, un archivo que nunca existió en el
// repo (404 constante). Data URI en vez de un archivo en public/:
// next/image bloquea la optimización de SVGs locales por defecto
// (dangerouslyAllowSVG), pero pasa los data: URL sin tocarlos, y así
// tampoco puede volver a faltar — vive compilado en el bundle.
export const PLACEHOLDER_PRODUCT_IMAGE =
  'data:image/svg+xml,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#F3F4F6"/>
  <g transform="translate(200,180)" fill="none" stroke="#D1D5DB" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
    <rect x="-70" y="-55" width="140" height="110" rx="8"/>
    <circle cx="-32" cy="-22" r="13"/>
    <path d="M -70 35 L -18 -8 L 12 18 L 70 -28 L 70 35 Z" fill="#D1D5DB" stroke="none"/>
  </g>
  <text x="200" y="268" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="#9CA3AF" text-anchor="middle">Sin imagen</text>
</svg>
`.trim())

export function getMembershipDuration(createdAt: string): string {
  const created = new Date(createdAt)
  const now = new Date()
  const months = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth())

  if (months < 1) return 'nuevo'
  if (months < 12) return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`
  const years = Math.floor(months / 12)
  return `hace ${years} ${years === 1 ? 'año' : 'años'}`
}
