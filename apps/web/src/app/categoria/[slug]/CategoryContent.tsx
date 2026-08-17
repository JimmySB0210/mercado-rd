'use client'
// ============================================================
// MercadoRD — Contenido traducido de /categoria/[slug]
// Ruta: src/app/categoria/[slug]/CategoryContent.tsx
// ============================================================
// page.tsx es un Server Component y no puede usar useTranslation.
// Este componente recibe la categoría/productos ya resueltos y se
// encarga de todo el texto traducido.
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'
import { ProductCard } from '@/components/product/ProductCard'
import type { ProductWithVendor } from '@/types/database.types'

interface Props {
  title: string | null
  emoji: string
  products: ProductWithVendor[]
}

export function CategoryContent({ title, emoji, products }: Props) {
  const { t } = useTranslation('categories')
  const resolvedTitle = title ?? t('defaultCategoryTitle')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <nav className="text-sm text-gray-400 mb-4">
        <a href="/" className="hover:text-gray-600 transition-colors no-underline">{t('breadcrumbHome')}</a>
        <span className="mx-2">/</span>
        <span className="text-gray-600">{resolvedTitle}</span>
      </nav>

      <h1
        className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1"
        style={{ fontFamily: 'var(--font-heading)', letterSpacing: 'var(--tracking-heading)' }}
      >
        {emoji} {resolvedTitle}
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
        {t('productsFoundCount', { count: products.length })}
      </p>

      {products.length === 0 ? (
        <div
          className="bg-[var(--color-card-bg)] p-12 text-center"
          style={{ borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="text-5xl mb-4">📦</div>
          <p className="text-gray-500">{t('noProductsEmptyState')}</p>
          <a href="/" className="text-blue-600 underline mt-4 inline-block text-sm">
            {t('backToHome')}
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {products.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

    </div>
  )
}
