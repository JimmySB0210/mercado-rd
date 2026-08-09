'use client'
// ============================================================
// MercadoRD — Hook de traducción
// Ruta: src/lib/hooks/useTranslation.ts
// ============================================================
// t(key) busca la traducción en el idioma actual (store de Zustand).
// Si falta una clave en el idioma activo, cae a español en vez de
// romper — español es siempre el diccionario completo (fuente de
// verdad), así que el fallback nunca puede fallar en tiempo de
// ejecución.
//
// El tipado público de t() usa overloads (uno por namespace) en vez
// de un genérico indexado — TypeScript no puede distribuir un tipo
// indexado sobre un generic no resuelto (NamespaceMap[N]['es']), así
// que la implementación interna usa Record<string, string> suelto,
// pero cada call site sigue teniendo autocompletado y error de
// compilación si la key no existe. Nuevos namespaces: agregar el
// diccionario a NAMESPACES y un overload más abajo.
// ============================================================

import { useLanguageStore, type Language } from '@/lib/store/language'

import { common as commonEs, type CommonDict } from '@/lib/i18n/es/common'
import { common as commonEn } from '@/lib/i18n/en/common'
import { common as commonFr } from '@/lib/i18n/fr/common'
import { home as homeEs, type HomeDict } from '@/lib/i18n/es/home'
import { home as homeEn } from '@/lib/i18n/en/home'
import { home as homeFr } from '@/lib/i18n/fr/home'

const NAMESPACES = {
  common: { es: commonEs, en: commonEn, fr: commonFr },
  home: { es: homeEs, en: homeEn, fr: homeFr },
} as const

export type Namespace = keyof typeof NAMESPACES

interface TranslationResult<K extends string> {
  t: (key: K) => string
  language: Language
}

export function useTranslation(namespace: 'common'): TranslationResult<keyof CommonDict>
export function useTranslation(namespace: 'home'): TranslationResult<keyof HomeDict>
export function useTranslation(namespace: Namespace): TranslationResult<string> {
  const language = useLanguageStore((s) => s.language)

  const dicts = NAMESPACES[namespace]
  const currentDict = dicts[language] as Record<string, string>
  const fallbackDict = dicts.es as Record<string, string>

  function t(key: string): string {
    return currentDict[key] ?? fallbackDict[key]
  }

  return { t, language }
}
