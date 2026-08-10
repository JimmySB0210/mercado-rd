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
//
// Namespaces anidados (ej. vendorOptions): DotPaths<T> genera el tipo
// de las keys como rutas con punto ('businessType.manufacturer'). Para
// un diccionario plano, DotPaths<T> es idéntico a keyof T — por eso
// los namespaces existentes no necesitan cambiar su overload. t() usa
// getByPath() para resolver la ruta contra el objeto anidado; en un
// diccionario plano, una ruta de un solo segmento equivale al acceso
// directo de siempre.
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
import { cart as cartEs, type CartDict } from '@/lib/i18n/es/cart'
import { cart as cartEn } from '@/lib/i18n/en/cart'
import { cart as cartFr } from '@/lib/i18n/fr/cart'
import { checkout as checkoutEs, type CheckoutDict } from '@/lib/i18n/es/checkout'
import { checkout as checkoutEn } from '@/lib/i18n/en/checkout'
import { checkout as checkoutFr } from '@/lib/i18n/fr/checkout'
import { dashboard as dashboardEs, type DashboardDict } from '@/lib/i18n/es/dashboard'
import { dashboard as dashboardEn } from '@/lib/i18n/en/dashboard'
import { dashboard as dashboardFr } from '@/lib/i18n/fr/dashboard'
import { vendorOptions as vendorOptionsEs, type VendorOptionsDict } from '@/lib/i18n/es/vendorOptions'
import { vendorOptions as vendorOptionsEn } from '@/lib/i18n/en/vendorOptions'
import { vendorOptions as vendorOptionsFr } from '@/lib/i18n/fr/vendorOptions'
import { auth as authEs, type AuthDict } from '@/lib/i18n/es/auth'
import { auth as authEn } from '@/lib/i18n/en/auth'
import { auth as authFr } from '@/lib/i18n/fr/auth'
import { profile as profileEs, type ProfileDict } from '@/lib/i18n/es/profile'
import { profile as profileEn } from '@/lib/i18n/en/profile'
import { profile as profileFr } from '@/lib/i18n/fr/profile'
import { directory as directoryEs, type DirectoryDict } from '@/lib/i18n/es/directory'
import { directory as directoryEn } from '@/lib/i18n/en/directory'
import { directory as directoryFr } from '@/lib/i18n/fr/directory'
import { chat as chatEs, type ChatDict } from '@/lib/i18n/es/chat'
import { chat as chatEn } from '@/lib/i18n/en/chat'
import { chat as chatFr } from '@/lib/i18n/fr/chat'

const NAMESPACES = {
  common: { es: commonEs, en: commonEn, fr: commonFr },
  home: { es: homeEs, en: homeEn, fr: homeFr },
  categories: { es: categoriesEs, en: categoriesEn, fr: categoriesFr },
  products: { es: productsEs, en: productsEn, fr: productsFr },
  cart: { es: cartEs, en: cartEn, fr: cartFr },
  checkout: { es: checkoutEs, en: checkoutEn, fr: checkoutFr },
  dashboard: { es: dashboardEs, en: dashboardEn, fr: dashboardFr },
  vendorOptions: { es: vendorOptionsEs, en: vendorOptionsEn, fr: vendorOptionsFr },
  auth: { es: authEs, en: authEn, fr: authFr },
  profile: { es: profileEs, en: profileEn, fr: profileFr },
  directory: { es: directoryEs, en: directoryEn, fr: directoryFr },
  chat: { es: chatEs, en: chatEn, fr: chatFr },
} as const

// Genera 'businessType.manufacturer' | 'verificationLevel.1' | ... para
// un diccionario anidado un nivel; para un diccionario plano genera
// exactamente keyof T (cada valor string ya es la ruta completa).
type DotPaths<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : T[K] extends Record<string, string>
      ? `${K}.${keyof T[K] & string}`
      : never
}[keyof T & string]

function getByPath(obj: unknown, path: string): string | undefined {
  let cur: unknown = obj
  for (const part of path.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[part]
  }
  return typeof cur === 'string' ? cur : undefined
}

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
export function useTranslation(namespace: 'cart'): TranslationResult<keyof CartDict>
export function useTranslation(namespace: 'checkout'): TranslationResult<keyof CheckoutDict>
export function useTranslation(namespace: 'dashboard'): TranslationResult<keyof DashboardDict>
export function useTranslation(namespace: 'vendorOptions'): TranslationResult<DotPaths<VendorOptionsDict>>
export function useTranslation(namespace: 'auth'): TranslationResult<keyof AuthDict>
export function useTranslation(namespace: 'profile'): TranslationResult<DotPaths<ProfileDict>>
export function useTranslation(namespace: 'directory'): TranslationResult<keyof DirectoryDict>
export function useTranslation(namespace: 'chat'): TranslationResult<keyof ChatDict>
export function useTranslation(namespace: Namespace): TranslationResult<string> {
  const language = useLanguageStore((s) => s.language)

  const dicts = NAMESPACES[namespace]
  const currentDict = dicts[language]
  const fallbackDict = dicts.es

  function t(key: string, params?: TranslationParams): string {
    const template = getByPath(currentDict, key) ?? getByPath(fallbackDict, key) ?? key
    return interpolate(template, params)
  }

  return { t, language }
}
