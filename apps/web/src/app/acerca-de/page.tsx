// ============================================================
// MercadoRD — Acerca de MercadoRD
// Ruta: src/app/acerca-de/page.tsx
// ============================================================
// Reusa help_articles (mismas 4 categorías nuevas: acerca-de,
// compromiso, por-que-elegirnos, responsabilidad) y el mismo panel de
// admin — /admin/centro-ayuda ya sabe crear/editar/publicar cualquier
// categoría, sin cambios ahí. Server Component — el texto traducido
// (chrome de la página, no el contenido de la base) vive en
// AboutContent (Client Component).
//
// Sin caché: igual que /centro-ayuda, el admin edita directo contra
// Supabase desde el navegador y el servidor nunca se entera — sin
// estas 3 líneas, dynamic='force-dynamic' solo no bastaba y la
// consulta seguía sirviendo contenido viejo (ver el comentario en
// centro-ayuda/page.tsx).
// ============================================================

import type { Metadata } from 'next'
import { createPublicClient } from '@/lib/supabase/public'
import { Navbar } from '@/components/shop/Navbar'
import { AboutContent } from './AboutContent'
import { ABOUT_CATEGORY_SLUGS } from '@/lib/aboutPage'
import type { HelpArticle } from '@/types/database.types'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export const metadata: Metadata = {
  title: 'Acerca de MercadoRD',
  description: 'Quiénes somos, nuestro compromiso, por qué elegirnos y nuestra responsabilidad — conoce más sobre MercadoRD.',
}

export default async function AcercaDePage() {
  const supabase = createPublicClient()

  const { data, error } = await supabase
    .from('help_articles')
    .select('id, category, slug, title, content, sort_order, is_published, created_at, updated_at')
    .in('category', ABOUT_CATEGORY_SLUGS)
    .eq('is_published', true)
    .order('sort_order')

  if (error) console.error('[AcercaDePage]', error)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <AboutContent articles={(data ?? []) as HelpArticle[]} loadFailed={!!error} />
    </div>
  )
}
