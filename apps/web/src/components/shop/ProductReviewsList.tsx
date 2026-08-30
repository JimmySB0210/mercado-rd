'use client'
// ============================================================
// MercadoRD — Reseñas del producto (contenido traducido + expandir)
// Ruta: src/components/shop/ProductReviewsList.tsx
// ============================================================
// ProductReviews.tsx es un Server Component (fetch a Supabase) y no
// puede usar useTranslation. Este componente recibe las reseñas ya
// resueltas, muestra las primeras 5 y revela el resto con un botón,
// en vez de una lista larga de una sola vez.
// ============================================================

import { useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { formatDate } from '@/lib/utils'

export interface ReviewViewModel {
  id: string
  rating: number
  comment: string | null
  createdAt: string | null
  buyerName: string | null
}

const INITIAL_COUNT = 5

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} style={{ color: n <= value ? '#F5A200' : '#ddd', fontSize: 14 }}>★</span>
      ))}
    </div>
  )
}

export function ProductReviewsList({ reviews }: { reviews: ReviewViewModel[] }) {
  const { t, language } = useTranslation('products')
  const [showAll, setShowAll] = useState(false)

  const visible = showAll ? reviews : reviews.slice(0, INITIAL_COUNT)

  return (
    <section className="mt-16">
      <h2 className="text-xl font-bold text-gray-900 mb-6">{t('reviewsHeading')}</h2>

      {reviews.length === 0 ? (
        <div
          className="bg-[var(--color-card-bg)] p-8 text-center"
          style={{ borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
        >
          <p className="text-sm text-gray-500">{t('noReviewsYet')}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {visible.map(r => (
              <div
                key={r.id}
                className="bg-[var(--color-card-bg)] p-4"
                style={{ borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)' }}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{r.buyerName ?? t('defaultReviewerName')}</span>
                    <span className="text-xs font-medium" style={{ color: 'var(--color-success)' }}>
                      {t('verifiedPurchaseBadge')}
                    </span>
                  </div>
                  {r.createdAt && (
                    <span className="text-xs text-gray-400">
                      {formatDate(r.createdAt, language, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
                <Stars value={r.rating} />
                {r.comment && (
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.comment}</p>
                )}
              </div>
            ))}
          </div>

          {!showAll && reviews.length > INITIAL_COUNT && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-4 text-sm font-semibold hover:underline"
              style={{ color: 'var(--color-primary)' }}
            >
              {t('showMoreReviewsButton')}
            </button>
          )}
        </>
      )}
    </section>
  )
}
