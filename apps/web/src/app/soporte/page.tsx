// ============================================================
// MercadoRD — Soporte al cliente
// Ruta: src/app/soporte/page.tsx
// ============================================================
// Página pública (sin login). Server Component: trae las preguntas
// frecuentes (artículos reales del Centro de ayuda) y pasa el número de
// WhatsApp; el estado, el formulario que arma el mensaje de WhatsApp y
// el layout viven en SoporteContent (Client Component).
// ============================================================

import type { Metadata } from 'next'
import { createPublicClient } from '@/lib/supabase/public'
import { Navbar } from '@/components/shop/Navbar'
import { SoporteContent } from './SoporteContent'
import type { HelpArticle } from '@/types/database.types'

// Número de WhatsApp Business — PLACEHOLDER, Jimmy lo cambiará
// cuando tenga el número real.
const WHATSAPP_NUMBER = '18091234567'

// Preguntas frecuentes de Soporte, en este orden: artículos de
// help_articles (no se duplica contenido; se editan desde el admin).
const SUPPORT_FAQ_SLUGS = [
  'como-abrir-una-disputa',
  'politica-de-devoluciones',
  'como-funcionan-los-reembolsos',
  'como-protegemos-tu-compra',
]

// Sin caché, igual que /centro-ayuda: un artículo editado o
// despublicado desde el admin se refleja en la siguiente visita.
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export const metadata: Metadata = {
  title: 'Soporte — MercadoRD',
  description: 'Resuelve problemas con tus pedidos, pagos, devoluciones o tu cuenta, y contacta con el equipo de soporte de MercadoRD.',
}

export default async function SoportePage() {
  const supabase = createPublicClient()

  const { data, error } = await supabase
    .from('help_articles')
    .select('id, category, slug, title, content, sort_order, is_published, created_at, updated_at')
    .in('slug', SUPPORT_FAQ_SLUGS)
    .eq('is_published', true)

  if (error) console.error('[SoportePage] help_articles', error)

  const rows = (data ?? []) as HelpArticle[]
  const faqs = SUPPORT_FAQ_SLUGS
    .map(slug => rows.find(article => article.slug === slug))
    .filter((article): article is HelpArticle => !!article)
  if (!error && faqs.length === 0) console.error('[SoportePage] help_articles: ninguna pregunta frecuente publicada')

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-main)' }}>
      <Navbar />
      <SoporteContent whatsappNumber={WHATSAPP_NUMBER} faqs={faqs} />
    </div>
  )
}
