'use client'
// ============================================================
// MercadoRD — Contenido de "Acerca de MercadoRD"
// Ruta: src/app/acerca-de/AboutContent.tsx
// ============================================================
// page.tsx es un Server Component y no puede usar useTranslation.
// Recibe los artículos publicados de las 4 categorías de marca
// (acerca-de, compromiso, por-que-elegirnos, responsabilidad) y los
// muestra como secciones narrativas fijas, en ese orden — a
// diferencia de Centro de ayuda esto NO es un acordeón de
// preguntas/respuestas: es contenido de marca, siempre visible, sin
// estado que abrir/cerrar ni buscador.
//
// El contenido es texto plano de la base: se pinta como <p> por
// párrafo (React escapa el texto, nunca se inyecta HTML) — mismo
// tratamiento que HelpCenterContent.
// ============================================================

import { Award, Building2, HeartHandshake, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { BRAND } from '@/lib/colors'
import { orderAboutArticles, type AboutSection } from '@/lib/aboutPage'
import { splitParagraphs } from '@/lib/helpCenter'
import type { HelpArticle } from '@/types/database.types'

// Un ícono fijo por categoría — puramente decorativo, no depende de
// nada editable desde el admin (título/contenido sí lo son).
const SECTION_ICONS: Record<AboutSection['category'], LucideIcon> = {
  'acerca-de': Building2,
  compromiso: ShieldCheck,
  'por-que-elegirnos': Award,
  responsabilidad: HeartHandshake,
}

interface Props {
  articles: HelpArticle[]
  loadFailed: boolean
}

export function AboutContent({ articles, loadFailed }: Props) {
  const { t, language } = useTranslation('support')
  const { t: tc } = useTranslation('common')
  const sections = orderAboutArticles(articles)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <nav className="text-sm text-gray-400 mb-4">
        <a href="/" className="hover:text-gray-600 transition-colors no-underline">{t('breadcrumbHome')}</a>
        <span className="mx-2">/</span>
        <span className="text-gray-600">{t('aboutBreadcrumbCurrent')}</span>
      </nav>

      <h1
        className="text-2xl sm:text-3xl mb-1"
        style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-blue-dark)', letterSpacing: 'var(--tracking-heading)' }}
      >
        {t('aboutPageTitle')}
      </h1>
      <p className="text-sm text-gray-500 mb-5">{t('aboutPageSubtitle')}</p>

      {/* El contenido de las secciones vive en la base en un solo idioma */}
      {language !== 'es' && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700 mb-5">
          {t('aboutSpanishOnlyNotice')}
        </div>
      )}

      {loadFailed ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-sm text-gray-500">
          {t('aboutLoadError')}
        </div>
      ) : sections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-sm text-gray-500">
          {t('aboutEmpty')}
        </div>
      ) : (
        <div className="space-y-5">
          {sections.map(section => {
            const Icon = SECTION_ICONS[section.category]
            return (
              <section
                key={section.category}
                id={section.category}
                className="bg-white p-6 sm:p-7 scroll-mt-24"
                style={{ borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{ width: 44, height: 44, borderRadius: 'var(--radius-control)', background: 'var(--color-primary-subtle)' }}
                  >
                    <Icon size={22} color={BRAND.blue} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    {section.articles.map(article => (
                      <div key={article.id} className="mb-5 last:mb-0">
                        <h2
                          className="text-lg sm:text-xl mb-2"
                          style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-blue-dark)' }}
                        >
                          {article.title}
                        </h2>
                        <div className="space-y-3 text-sm leading-relaxed text-gray-600">
                          {splitParagraphs(article.content).map((paragraph, i) => (
                            <p key={i} className="m-0" style={{ whiteSpace: 'pre-line' }}>{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* Puente hacia el Centro de ayuda — igual de útil acá: quien
          llega a "Acerca de" buscando confianza suele terminar con
          preguntas prácticas (envíos, pagos, disputas). */}
      {!loadFailed && sections.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center mt-8">
          <h2 className="text-base font-bold text-gray-900 mb-1">{t('helpCenterStillNeedHelpTitle')}</h2>
          <p className="text-sm text-gray-500 mb-4">{t('helpCenterStillNeedHelpText')}</p>
          <a
            href="/centro-ayuda"
            className="inline-block text-white text-sm font-semibold rounded-lg px-5 py-2.5 no-underline hover:brightness-95 transition-all"
            style={{ background: BRAND.blue }}
          >
            {tc('helpCenter')}
          </a>
        </div>
      )}

    </div>
  )
}
