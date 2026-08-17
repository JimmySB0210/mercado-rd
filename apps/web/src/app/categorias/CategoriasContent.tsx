'use client'
// ============================================================
// MercadoRD — Contenido traducido de /categorias
// Ruta: src/app/categorias/CategoriasContent.tsx
// ============================================================
// page.tsx es un Server Component (fetch directo a Supabase, cacheable
// con ISR) y no puede usar useTranslation (hook de cliente). Este
// componente recibe los datos ya resueltos como prop y se encarga de
// todo el texto traducido.
// ============================================================

import { useTranslation } from '@/lib/hooks/useTranslation'
import { getCategoryIcon } from '@/lib/categoryIcons'

interface CategoryRow {
  id: number
  name: string
  slug: string
  emoji: string
  storeCount: number
}

export function CategoriasContent({ categories }: { categories: CategoryRow[] }) {
  const { t } = useTranslation('categories')
  const count = categories.length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <nav className="text-sm text-gray-400 mb-4">
        <a href="/" className="hover:text-gray-600 transition-colors no-underline">{t('breadcrumbHome')}</a>
        <span className="mx-2">/</span>
        <span className="text-gray-600">{t('breadcrumbCurrent')}</span>
      </nav>

      <h1
        className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1"
        style={{ fontFamily: 'var(--font-heading)', letterSpacing: 'var(--tracking-heading)' }}
      >
        {t('pageTitle')}
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
        {count === 1 ? t('categoryCountOne', { count }) : t('categoryCountOther', { count })}
      </p>

      {categories.length === 0 ? (
        <div
          className="bg-[var(--color-card-bg)] p-12 text-center"
          style={{ borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="text-5xl mb-4">📂</div>
          <p className="text-gray-500">{t('noCategoriesEmptyState')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map(c => {
            const Icon = getCategoryIcon(c.name)
            return (
              <a
                key={c.id}
                href={`/categoria/${c.slug}`}
                className="bg-[var(--color-card-bg)] border border-[var(--color-border)] [box-shadow:var(--shadow-card)] hover:[box-shadow:var(--shadow-card-hover)] hover:-translate-y-0.5 p-5 flex flex-col items-center text-center gap-2 no-underline"
                style={{ borderRadius: 'var(--radius-card)', transition: 'box-shadow var(--transition-base), transform var(--transition-base)' }}
              >
                <Icon size={40} color="var(--color-primary)" strokeWidth={1.5} style={{ marginBottom: 4 }} />
                <span className="text-sm font-semibold text-gray-900">{c.name}</span>
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {c.storeCount === 1
                    ? t('storeCountOne', { count: c.storeCount })
                    : t('storeCountOther', { count: c.storeCount })}
                </span>
              </a>
            )
          })}
        </div>
      )}

    </div>
  )
}
