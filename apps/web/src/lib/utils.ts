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

export function getMembershipDuration(createdAt: string): string {
  const created = new Date(createdAt)
  const now = new Date()
  const months = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth())

  if (months < 1) return 'nuevo'
  if (months < 12) return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`
  const years = Math.floor(months / 12)
  return `hace ${years} ${years === 1 ? 'año' : 'años'}`
}
