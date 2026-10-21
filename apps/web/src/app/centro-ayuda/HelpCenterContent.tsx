'use client'
// ============================================================
// MercadoRD — Contenido del Centro de ayuda
// Ruta: src/app/centro-ayuda/HelpCenterContent.tsx
// ============================================================
// page.tsx es un Server Component y no puede usar useTranslation ni
// estado. Recibe los artículos publicados y se encarga de: agrupar por
// categoría (orden fijo de PUBLIC_HELP_GROUPS), buscar por
// título/contenido, y el acordeón — cada artículo se abre y cierra por
// separado, y abrir uno deja su enlace directo en la URL (#slug) para
// poder compartirlo.
//
// Los artículos institucionales (categorías de ABOUT_CATEGORY_SLUGS) no
// son FAQ: van aparte, al final, en "Sobre MercadoRD". Entran en la
// búsqueda y en los enlaces directos como cualquier otro, pero sin chip.
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import {
  ArrowRight, ChevronRight, CreditCard, FileText, Info, LifeBuoy, MessageCircle, Package, Scale,
  Search, SearchX, ShieldCheck, ShoppingCart, Store, Truck, Undo2, UserRound, X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { filterHelpArticles, groupPublicHelpArticles, readableCategoryName } from '@/lib/helpCenter'
import { ABOUT_CATEGORY_SLUGS, orderAboutArticles } from '@/lib/aboutPage'
import { HelpArticleItem } from '@/components/help/HelpArticleItem'
import type { HelpArticle } from '@/types/database.types'

// Con pocos resultados se abren solos, para ver la respuesta sin un clic más
const AUTO_OPEN_MAX_RESULTS = 3

// Un icono por grupo visible (mismo tamaño y estilo en chips y títulos)
const GROUP_ICONS: Record<string, LucideIcon> = {
  comprar: ShoppingCart,
  vender: Store,
  pedidos: Package,
  pagar: CreditCard,
  enviar: Truck,
  'devoluciones-reembolsos': Undo2,
  disputas: Scale,
  seguridad: ShieldCheck,
  cuenta: UserRound,
  contacto: MessageCircle,
}

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2'
const CARD_STYLE: React.CSSProperties = {
  background: 'var(--color-card-bg)',
  border: '1px solid var(--color-divider)',
  borderRadius: 'var(--radius-card)',
  boxShadow: 'var(--shadow-card)',
}
const DIVIDED = 'divide-y divide-[color:var(--color-divider)]'

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
  const groups = useMemo(() => groupPublicHelpArticles(filtered, ABOUT_CATEGORY_SLUGS), [filtered])
  const aboutArticles = useMemo(() => orderAboutArticles(filtered).flatMap(s => s.articles), [filtered])
  const hasAboutArticles = useMemo(() => orderAboutArticles(articles).length > 0, [articles])

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

  const groupLabel = (group: (typeof groups)[number]) =>
    group.config ? t(group.config.labelKey) : readableCategoryName(group.id)

  return (
    <>
      {/* A + B. Encabezado compacto y buscador */}
      <section style={{ background: 'var(--color-primary-subtle)', borderBottom: '1px solid var(--color-divider)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-6 md-860:pt-6 md-860:pb-8">
          <nav className="text-small mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
            <a href="/" className={`no-underline hover:underline ${FOCUS_RING}`} style={{ color: 'var(--color-text-secondary)' }}>{t('breadcrumbHome')}</a>
            <span className="mx-2" aria-hidden="true">/</span>
            <span aria-current="page">{t('helpCenterBreadcrumbCurrent')}</span>
          </nav>

          {/* Desde md-860: texto y buscador a la izquierda, ilustración a la derecha */}
          <div className="md-860:flex md-860:items-center md-860:gap-5">
            <div className="min-w-0 md-860:flex-1">
              <span aria-hidden="true" className="block w-10 h-1 mb-3" style={{ background: 'var(--color-yellow-cta)', borderRadius: 'var(--radius-pill)' }} />
              <h1 className="text-h1 font-bold" style={{ color: 'var(--color-blue-dark)', letterSpacing: 'var(--tracking-heading)' }}>
                {t('helpCenterTitle')}
              </h1>
              <p className="text-body mt-1 text-balance" style={{ color: 'var(--color-text-secondary)' }}>{t('helpCenterSubtitle')}</p>

              <div className="relative mt-5">
                <Search size={20} aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-tertiary)' }} />
                <input
                  type="text"
                  inputMode="search"
                  enterKeyHint="search"
                  value={query}
                  onChange={e => handleQueryChange(e.target.value)}
                  placeholder={t('helpCenterSearchPlaceholder')}
                  aria-label={t('helpCenterSearchAria')}
                  className={`w-full h-14 pl-12 ${query ? 'pr-14' : 'pr-4'} text-ellipsis text-ui sm:text-body [box-shadow:var(--shadow-card)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus:border-[color:var(--color-primary)]`}
                  style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', color: 'var(--color-text-primary)' }}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => handleQueryChange('')}
                    aria-label={t('helpCenterClearSearchAria')}
                    className={`absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 bg-transparent border-none cursor-pointer hover:bg-[color:var(--color-bg-main)] ${FOCUS_RING}`}
                    style={{ color: 'var(--color-text-secondary)', borderRadius: 'var(--radius-control)' }}
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* El contenido de los artículos vive en la base en un solo idioma */}
              {language !== 'es' && (
                <p className="flex items-start gap-2 mt-3 text-small" style={{ color: 'var(--color-text-secondary)' }}>
                  <Info size={16} aria-hidden="true" className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                  {t('helpCenterSpanishOnlyNotice')}
                </p>
              )}
            </div>

            {/* Ilustración decorativa (el texto manuscrito es parte del arte y
                no se traduce). Oculta en móvil: con loading="lazy" no se descarga. */}
            <div className="hidden md-860:block flex-shrink-0 w-[280px] lg:w-[310px]">
              <Image
                src="/images/ayuda-ilustracion.webp"
                alt=""
                width={647}
                height={333}
                sizes="(min-width: 1024px) 310px, 280px"
                aria-hidden="true"
                draggable={false}
                className="w-full h-auto pointer-events-none select-none"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md-860:py-8">
        {loadFailed ? (
          <div className="p-8 text-center text-ui" style={{ ...CARD_STYLE, color: 'var(--color-text-secondary)' }}>
            {t('helpCenterLoadError')}
          </div>
        ) : articles.length === 0 ? (
          <div className="p-8 text-center text-ui" style={{ ...CARD_STYLE, color: 'var(--color-text-secondary)' }}>
            {t('helpCenterEmpty')}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center" style={CARD_STYLE} role="status">
            <span className="inline-flex items-center justify-center w-12 h-12 mb-3" style={{ background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', borderRadius: 'var(--radius-pill)' }} aria-hidden="true">
              <SearchX size={22} />
            </span>
            <p className="text-h4 font-semibold mb-1 break-words" style={{ color: 'var(--color-text-primary)' }}>{t('helpCenterNoResultsTitle', { query: query.trim() })}</p>
            <p className="text-ui mb-4" style={{ color: 'var(--color-text-secondary)' }}>{t('helpCenterNoResultsHint')}</p>
            <button
              type="button"
              onClick={() => handleQueryChange('')}
              className={`inline-flex items-center justify-center min-h-[44px] px-5 text-ui font-semibold cursor-pointer transition-colors hover:bg-[color:var(--color-primary-subtle)] ${FOCUS_RING}`}
              style={{ color: 'var(--color-primary)', background: 'var(--color-card-bg)', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-control)' }}
            >
              {t('helpCenterClearSearchButton')}
            </button>
          </div>
        ) : (
          <>
            {groups.length > 0 && (
              <h2 className="text-h2 font-bold mb-4" style={{ color: 'var(--color-blue-dark)', letterSpacing: 'var(--tracking-heading)' }}>
                {t('helpCenterHowCanWeHelpTitle')}
              </h2>
            )}

            {searching && (
              <p className="text-ui mb-4" role="status" style={{ color: 'var(--color-text-secondary)' }}>
                {filtered.length === 1
                  ? t('helpCenterResultsOne', { query: query.trim() })
                  : t('helpCenterResultsMany', { count: filtered.length, query: query.trim() })}
              </p>
            )}

            {/* C. Categorías — anclas a cada sección. En móvil, desplazamiento horizontal */}
            {groups.length > 0 && (
              <nav
                aria-label={t('helpCenterCategoriesNavAria')}
                className="flex gap-2 mb-8 -mx-4 px-4 overflow-x-auto pb-1 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible"
              >
                {groups.map(group => {
                  const Icon = GROUP_ICONS[group.id] ?? FileText
                  return (
                    <a
                      key={group.id}
                      href={`#categoria-${group.id}`}
                      className={`inline-flex flex-shrink-0 items-center gap-2 min-h-[44px] px-4 text-ui font-medium no-underline whitespace-nowrap transition-colors hover:bg-[color:var(--color-primary-subtle)] hover:border-[color:var(--color-primary)] ${FOCUS_RING}`}
                      style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-pill)', color: 'var(--color-text-primary)' }}
                    >
                      <Icon size={16} aria-hidden="true" style={{ color: 'var(--color-primary)' }} />
                      {groupLabel(group)}
                      <span className="text-caption" style={{ color: 'var(--color-text-tertiary)' }}>{group.articles.length}</span>
                    </a>
                  )
                })}
              </nav>
            )}

            {/* D. Preguntas frecuentes: una tarjeta por categoría */}
            <div className="flex flex-col gap-7">
              {groups.map(group => {
                const Icon = GROUP_ICONS[group.id] ?? FileText
                return (
                  <section
                    key={group.id}
                    id={`categoria-${group.id}`}
                    aria-labelledby={`categoria-titulo-${group.id}`}
                    className="scroll-mt-24"
                  >
                    <h2 id={`categoria-titulo-${group.id}`} className="flex items-center gap-2.5 mb-3">
                      <span className="flex items-center justify-center w-8 h-8 flex-shrink-0" style={{ background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', borderRadius: 'var(--radius-pill)' }} aria-hidden="true">
                        <Icon size={16} />
                      </span>
                      <span className="text-h3 font-bold" style={{ color: 'var(--color-blue-dark)' }}>{groupLabel(group)}</span>
                      <span className="text-caption font-medium" style={{ color: 'var(--color-text-tertiary)' }}>{countLabel(group.articles.length)}</span>
                    </h2>
                    <div className={`overflow-hidden ${DIVIDED}`} style={CARD_STYLE}>
                      {group.articles.map(article => (
                        <HelpArticleItem key={article.id} article={article} isOpen={open.has(article.slug)} onToggle={toggle} />
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          </>
        )}

        {/* E. ¿No encontraste lo que buscabas? → soporte */}
        {!loadFailed && (
          <section className="mt-10 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4" style={CARD_STYLE}>
            <span className="flex items-center justify-center w-12 h-12 flex-shrink-0" style={{ background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', borderRadius: 'var(--radius-pill)' }} aria-hidden="true">
              <LifeBuoy size={22} />
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="text-h4 font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t('helpCenterStillNeedHelpTitle')}</h2>
              <p className="text-ui mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{t('helpCenterStillNeedHelpText')}</p>
            </div>
            <a
              href="/soporte"
              className={`inline-flex items-center justify-center gap-1.5 min-h-[44px] px-5 text-ui font-semibold no-underline transition-colors hover:bg-[color:var(--color-primary-hover)] ${FOCUS_RING}`}
              style={{ background: 'var(--color-primary)', color: 'var(--color-card-bg)', borderRadius: 'var(--radius-control)' }}
            >
              {t('helpCenterContactSupportCta')}
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </section>
        )}

        {/* F. Sobre MercadoRD — secundario, más discreto que las FAQ */}
        {!loadFailed && hasAboutArticles && (!searching || aboutArticles.length > 0) && (
          <section id="sobre-mercadord" aria-labelledby="sobre-mercadord-titulo" className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 mb-2">
              <h2 id="sobre-mercadord-titulo" className="text-h4 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                {t('helpCenterAboutTitle')}
              </h2>
              <a
                href="/acerca-de"
                className={`inline-flex items-center gap-0.5 min-h-[44px] text-ui font-semibold no-underline hover:underline ${FOCUS_RING}`}
                style={{ color: 'var(--color-primary)', borderRadius: 'var(--radius-control)' }}
              >
                {t('helpCenterAboutLink')}
                <ChevronRight size={16} aria-hidden="true" />
              </a>
            </div>
            <div
              className={`overflow-hidden ${DIVIDED}`}
              style={{ border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-card)', background: 'var(--color-card-bg)' }}
            >
              {aboutArticles.map(article => (
                <HelpArticleItem key={article.id} article={article} isOpen={open.has(article.slug)} onToggle={toggle} variant="subtle" />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
