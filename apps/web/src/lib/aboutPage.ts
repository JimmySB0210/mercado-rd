// ============================================================
// MercadoRD — "Acerca de MercadoRD": lógica compartida
// Ruta: src/lib/aboutPage.ts
// ============================================================
// Reusa la misma tabla del Centro de ayuda (help_articles) con 4
// categorías nuevas — contenido de marca (narrativo), no FAQ, así que
// vive en su propio archivo en vez de mezclarse con helpCenter.ts:
// distinto orden (fijo, por categoría — no alfabético ni por
// sort_order entre categorías), sin acordeón ni búsqueda.
//
// Los slugs de ABOUT_CATEGORY_SLUGS son los mismos que id={category}
// en AboutContent.tsx y los anchors del footer (#acerca-de,
// #compromiso, #por-que-elegirnos, #responsabilidad) — a propósito no
// se ancla por article.slug (como sí hace Centro de ayuda): el slug es
// un campo de texto libre editable desde /admin/centro-ayuda, mientras
// que category ahí es un <select> que solo ofrece las categorías
// conocidas (o la propia categoría del artículo como única opción
// "ajena") — el admin no puede escribirla a mano, así que estos 4
// anchors del footer no se rompen con una edición normal.
// ============================================================

import type { HelpArticle } from '@/types/database.types'
import { compareHelpArticles } from '@/lib/helpCenter'

export const ABOUT_CATEGORY_SLUGS = ['acerca-de', 'compromiso', 'por-que-elegirnos', 'responsabilidad'] as const

export interface AboutSection {
  category: (typeof ABOUT_CATEGORY_SLUGS)[number]
  articles: HelpArticle[]
}

// Agrupa en el orden fijo pedido (Quiénes somos → Compromiso → Por qué
// elegirnos → Responsabilidad), sin importar el orden en que la base
// devuelva las filas. Una categoría sin artículos publicados
// simplemente no aparece — nunca un hueco vacío.
export function orderAboutArticles(articles: HelpArticle[]): AboutSection[] {
  const bySlug = new Map<string, HelpArticle[]>()
  for (const article of articles) {
    const list = bySlug.get(article.category)
    if (list) list.push(article)
    else bySlug.set(article.category, [article])
  }

  return ABOUT_CATEGORY_SLUGS
    .map(category => ({ category, articles: (bySlug.get(category) ?? []).sort(compareHelpArticles) }))
    .filter((section): section is AboutSection => section.articles.length > 0)
}
