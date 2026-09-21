// ============================================================
// MercadoRD — Centro de ayuda: lógica compartida
// Ruta: src/lib/helpCenter.ts
// ============================================================
// La usan la página pública (/centro-ayuda) y el panel de admin
// (/admin/centro-ayuda) para que ambas hablen exactamente igual de
// categorías, orden, búsqueda y formato del contenido.
//
// help_articles.category es texto libre en la base (sin CHECK): las 9
// categorías de abajo son la convención, en el orden en que se
// muestran. Un artículo con una categoría fuera de esta lista no se
// pierde — se agrupa al final con su propio nombre (ver
// groupHelpArticles), así que un typo en el admin nunca esconde un
// artículo.
// ============================================================

import type { HelpArticle } from '@/types/database.types'
import type { SupportDict } from '@/lib/i18n/es/support'

export interface HelpCategoryConfig {
  slug: string
  emoji: string
  // Clave del diccionario "support" con el nombre traducido
  labelKey: keyof SupportDict
}

export const HELP_CATEGORIES: readonly HelpCategoryConfig[] = [
  { slug: 'comprar', emoji: '🛒', labelKey: 'helpCategoryComprar' },
  { slug: 'vender', emoji: '🏪', labelKey: 'helpCategoryVender' },
  { slug: 'pagar', emoji: '💳', labelKey: 'helpCategoryPagar' },
  { slug: 'enviar', emoji: '📦', labelKey: 'helpCategoryEnviar' },
  { slug: 'devoluciones', emoji: '↩️', labelKey: 'helpCategoryDevoluciones' },
  { slug: 'reembolsos', emoji: '💸', labelKey: 'helpCategoryReembolsos' },
  { slug: 'disputas', emoji: '⚖️', labelKey: 'helpCategoryDisputas' },
  { slug: 'seguridad', emoji: '🛡️', labelKey: 'helpCategorySeguridad' },
  { slug: 'contacto', emoji: '💬', labelKey: 'helpCategoryContacto' },
]

export const KNOWN_HELP_CATEGORY_SLUGS: readonly string[] = HELP_CATEGORIES.map(c => c.slug)

export function getHelpCategoryConfig(slug: string): HelpCategoryConfig | undefined {
  return HELP_CATEGORIES.find(c => c.slug === slug)
}

// Orden estable dentro de una categoría: sort_order y, si dos artículos
// comparten número, el más antiguo primero (nunca depende del orden en
// que la base devuelva las filas).
export function compareHelpArticles(a: HelpArticle, b: HelpArticle): number {
  return a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)
}

export interface HelpArticleGroup {
  slug: string
  // null = categoría fuera de HELP_CATEGORIES (se muestra con el slug tal cual)
  config: HelpCategoryConfig | null
  articles: HelpArticle[]
}

// Agrupa por categoría en el orden de HELP_CATEGORIES; las categorías
// sin artículos no aparecen, y las desconocidas van al final.
export function groupHelpArticles(articles: HelpArticle[]): HelpArticleGroup[] {
  const bySlug = new Map<string, HelpArticle[]>()
  for (const article of articles) {
    const list = bySlug.get(article.category)
    if (list) list.push(article)
    else bySlug.set(article.category, [article])
  }

  const groups: HelpArticleGroup[] = []
  for (const config of HELP_CATEGORIES) {
    const list = bySlug.get(config.slug)
    if (list) groups.push({ slug: config.slug, config, articles: [...list].sort(compareHelpArticles) })
  }
  for (const [slug, list] of bySlug) {
    if (!KNOWN_HELP_CATEGORY_SLUGS.includes(slug)) {
      groups.push({ slug, config: null, articles: [...list].sort(compareHelpArticles) })
    }
  }
  return groups
}

// Minúsculas y sin acentos: "envio" encuentra "envío", "Cómo" a "como".
export function normalizeForSearch(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// Todas las palabras de la búsqueda deben aparecer (en título o
// contenido, en cualquier orden) — "como pagar" no exige la frase
// exacta, pero sí las dos palabras.
export function filterHelpArticles(articles: HelpArticle[], query: string): HelpArticle[] {
  const terms = normalizeForSearch(query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return articles
  return articles.filter(article => {
    const haystack = normalizeForSearch(`${article.title} ${article.content}`)
    return terms.every(term => haystack.includes(term))
  })
}

// El contenido es texto plano: párrafos separados por una o más líneas
// en blanco. Se renderiza como <p> (React escapa el texto; nunca se
// inyecta HTML).
export function splitParagraphs(content: string): string[] {
  return content
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
}

// "Cómo abrir una disputa" → "como-abrir-una-disputa"
export function slugify(text: string): string {
  return normalizeForSearch(text)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
