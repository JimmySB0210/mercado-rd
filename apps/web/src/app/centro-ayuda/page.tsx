// ============================================================
// MercadoRD — Centro de ayuda
// Ruta: src/app/centro-ayuda/page.tsx
// ============================================================
// Server Component — solo trae los artículos publicados; el texto
// traducido, la búsqueda y el acordeón viven en HelpCenterContent
// (Client Component).
//
// help_articles: lectura pública únicamente de las filas con
// is_published = true (política RLS help_articles_public_read), así que
// un artículo despublicado desde /admin/centro-ayuda deja de llegar
// acá aunque este filtro faltara — el .eq() de abajo lo deja explícito.
// ============================================================

import type { Metadata } from 'next'
import { createPublicClient } from '@/lib/supabase/public'
import { Navbar } from '@/components/shop/Navbar'
import { HelpCenterContent } from './HelpCenterContent'
import type { HelpArticle } from '@/types/database.types'

// Sin caché: el admin edita desde el navegador (directo a Supabase), el
// servidor no se entera del cambio — cada visita tiene que leer el estado
// real para que publicar/despublicar/editar se refleje de inmediato. Son
// 13 filas con índice por (category, sort_order): una lectura barata.
// dynamic = 'force-dynamic' SOLO no bastó (Next 14.2.3): la página se
// ejecutaba en cada visita pero la consulta a Supabase se reutilizaba de
// la caché de datos y seguía mostrando un artículo ya despublicado. Por eso
// además se desactiva explícitamente esa caché para este segmento.
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export const metadata: Metadata = {
  title: 'Centro de ayuda — MercadoRD',
  description: 'Respuestas a las preguntas más frecuentes sobre comprar, vender, pagar, enviar, devoluciones y más en MercadoRD.',
}

export default async function CentroAyudaPage() {
  const supabase = createPublicClient()

  const { data, error } = await supabase
    .from('help_articles')
    .select('id, category, slug, title, content, sort_order, is_published, created_at, updated_at')
    .eq('is_published', true)
    .order('sort_order')

  if (error) console.error('[CentroAyudaPage]', error)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <HelpCenterContent articles={(data ?? []) as HelpArticle[]} loadFailed={!!error} />
    </div>
  )
}
