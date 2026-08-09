'use client'
// ============================================================
// MercadoRD — Hook de traducción
// Ruta: src/lib/hooks/useTranslation.ts
// ============================================================
// t(key, params?) busca la traducción en el idioma actual (store de
// Zustand). Si falta una clave en el idioma activo, cae a español en
// vez de romper — español es siempre el diccionario completo (fuente
// de verdad), así que el fallback nunca puede fallar en tiempo de
// ejecución.
//
// Interpolación: los valores del diccionario pueden contener
// placeholders como '{count}' — t('key', { count: 3 }) los reemplaza.
// Si no se pasan params, el texto se devuelve tal cual (placeholders
// literales incluidos, por si una clave no los necesita).
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
import { categories as categoriesEs, type CategoriesDict } from '@/lib/i18n/es/categories'
import { categories as categoriesEn } from '@/lib/i18n/en/categories'
import { categories as categoriesFr } from '@/lib/i18n/fr/categories'
import { products as productsEs, type ProductsDict } from '@/lib/i18n/es/products'
import { products as productsEn } from '@/lib/i18n/en/products'
import { products as productsFr } from '@/lib/i18n/fr/products'

const NAMESPACES = {
  common: { es: commonEs, en: commonEn, fr: commonFr },
  home: { es: homeEs, en: homeEn, fr: homeFr },
  categories: { es: categoriesEs, en: categoriesEn, fr: categoriesFr },
  products: { es: productsEs, en: productsEn, fr: productsFr },
} as const

export type Namespace = keyof typeof NAMESPACES

type TranslationParams = Record<string, string | number>

interface TranslationResult<K extends string> {
  t: (key: K, params?: TranslationParams) => string
  language: Language
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
  )
}

export function useTranslation(namespace: 'common'): TranslationResult<keyof CommonDict>
export function useTranslation(namespace: 'home'): TranslationResult<keyof HomeDict>
export function useTranslation(namespace: 'categories'): TranslationResult<keyof CategoriesDict>
export function useTranslation(namespace: 'products'): TranslationResult<keyof ProductsDict>
export function useTranslation(namespace: Namespace): TranslationResult<string> {
  const language = useLanguageStore((s) => s.language)

  const dicts = NAMESPACES[namespace]
  const currentDict = dicts[language] as Record<string, string>
  const fallbackDict = dicts.es as Record<string, string>

  function t(key: string, params?: TranslationParams): string {
    const template = currentDict[key] ?? fallbackDict[key]
    return interpolate(template, params)
  }

  return { t, language }
}
