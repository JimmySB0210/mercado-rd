'use client'
// ============================================================
// MercadoRD — Contenido de /soporte
// Ruta: src/app/soporte/SoporteContent.tsx
// ============================================================
// page.tsx (Server Component) trae las preguntas frecuentes y el número
// de WhatsApp; aquí viven el estado (búsqueda, tipo de problema) y el
// layout. Soporte resuelve casos concretos y contacta con el equipo; la
// documentación vive en /centro-ayuda.
//
// Tarjetas: las de enlace llevan a rutas reales (/perfil/pedidos con el
// motivo de disputa ya resuelto, que DisputeModal trae preseleccionado);
// las de botón eligen el tipo de problema y bajan al formulario.
// ============================================================

import { useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight, ChevronRight, CircleHelp, ClipboardList, CreditCard, EyeOff, Headset, Info, Lock, Package,
  PackageMinus, RotateCcw, Scale, Search, SearchX, Store, Truck, TriangleAlert, UserRound, X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { filterHelpArticles, normalizeForSearch } from '@/lib/helpCenter'
import { HelpArticleItem } from '@/components/help/HelpArticleItem'
import { SupportCard, CARD_STYLE, DIVIDED, FOCUS_RING } from '@/components/soporte/SupportCard'
import { SupportForm, ISSUE_TYPE_KEYS } from '@/components/soporte/SupportForm'
import { SupportSidePanel } from '@/components/soporte/SupportSidePanel'
import type { SupportDict } from '@/lib/i18n/es/support'
import type { HelpArticle } from '@/types/database.types'

interface CardDef {
  id: string
  titleKey: keyof SupportDict
  textKey: keyof SupportDict
  icon: LucideIcon
  // Enlace (href exacto) o tipo de problema del formulario
  href?: string
  issue?: keyof SupportDict
}

const QUICK_CARDS: CardDef[] = [
  { id: 'pedidos', titleKey: 'supportCardOrdersTitle', textKey: 'supportCardOrdersText', icon: Truck, href: '/perfil/pedidos' },
  { id: 'devoluciones', titleKey: 'supportCardReturnsTitle', textKey: 'supportCardReturnsText', icon: RotateCcw, href: '/perfil/pedidos?reason=refund_request' },
  { id: 'pagos', titleKey: 'supportCardPaymentsTitle', textKey: 'supportCardPaymentsText', icon: CreditCard, issue: 'issuePaymentProblem' },
  { id: 'cuenta', titleKey: 'supportCardAccountTitle', textKey: 'supportCardAccountText', icon: UserRound, href: '/perfil' },
]

const REASON_CARDS: CardDef[] = [
  { id: 'no-recibido', titleKey: 'issueNotReceived', textKey: 'supportCardNotReceivedText', icon: Package, issue: 'issueNotReceived' },
  { id: 'danado', titleKey: 'supportCardDamagedTitle', textKey: 'supportCardDamagedText', icon: TriangleAlert, href: '/perfil/pedidos?reason=damaged' },
  { id: 'falta-articulo', titleKey: 'supportCardMissingItemTitle', textKey: 'supportCardMissingItemText', icon: PackageMinus, href: '/perfil/pedidos?reason=wrong_item' },
  { id: 'descripcion', titleKey: 'categoryNotAsDescribedTitle', textKey: 'supportCardNotAsDescribedText', icon: ClipboardList, href: '/perfil/pedidos?reason=not_as_described' },
  { id: 'vendedor', titleKey: 'issueSellerProblem', textKey: 'supportCardSellerText', icon: Store, issue: 'issueSellerProblem' },
  { id: 'cargos-ocultos', titleKey: 'categoryHiddenChargesTitle', textKey: 'supportCardHiddenChargesText', icon: EyeOff, issue: 'issueHiddenCharges' },
  { id: 'problema-cuenta', titleKey: 'issueAccountProblem', textKey: 'supportCardAccountProblemText', icon: Lock, issue: 'issueAccountProblem' },
  { id: 'disputa', titleKey: 'supportCardDisputeTitle', textKey: 'supportCardDisputeText', icon: Scale, href: '/perfil/pedidos' },
]

const CARD_GRID = 'grid grid-cols-1 sm:grid-cols-2 min-[1360px]:grid-cols-4 gap-3'

interface Props {
  whatsappNumber: string
  faqs: HelpArticle[]
}

export function SoporteContent({ whatsappNumber, faqs }: Props) {
  const { t, language } = useTranslation('support')
  const [query, setQuery] = useState('')
  const [issueType, setIssueType] = useState<keyof SupportDict>(ISSUE_TYPE_KEYS[0])
  // Tarjeta resaltada: null al cargar, para no marcar la del tipo por defecto
  const [selectedIssue, setSelectedIssue] = useState<keyof SupportDict | null>(null)
  const [openFaqs, setOpenFaqs] = useState<Set<string>>(new Set())
  const nameInputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const searching = query.trim().length > 0

  // Misma regla que filterHelpArticles: todas las palabras deben aparecer
  // (sin importar tildes ni mayúsculas), aquí en título + descripción
  // traducidos de cada tarjeta.
  const matchesCard = useMemo(() => {
    const terms = normalizeForSearch(query).split(/\s+/).filter(Boolean)
    return (card: CardDef) => {
      if (terms.length === 0) return true
      const haystack = normalizeForSearch(`${t(card.titleKey)} ${t(card.textKey)}`)
      return terms.every(term => haystack.includes(term))
    }
  }, [query, t])

  const quickCards = QUICK_CARDS.filter(matchesCard)
  const reasonCards = REASON_CARDS.filter(matchesCard)
  const visibleFaqs = useMemo(() => filterHelpArticles(faqs, query), [faqs, query])
  const totalMatches = quickCards.length + reasonCards.length + visibleFaqs.length
  const noResults = searching && totalMatches === 0

  const scrollToForm = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById('formulario-soporte')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    nameInputRef.current?.focus({ preventScroll: true })
  }

  const selectIssue = (issue: keyof SupportDict) => {
    setIssueType(issue)
    setSelectedIssue(issue)
    scrollToForm()
  }

  const handleIssueTypeChange = (issue: keyof SupportDict) => {
    setIssueType(issue)
    setSelectedIssue(issue)
  }

  const toggleFaq = (slug: string) => {
    setOpenFaqs(prev => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  // "Buscar" / Enter: el filtro ya es en vivo; solo lleva el foco a los resultados
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    resultsRef.current?.focus()
  }

  const renderCard = (card: CardDef) => (
    <SupportCard
      key={card.id}
      title={t(card.titleKey)}
      text={t(card.textKey)}
      icon={card.icon}
      href={card.href}
      onSelect={card.issue ? () => selectIssue(card.issue!) : undefined}
      selected={!!card.issue && selectedIssue === card.issue}
    />
  )

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 md-860:py-8">
      {/* Encabezado */}
      <nav className="text-small mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
        <a href="/" className={`no-underline hover:underline ${FOCUS_RING}`} style={{ color: 'var(--color-text-secondary)' }}>{t('breadcrumbHome')}</a>
        <span className="mx-2" aria-hidden="true">/</span>
        <span aria-current="page">{t('breadcrumbCurrent')}</span>
      </nav>
      <h1 className="text-h1 font-bold" style={{ color: 'var(--color-blue-dark)', letterSpacing: 'var(--tracking-heading)' }}>
        {t('breadcrumbCurrent')}
      </h1>
      <p className="text-body mt-1 text-balance" style={{ color: 'var(--color-text-secondary)' }}>{t('supportSubtitle')}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
        {/* Columna principal */}
        <div className="flex flex-col gap-6 min-w-0">
          {/* Banner superior */}
          <div
            className="relative overflow-hidden flex items-stretch"
            style={{ background: 'var(--color-primary-subtle)', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-card)' }}
          >
            <div className="relative z-10 flex items-center gap-4 sm:gap-5 flex-1 min-w-0 p-4 sm:p-6">
              <span
                className="flex items-center justify-center flex-shrink-0 w-16 h-16 sm:w-[72px] sm:h-[72px] text-white"
                style={{ background: 'var(--color-primary)', borderRadius: 'var(--radius-pill)' }}
                aria-hidden="true"
              >
                <Headset size={32} />
              </span>
              <div className="min-w-0">
                <p className="text-h3 font-bold" style={{ color: 'var(--color-blue-dark)' }}>{t('supportBannerTitle')}</p>
                <p className="text-body mt-1" style={{ color: 'var(--color-text-secondary)' }}>{t('supportBannerText')}</p>
              </div>
            </div>

            <div className="relative hidden sm:flex items-end flex-shrink-0 pt-2 pr-4 lg:pr-8" aria-hidden="true">
              <span
                className="absolute left-1/2 -translate-x-1/2 -bottom-32 w-64 h-64 rounded-full pointer-events-none"
                style={{ background: 'color-mix(in srgb, var(--color-card-bg) 60%, transparent)' }}
              />
              <span
                className="absolute -left-3 top-3 w-12 h-12 rounded-full pointer-events-none"
                style={{ background: 'color-mix(in srgb, var(--color-card-bg) 55%, transparent)' }}
              />
              <Image
                src="/images/soporte-agente.webp"
                alt=""
                width={480}
                height={372}
                sizes="145px"
                draggable={false}
                className="relative block h-[112px] w-auto pointer-events-none select-none"
              />
            </div>
          </div>

          {/* Buscador */}
          <form role="search" onSubmit={handleSearchSubmit}>
            <div
              className="flex items-center gap-2 h-14 pl-4 pr-1.5 focus-within:ring-2 focus-within:ring-[color:var(--color-primary)]"
              style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', boxShadow: 'var(--shadow-card)' }}
            >
              <Search size={20} aria-hidden="true" className="flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
              <input
                type="text"
                inputMode="search"
                enterKeyHint="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('supportSearchPlaceholder')}
                aria-label={t('supportSearchAria')}
                className="flex-1 min-w-0 h-full text-ui sm:text-body text-ellipsis bg-transparent border-none focus:outline-none"
                style={{ color: 'var(--color-text-primary)' }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label={t('helpCenterClearSearchAria')}
                  className={`flex items-center justify-center flex-shrink-0 w-11 h-11 bg-transparent border-none cursor-pointer hover:!bg-[color:var(--color-bg-main)] ${FOCUS_RING}`}
                  style={{ color: 'var(--color-text-secondary)', borderRadius: 'var(--radius-control)' }}
                >
                  <X size={18} aria-hidden="true" />
                </button>
              )}
              <button
                type="submit"
                aria-label={t('supportSearchButton')}
                className={`flex items-center justify-center gap-2 flex-shrink-0 h-11 min-w-[44px] px-3 sm:px-5 text-ui font-semibold border-none cursor-pointer transition-colors hover:!bg-[color:var(--color-primary-hover)] ${FOCUS_RING}`}
                style={{ background: 'var(--color-primary)', color: 'var(--color-card-bg)', borderRadius: 'var(--radius-control)' }}
              >
                <Search size={18} aria-hidden="true" />
                <span className="hidden sm:inline">{t('supportSearchButton')}</span>
              </button>
            </div>
          </form>

          {/* Resultados: el foco llega aquí con "Buscar" / Enter */}
          <div ref={resultsRef} tabIndex={-1} className="flex flex-col gap-6 focus:outline-none">
            {searching && !noResults && (
              <p className="text-ui -mb-2" role="status" style={{ color: 'var(--color-text-secondary)' }}>
                {totalMatches === 1
                  ? t('helpCenterResultsOne', { query: query.trim() })
                  : t('helpCenterResultsMany', { count: totalMatches, query: query.trim() })}
              </p>
            )}

            {noResults && (
              <div className="p-8 text-center" style={CARD_STYLE} role="status">
                <span className="inline-flex items-center justify-center w-12 h-12 mb-3" style={{ background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', borderRadius: 'var(--radius-pill)' }} aria-hidden="true">
                  <SearchX size={22} />
                </span>
                <p className="text-h4 font-semibold mb-1 break-words" style={{ color: 'var(--color-text-primary)' }}>{t('supportNoResultsTitle', { query: query.trim() })}</p>
                <p className="text-ui mb-4" style={{ color: 'var(--color-text-secondary)' }}>{t('supportNoResultsHint')}</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className={`inline-flex items-center justify-center min-h-[44px] px-5 text-ui font-semibold cursor-pointer transition-colors hover:!bg-[color:var(--color-primary-subtle)] ${FOCUS_RING}`}
                    style={{ color: 'var(--color-primary)', background: 'var(--color-card-bg)', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-control)' }}
                  >
                    {t('helpCenterClearSearchAria')}
                  </button>
                  <button
                    type="button"
                    onClick={scrollToForm}
                    className={`inline-flex items-center justify-center gap-1.5 min-h-[44px] px-5 text-ui font-semibold border-none cursor-pointer transition-colors hover:!bg-[color:var(--color-primary-hover)] ${FOCUS_RING}`}
                    style={{ background: 'var(--color-primary)', color: 'var(--color-card-bg)', borderRadius: 'var(--radius-control)' }}
                  >
                    {t('helpCenterContactSupportCta')}
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            {/* Accesos rápidos */}
            {quickCards.length > 0 && (
              <section aria-labelledby="soporte-accesos">
                <h2 id="soporte-accesos" className="sr-only">{t('supportQuickAccessTitle')}</h2>
                <div className={CARD_GRID}>{quickCards.map(renderCard)}</div>
              </section>
            )}

            {/* Cuéntanos qué ocurrió: motivos + formulario (el formulario siempre visible) */}
            <section aria-labelledby={reasonCards.length > 0 ? 'soporte-que-ocurrio' : undefined} className="flex flex-col gap-4">
              {reasonCards.length > 0 && (
                <>
                  <div>
                    <h2 id="soporte-que-ocurrio" className="text-h3 font-bold" style={{ color: 'var(--color-blue-dark)' }}>{t('supportWhatHappenedTitle')}</h2>
                    <p className="text-ui mt-1" style={{ color: 'var(--color-text-secondary)' }}>{t('supportWhatHappenedText')}</p>
                  </div>
                  <div className={CARD_GRID}>{reasonCards.map(renderCard)}</div>
                </>
              )}
              <SupportForm
                ref={nameInputRef}
                whatsappNumber={whatsappNumber}
                issueType={issueType}
                onIssueTypeChange={handleIssueTypeChange}
              />
            </section>

            {/* Preguntas frecuentes (artículos reales del Centro de ayuda) */}
            {visibleFaqs.length > 0 && (
              <section aria-labelledby="soporte-faq">
                <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 mb-3">
                  <div className="min-w-0">
                    <h2 id="soporte-faq" className="text-h3 font-bold" style={{ color: 'var(--color-blue-dark)' }}>{t('supportFaqTitle')}</h2>
                    <p className="text-ui mt-1" style={{ color: 'var(--color-text-secondary)' }}>{t('supportFaqText')}</p>
                  </div>
                  <Link
                    href="/centro-ayuda"
                    className={`inline-flex items-center gap-0.5 min-h-[44px] text-ui font-semibold no-underline hover:underline ${FOCUS_RING}`}
                    style={{ color: 'var(--color-primary)', borderRadius: 'var(--radius-control)' }}
                  >
                    {t('supportFaqViewAll')}
                    <ChevronRight size={16} aria-hidden="true" />
                  </Link>
                </div>
                {language !== 'es' && (
                  <p className="flex items-start gap-2 mb-3 text-small" style={{ color: 'var(--color-text-secondary)' }}>
                    <Info size={16} aria-hidden="true" className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                    {t('helpCenterSpanishOnlyNotice')}
                  </p>
                )}
                <div className={`overflow-hidden ${DIVIDED}`} style={CARD_STYLE}>
                  {visibleFaqs.map(article => (
                    <HelpArticleItem key={article.id} article={article} isOpen={openFaqs.has(article.slug)} onToggle={toggleFaq} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Panel lateral: en < 1024 px queda después de las FAQ */}
        <SupportSidePanel onContact={scrollToForm} />
      </div>

      {/* Banner inferior */}
      <div
        className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4 p-5 sm:p-6"
        style={{ background: 'var(--color-primary-subtle)', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-card)' }}
      >
        <span
          className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-white"
          style={{ background: 'var(--color-primary)', borderRadius: 'var(--radius-pill)' }}
          aria-hidden="true"
        >
          <CircleHelp size={24} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-h4 font-bold" style={{ color: 'var(--color-blue-dark)' }}>{t('supportBottomTitle')}</p>
          <p className="text-ui mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{t('supportBottomText')}</p>
        </div>
        <a
          href="#formulario-soporte"
          onClick={e => { e.preventDefault(); scrollToForm() }}
          className={`inline-flex items-center justify-center gap-1.5 flex-shrink-0 min-h-[44px] px-5 text-ui font-semibold no-underline transition-colors hover:!bg-[color:var(--color-primary-hover)] ${FOCUS_RING}`}
          style={{ background: 'var(--color-primary)', color: 'var(--color-card-bg)', borderRadius: 'var(--radius-control)' }}
        >
          {t('helpCenterContactSupportCta')}
          <ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>
    </div>
  )
}
