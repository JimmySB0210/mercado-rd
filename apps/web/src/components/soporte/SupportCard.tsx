// ============================================================
// MercadoRD — Tarjeta de acceso de /soporte
// Ruta: src/components/soporte/SupportCard.tsx
// ============================================================
// Dos variantes con el mismo aspecto: enlace (next/link, href exacto)
// o botón que elige un tipo de problema del formulario (aria-pressed).
// También exporta los estilos compartidos de la página de Soporte
// (copiados del Centro de ayuda, donde no están exportados).
// ============================================================

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2'
export const CARD_STYLE: React.CSSProperties = {
  background: 'var(--color-card-bg)',
  border: '1px solid var(--color-divider)',
  borderRadius: 'var(--radius-card)',
  boxShadow: 'var(--shadow-card)',
}
export const DIVIDED = 'divide-y divide-[color:var(--color-divider)]'

interface Props {
  title: string
  text: string
  icon: LucideIcon
  href?: string
  onSelect?: () => void
  selected?: boolean
}

export function SupportCard({ title, text, icon: Icon, href, onSelect, selected = false }: Props) {
  const className = `flex items-center gap-3 w-full h-full min-h-[72px] p-4 text-left no-underline cursor-pointer transition-colors [box-shadow:var(--shadow-card)] hover:!border-[color:var(--color-primary)] min-[1360px]:flex-wrap min-[1360px]:items-start min-[1360px]:content-start ${FOCUS_RING}`
  const style: React.CSSProperties = {
    ...CARD_STYLE,
    boxShadow: undefined, // la sombra va por clase: un box-shadow en línea taparía el anillo de foco
    ...(selected ? { background: 'var(--color-primary-subtle)', border: '1px solid var(--color-primary)' } : null),
  }
  const content = (
    <>
      <span
        className="flex items-center justify-center flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 min-[1360px]:order-1"
        style={{ background: selected ? 'var(--color-card-bg)' : 'var(--color-primary-subtle)', color: 'var(--color-primary)', borderRadius: 'var(--radius-pill)' }}
        aria-hidden="true"
      >
        <Icon size={20} />
      </span>
      <span className="flex-1 min-w-0 min-[1360px]:order-3 min-[1360px]:basis-full">
        <span className="block text-ui font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</span>
        <span className="block text-small mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{text}</span>
      </span>
      <ChevronRight size={18} aria-hidden="true" className="flex-shrink-0 min-[1360px]:order-2 min-[1360px]:ml-auto" style={{ color: 'var(--color-text-tertiary)' }} />
    </>
  )

  if (href) {
    return <Link href={href} className={className} style={style}>{content}</Link>
  }
  return (
    <button type="button" onClick={onSelect} aria-pressed={selected} className={className} style={style}>
      {content}
    </button>
  )
}
