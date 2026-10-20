// ============================================================
// MercadoRD — Fila desplegable de un artículo del Centro de ayuda
// Ruta: src/components/help/HelpArticleItem.tsx
// ============================================================
// Una fila por artículo dentro de la tarjeta de su categoría. El id del
// contenedor es el slug del artículo: /centro-ayuda#<slug> lo abre y
// desplaza hasta aquí (scroll-margin para que no quede pegado arriba).
//
// El contenido es texto plano de la base: un <p> por párrafo (React
// escapa el texto, nunca se inyecta HTML).
// ============================================================

import { ChevronDown } from 'lucide-react'
import { splitParagraphs } from '@/lib/helpCenter'
import type { HelpArticle } from '@/types/database.types'

interface Props {
  article: HelpArticle
  isOpen: boolean
  onToggle: (slug: string) => void
  // 'subtle': filas de "Sobre MercadoRD", más discretas que las FAQ
  variant?: 'faq' | 'subtle'
}

export function HelpArticleItem({ article, isOpen, onToggle, variant = 'faq' }: Props) {
  const titleId = `articulo-titulo-${article.slug}`
  const panelId = `articulo-panel-${article.slug}`
  const subtle = variant === 'subtle'

  return (
    <div id={article.slug} className="scroll-mt-24">
      <h3 className="m-0">
        <button
          type="button"
          id={titleId}
          aria-expanded={isOpen}
          aria-controls={isOpen ? panelId : undefined}
          onClick={() => onToggle(article.slug)}
          className="flex w-full items-center justify-between gap-4 min-h-[52px] px-4 sm:px-5 py-3 text-left bg-transparent border-none cursor-pointer transition-colors hover:bg-[color:var(--color-bg-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--color-primary)]"
        >
          <span
            className={subtle ? 'text-ui font-medium' : 'text-body font-semibold'}
            style={{ color: isOpen && !subtle ? 'var(--color-primary)' : subtle ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}
          >
            {article.title}
          </span>
          <ChevronDown
            size={18}
            aria-hidden="true"
            className={`flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            style={{ color: isOpen ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }}
          />
        </button>
      </h3>

      {isOpen && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={titleId}
          className="px-4 sm:px-5 pb-5 pt-1 space-y-3 max-w-[68ch]"
        >
          {splitParagraphs(article.content).map((paragraph, i) => (
            <p
              key={i}
              className={`m-0 ${subtle ? 'text-ui' : 'text-body'}`}
              style={{ whiteSpace: 'pre-line', lineHeight: 1.65, color: 'var(--color-text-secondary)' }}
            >
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
