import type { CSSProperties } from 'react'

// Escala tipográfica. Los valores viven en globals.css (--text-*, --leading-*);
// aquí solo se referencian para usarlos en estilos inline.
export const TEXT = {
  caption: { fontSize: 'var(--text-caption)', lineHeight: 'var(--leading-caption)' },
  small: { fontSize: 'var(--text-small)', lineHeight: 'var(--leading-small)' },
  ui: { fontSize: 'var(--text-ui)' },
  body: { fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)' },
  h4: { fontSize: 'var(--text-h4)', lineHeight: 'var(--leading-h4)' },
  h3: { fontSize: 'var(--text-h3)', lineHeight: 'var(--leading-h3)' },
  h2: { fontSize: 'var(--text-h2)', lineHeight: 'var(--leading-h2)' },
  h1: { fontSize: 'var(--text-h1)', lineHeight: 'var(--leading-h1)' },
  display: { fontSize: 'var(--text-display)', lineHeight: 'var(--leading-display)' },
  priceCard: { fontSize: 'var(--text-price-card)', lineHeight: 'var(--leading-price)' },
  price: { fontSize: 'var(--text-price)', lineHeight: 'var(--leading-price)' },
  priceDetail: { fontSize: 'var(--text-price-detail)', lineHeight: 'var(--leading-price-detail)' },
} satisfies Record<string, CSSProperties>
