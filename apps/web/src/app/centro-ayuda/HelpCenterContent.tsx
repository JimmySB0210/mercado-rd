'use client'
// ============================================================
// MercadoRD — Contenido del Centro de ayuda
// Ruta: src/app/centro-ayuda/HelpCenterContent.tsx
// ============================================================
// page.tsx es un Server Component y no puede usar useTranslation ni
// estado. Recibe los artículos publicados y se encarga de: agrupar por
// categoría (9, en orden fijo), buscar por título/contenido, y el
// acordeón — cada artículo se abre y cierra por separado, y abrir uno
// deja su enlace directo en la URL (#slug) para poder compartirlo.
//
// El contenido es texto plano de la base: se pinta como <p> por
// párrafo (React escapa el texto, nunca se inyecta HTML).
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { BRAND } from '@/lib/colors'
import { filterHelpArticles, groupHelpArticles, splitParagraphs } from '@/lib/helpCenter'
import type { HelpArticle } from '@/types/database.types'

// Con pocos resultados se abren solos, para ver la respuesta sin un clic más
const AUTO_OPEN_MAX_RESULTS = 3

interface Props {
  articles: HelpArticle[]
  loadFailed: boolean
}

export function HelpCenterContent({ articles, loadFailed }: Props) {
  const { t, language } = useTranslation('support')
  const [query, setQuery] = useState('')
  // slugs de los artículos abiertos (el slug es único global)
  const [open, setOpen] = useState<Set<string>>(new Set())

  const searching = query.trim().length > 0
  const filtered = useMemo(() => filterHelpArticles(articles, query), [articles, query])
  const groups = useMemo(() => groupHelpArticles(filtered), [filtered])

  // Enlace directo: /centro-ayuda#como-abrir-una-disputa abre ese artículo
  useEffect(() => {
    const openFromHash = () => {
      const slug = decodeURIComponent(window.location.hash.slice(1))
      if (!slug || !articles.some(a => a.slug === slug)) return
      setOpen(prev => new Set(prev).add(slug))
      // el panel se pinta en el siguiente frame — recién ahí hay dónde hacer scroll
      requestAnimationFrame(() => {
        document.getElementById(slug)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
    openFromHash()
    window.addEventListener('hashchange', openFromHash)
    return () => window.removeEventListener('hashchange', openFromHash)
  }, [articles])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    const matches = filterHelpArticles(articles, value)
    if (value.trim() && matches.length <= AUTO_OPEN_MAX_RESULTS) {
      setOpen(prev => new Set([...prev, ...matches.map(a => a.slug)]))
    }
  }

  const toggle = (slug: string) => {
    const willOpen = !open.has(slug)
    setOpen(prev => {
      const next = new Set(prev)
      if (willOpen) next.add(slug)
      else next.delete(slug)
      return next
    })
    // Al abrir, la URL queda apuntando a este artículo (sin agregar una
    // entrada al historial ni provocar scroll)
    if (willOpen) window.history.replaceState(null, '', `#${slug}`)
  }

  const countLabel = (count: number) =>
    count === 1 ? t('helpCenterArticleCountOne') : t('helpCenterArticleCountMany', { count })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <nav className="text-sm text-gray-400 mb-4">
        <a href="/" className="hover:text-gray-600 transition-colors no-underline">{t('breadcrumbHome')}</a>
        <span className="mx-2">/</span>
        <span className="text-gray-600">{t('helpCenterBreadcrumbCurrent')}</span>
      </nav>

      <h1
        className="text-2xl sm:text-3xl mb-1"
        style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--color-blue-dark)', letterSpacing: 'var(--tracking-heading)' }}
      >
        {t('helpCenterTitle')}
      </h1>
      <p className="text-sm text-gray-500 mb-5">{t('helpCenterSubtitle')}</p>

      {/* El contenido de los artículos vive en la base en un solo idioma */}
      {language !== 'es' && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700 mb-5">
          {t('helpCenterSpanishOnlyNotice')}
        </div>
      )}

      {/* Buscador */}
      <div className="relative mb-5">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          inputMode="search"
          enterKeyHint="search"
          value={query}
          onChange={e => handleQueryChange(e.target.value)}
          placeholder={t('helpCenterSearchPlaceholder')}
          aria-label={t('helpCenterSearchAria')}
          className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:border-transparent"
          style={{ '--brand-blue': BRAND.blue } as React.CSSProperties}
        />
        {query && (
          <button
            type="button"
            onClick={() => handleQueryChange('')}
            aria-label={t('helpCenterClearSearchAria')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {loadFailed ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-sm text-gray-500">
          {t('helpCenterLoadError')}
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-sm text-gray-500">
          {t('helpCenterEmpty')}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-sm font-semibold text-gray-800 mb-1">{t('helpCenterNoResultsTitle', { query: query.trim() })}</p>
          <p className="text-sm text-gray-500 mb-4">{t('helpCenterNoResultsHint')}</p>
          <button
            type="button"
            onClick={() => handleQueryChange('')}
            className="text-sm font-semibold bg-transparent border-none cursor-pointer hover:underline"
            style={{ color: BRAND.blue }}
          >
            {t('helpCenterClearSearchButton')}
          </button>
        </div>
      ) : (
        <>
          {searching && (
            <p className="text-sm text-gray-500 mb-4">
              {filtered.length === 1
                ? t('helpCenterResultsOne', { query: query.trim() })
                : t('helpCenterResultsMany', { count: filtered.length, query: query.trim() })}
            </p>
          )}

          {/* Navegación por categorías — anclas a cada sección */}
          <nav aria-label={t('helpCenterCategoriesNavAria')} className="flex flex-wrap gap-2 mb-8">
            {groups.map(group => (
              <a
                key={group.slug}
                href={`#categoria-${group.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-sm font-medium text-gray-700 no-underline hover:border-gray-400 transition-colors"
              >
                <span aria-hidden="true">{group.config?.emoji ?? '📄'}</span>
                {group.config ? t(group.config.labelKey) : group.slug}
              </a>
            ))}
          </nav>

          {groups.map(group => {
            const label = group.config ? t(group.config.labelKey) : group.slug
            return (
              <section
                key={group.slug}
                id={`categoria-${group.slug}`}
                aria-labelledby={`categoria-titulo-${group.slug}`}
                className="mb-8 scroll-mt-24"
              >
                <h2
                  id={`categoria-titulo-${group.slug}`}
                  className="flex items-baseline gap-2 mb-3"
                  style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, color: 'var(--color-blue-dark)' }}
                >
                  <span aria-hidden="true">{group.config?.emoji ?? '📄'}</span>
                  {label}
                  <span className="text-xs font-normal text-gray-400" style={{ fontFamily: 'var(--font-body)' }}>
                    {countLabel(group.articles.length)}
                  </span>
                </h2>

                <div className="space-y-2">
                  {group.articles.map(article => {
                    const isOpen = open.has(article.slug)
                    return (
                      <div
                        key={article.id}
                        id={article.slug}
                        className="bg-white scroll-mt-24"
                        style={{ borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
                      >
                        <h3 className="m-0">
                          <button
                            type="button"
                            id={`articulo-titulo-${article.slug}`}
                            aria-expanded={isOpen}
                            aria-controls={isOpen ? `articulo-panel-${article.slug}` : undefined}
                            onClick={() => toggle(article.slug)}
                            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left bg-transparent border-none cursor-pointer"
                          >
                            <span className="text-sm sm:text-base font-semibold text-gray-900">{article.title}</span>
                            <ChevronDown
                              size={18}
                              aria-hidden="true"
                              className={`flex-shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            />
                          </button>
                        </h3>

                        {isOpen && (
                          <div
                            id={`articulo-panel-${article.slug}`}
                            role="region"
                            aria-labelledby={`articulo-titulo-${article.slug}`}
                            className="px-5 pb-5 space-y-3 text-sm leading-relaxed text-gray-600"
                          >
                            {splitParagraphs(article.content).map((paragraph, i) => (
                              <p key={i} className="m-0" style={{ whiteSpace: 'pre-line' }}>{paragraph}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </>
      )}

      {/* ¿Sigue sin resolverse? → soporte */}
      {!loadFailed && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center mt-10">
          <h2 className="text-base font-bold text-gray-900 mb-1">{t('helpCenterStillNeedHelpTitle')}</h2>
          <p className="text-sm text-gray-500 mb-4">{t('helpCenterStillNeedHelpText')}</p>
          <a
            href="/soporte"
            className="inline-block text-white text-sm font-semibold rounded-lg px-5 py-2.5 no-underline hover:brightness-95 transition-all"
            style={{ background: BRAND.blue }}
          >
            {t('helpCenterContactSupportCta')}
          </a>
        </div>
      )}

    </div>
  )
}
