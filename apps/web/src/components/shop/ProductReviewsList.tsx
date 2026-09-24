'use client'
// ============================================================
// MercadoRD — Reseñas del producto (contenido traducido + expandir)
// Ruta: src/components/shop/ProductReviewsList.tsx
// ============================================================
// ProductReviews.tsx es un Server Component (fetch a Supabase) y no
// puede usar useTranslation. Este componente recibe las reseñas ya
// resueltas, muestra las primeras 5 y revela el resto con un botón,
// en vez de una lista larga de una sola vez.
//
// Vive dentro de la pestaña "Reseñas" de ProductTabs (el título y el
// conteo ya los muestra la propia pestaña) — por eso no trae su propio
// <h2>. El desglose por estrella se calcula acá mismo con las reseñas
// que ya llegaron completas desde el Server Component — no es una
// consulta nueva, es el mismo array agregado distinto.
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

// Desglose real por estrella — sobre el array completo (reviews), no
// sobre `visible` (que solo son las primeras 5 antes de "Ver más").
function RatingBreakdown({ reviews }: { reviews: ReviewViewModel[] }) {
  const total = reviews.length
  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / total
  const counts = [5, 4, 3, 2, 1].map(stars => reviews.filter(r => r.rating === stars).length)

  return (
    <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 mb-6 pb-6 border-b border-gray-100">
      <div className="flex flex-col items-center sm:items-start flex-shrink-0">
        <span className="text-4xl font-bold text-gray-900">{average.toFixed(1)}</span>
        <Stars value={Math.round(average)} />
      </div>
      <div className="flex-1 flex flex-col gap-1.5 max-w-sm">
        {[5, 4, 3, 2, 1].map((stars, i) => {
          const count = counts[i]
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={stars} className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-10 flex-shrink-0">{stars} ★</span>
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#F5A200' }} />
              </div>
              <span className="w-14 flex-shrink-0 text-right">{pct}% ({count})</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ProductReviewsList({ reviews }: { reviews: ReviewViewModel[] }) {
  const { t, language } = useTranslation('products')
  const [showAll, setShowAll] = useState(false)

  const visible = showAll ? reviews : reviews.slice(0, INITIAL_COUNT)

  return (
    <div>
      {reviews.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">{t('noReviewsYet')}</p>
      ) : (
        <>
          <RatingBreakdown reviews={reviews} />
          <div className="flex flex-col gap-3">
            {visible.map(r => (
              <div
                key={r.id}
                className="p-4 border border-gray-100"
                style={{ borderRadius: 'var(--radius-control)' }}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{r.buyerName ?? t('defaultReviewerName')}</span>
                    <span className="text-xs font-medium" style={{ color: 'var(--color-green)' }}>
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
    </div>
  )
}
