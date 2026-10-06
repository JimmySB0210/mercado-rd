'use client'
// ============================================================
// MercadoRD — Reseñas (vendor dashboard)
// Ruta: src/app/dashboard/resenas/page.tsx
// ============================================================
// Lectura: reviews del vendedor (con producto y nombre del comprador,
// que RLS solo deja ver con conversación; si no, "Cliente"),
// vendor_real_stats para promedio y total, y get_vendor_rating_breakdown
// (vía useVendorRatingBreakdown) para la distribución. Todo es solo
// lectura: no hay respuesta del vendedor ni acciones sobre reseñas.
// "Tendencia" solo aparece con al menos 5 reseñas y reseñas en los 30
// días anteriores y en los 30 previos a esos.
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BadgeCheck, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DashboardSidebar } from '@/components/vendor/DashboardSidebar'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useVendorRatingBreakdown } from '@/lib/hooks/useVendorRatingBreakdown'
import { formatDate } from '@/lib/utils'
import { formatPrice } from '@/types/database.types'

const STAR_COLOR = '#F5A200'
const MIN_TREND_SAMPLE = 5
const DAY_MS = 86_400_000

const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(10,30,60,0.06)', border: '1px solid #EEF2F6',
}

interface ReviewRow {
  id: string
  rating: number
  comment: string | null
  created_at: string
  order_id: string | null
  product_id: string
  product_name: string
  product_price: number | null
  product_image: string | null
  buyer_name: string | null
}

interface RealStats {
  avg: number | null
  count: number
}

type StarFilter = 'all' | 1 | 2 | 3 | 4 | 5
type SortOrder = 'recent' | 'oldest'

export default function VendorReviewsPage() {
  const { t } = useTranslation('dashboard')
  const router = useRouter()
  const supabase = createClient()

  const [vendorId, setVendorId] = useState<string | null>(null)
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [realStats, setRealStats] = useState<RealStats>({ avg: null, count: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/dashboard/resenas')
        return
      }

      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!vendor) {
        router.push('/vendor/register')
        return
      }

      const [reviewsRes, statsRes] = await Promise.all([
        supabase
          .from('reviews')
          .select('id, rating, comment, created_at, order_id, product_id, product:products(id, name, price_rdp, images), buyer:users(full_name)')
          .eq('vendor_id', vendor.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('vendor_real_stats')
          .select('real_rating_avg, real_rating_count')
          .eq('vendor_id', vendor.id)
          .maybeSingle(),
      ])

      if (reviewsRes.error) {
        console.error('[VendorReviews]', reviewsRes.error)
        setReviews([])
      } else {
        setReviews((reviewsRes.data ?? []).map((r: any) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          order_id: r.order_id ?? null,
          product_id: r.product_id,
          product_name: r.product?.name ?? 'Producto',
          product_price: r.product?.price_rdp ?? null,
          product_image: r.product?.images?.[0] ?? null,
          buyer_name: r.buyer?.full_name ?? null,
        })))
      }

      if (statsRes.error) console.error('[VendorReviews stats]', statsRes.error)
      setRealStats({
        avg: statsRes.data?.real_rating_avg != null ? Number(statsRes.data.real_rating_avg) : null,
        count: Number(statsRes.data?.real_rating_count ?? 0),
      })
      setVendorId(vendor.id)
      setLoading(false)
    }
    load()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">{t('loadingGeneric')}</div>
      </div>
    )
  }

  return (
    <div className="dashboard-grid" style={{ minHeight: '100vh', fontFamily: 'inherit' }}>

      <DashboardSidebar />

      <main style={{ padding: 24, background: '#F7F9FB', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-dash-title)', fontWeight: 700, lineHeight: 'var(--leading-h1)', color: '#131A18', margin: 0 }}>{t('reviewsPageTitle')}</h1>
            <p style={{ color: '#667085', fontSize: 'var(--text-ui)', margin: '4px 0 0' }}>{t('reviewsPageSub')}</p>
          </div>
          {realStats.count > 0 && realStats.avg != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Star size={26} fill={STAR_COLOR} color={STAR_COLOR} />
              <div>
                <div style={{ fontSize: 'var(--text-metric)', fontWeight: 700, color: '#131A18', lineHeight: 1 }}>
                  {realStats.avg.toFixed(1)} <span style={{ fontSize: 'var(--text-small)', fontWeight: 500, color: '#667085' }}>/ 5</span>
                </div>
                <div style={{ fontSize: 'var(--text-caption)', color: '#667085', marginTop: 2 }}>{realStats.count === 1 ? t('reviewsCountOne') : t('reviewsCountSuffix', { count: realStats.count })}</div>
              </div>
            </div>
          )}
        </div>

        {reviews.length === 0 || !vendorId ? (
          <EmptyReviews />
        ) : (
          <ReviewsView vendorId={vendorId} reviews={reviews} realStats={realStats} />
        )}

        <style>{`
          .reviews-layout { display: grid; grid-template-columns: minmax(0, 280px) minmax(0, 1fr); gap: 16px; align-items: start; }
          @media (max-width: 860px) {
            .reviews-layout { grid-template-columns: minmax(0, 1fr); }
          }
        `}</style>
      </main>
    </div>
  )
}

function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={size} fill={n <= value ? STAR_COLOR : 'none'} color={n <= value ? STAR_COLOR : '#D0D5DD'} />
      ))}
    </div>
  )
}

function computeTrend(reviews: ReviewRow[], total: number): number | null {
  if (total < MIN_TREND_SAMPLE) return null
  const now = Date.now()
  const avgOf = (list: ReviewRow[]) => (list.length > 0 ? list.reduce((acc, r) => acc + r.rating, 0) / list.length : null)
  const recent = reviews.filter(r => now - Date.parse(r.created_at) < 30 * DAY_MS)
  const previous = reviews.filter(r => {
    const age = now - Date.parse(r.created_at)
    return age >= 30 * DAY_MS && age < 60 * DAY_MS
  })
  const a = avgOf(recent)
  const b = avgOf(previous)
  if (a === null || b === null) return null
  return Math.round((a - b) * 10) / 10
}

function MetricCard({ label, value, sub, subColor = '#667085' }: { label: string; value: string; sub: string; subColor?: string }) {
  return (
    <div style={{ ...cardStyle, padding: 14 }}>
      <div style={{ fontSize: 'var(--text-caption)', color: '#818F98', textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 'var(--text-metric)', fontWeight: 700, lineHeight: 'var(--leading-price)', color: '#131A18' }}>{value}</div>
      <div style={{ fontSize: 'var(--text-caption)', fontWeight: 500, color: subColor, marginTop: 4 }}>{sub}</div>
    </div>
  )
}

function ReviewsView({ vendorId, reviews, realStats }: { vendorId: string; reviews: ReviewRow[]; realStats: RealStats }) {
  const { t } = useTranslation('dashboard')
  const counts = useVendorRatingBreakdown(vendorId)
  const [starFilter, setStarFilter] = useState<StarFilter>('all')
  const [productFilter, setProductFilter] = useState<string>('all')
  const [sort, setSort] = useState<SortOrder>('recent')

  const total = realStats.count
  const trend = useMemo(() => computeTrend(reviews, total), [reviews, total])
  const countLabel = (n: number) => (n === 1 ? t('reviewsCountOne') : t('reviewsCountSuffix', { count: n }))

  const products = useMemo(() => {
    const map = new Map<string, string>()
    reviews.forEach(r => map.set(r.product_id, r.product_name))
    return [...map.entries()]
  }, [reviews])

  const filtered = useMemo(() => {
    const list = reviews.filter(r =>
      (starFilter === 'all' || r.rating === starFilter) &&
      (productFilter === 'all' || r.product_id === productFilter)
    )
    return sort === 'recent'
      ? list
      : [...list].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
  }, [reviews, starFilter, productFilter, sort])

  const filtersActive = starFilter !== 'all' || productFilter !== 'all'
  const countFor = (stars: number) => (counts ? counts[5 - stars] : null)

  const starChips: { key: StarFilter; label: string; count: number | null }[] = [
    { key: 'all', label: t('reviewsFilterAll'), count: total },
    ...[5, 4, 3, 2, 1].map(s => ({ key: s as StarFilter, label: t('reviewsFilterStars', { stars: s }), count: countFor(s) })),
  ]

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <MetricCard
          label={t('reviewsAverageLabel')}
          value={realStats.avg != null ? `${realStats.avg.toFixed(1)} / 5` : '—'}
          sub={countLabel(total)}
        />
        <MetricCard label={t('reviewsTotalLabel')} value={String(total)} sub={countLabel(total)} />
        {trend !== null && (
          <MetricCard
            label={t('reviewsTrendLabel')}
            value={`${trend > 0 ? '+' : ''}${trend.toFixed(1)}`}
            sub={t('reviewsTrendSub')}
            subColor={trend > 0 ? 'var(--color-green)' : trend < 0 ? 'var(--brand-red)' : '#667085'}
          />
        )}
      </div>

      <div className="reviews-layout">
        <aside style={{ ...cardStyle, padding: 16 }}>
          <div style={{ fontSize: 'var(--text-small)', fontWeight: 700, color: '#131A18', marginBottom: 12 }}>{t('reviewsDistributionTitle')}</div>
          {[5, 4, 3, 2, 1].map(stars => {
            const count = countFor(stars)
            const pct = count != null && total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 'var(--text-caption)', color: '#475467' }}>
                <span style={{ width: 14, fontWeight: 600 }}>{stars}</span>
                <Star size={12} fill={STAR_COLOR} color={STAR_COLOR} />
                <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#EEF2F6', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: 'var(--dashboard-blue)' }} />
                </div>
                <span style={{ width: 62, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {count != null ? `${pct}% (${count})` : '—'}
                </span>
              </div>
            )
          })}
        </aside>

        <section style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
            <div className="scroll-hide-x" style={{ display: 'flex', gap: 6, flex: '1 1 auto', minWidth: 0 }}>
              {starChips.map(chip => {
                const active = starFilter === chip.key
                return (
                  <button
                    key={String(chip.key)}
                    type="button"
                    onClick={() => setStarFilter(chip.key)}
                    aria-pressed={active}
                    style={{
                      flexShrink: 0, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'inherit',
                      padding: '6px 12px', borderRadius: 999, fontSize: 'var(--text-caption)', fontWeight: 600,
                      border: active ? '1px solid var(--dashboard-blue)' : '1px solid #E5E7EB',
                      background: active ? 'var(--dashboard-blue)' : '#fff',
                      color: active ? '#fff' : '#344054',
                    }}
                  >
                    {chip.label}{chip.count != null ? ` (${chip.count})` : ''}
                  </button>
                )
              })}
            </div>
            <select
              value={productFilter}
              onChange={e => setProductFilter(e.target.value)}
              aria-label={t('reviewsFilterProduct')}
              style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 10px', fontSize: 'var(--text-caption)', background: '#fff', maxWidth: 220 }}
            >
              <option value="all">{t('reviewsFilterProduct')}</option>
              {products.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortOrder)}
              aria-label={t('reviewsSortRecent')}
              style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 10px', fontSize: 'var(--text-caption)', background: '#fff' }}
            >
              <option value="recent">{t('reviewsSortRecent')}</option>
              <option value="oldest">{t('reviewsSortOldest')}</option>
            </select>
          </div>

          <div style={{ fontSize: 'var(--text-caption)', color: '#667085', marginBottom: 10 }}>
            {t('reviewsShowing', { count: filtered.length, total: reviews.length })}
          </div>

          {filtered.length === 0 ? (
            <div style={{ ...cardStyle, padding: 20, textAlign: 'center' }}>
              <p style={{ color: '#667085', fontSize: 'var(--text-small)', margin: '0 0 10px' }}>{t('reviewsNoResults')}</p>
              {filtersActive && (
                <button
                  type="button"
                  onClick={() => { setStarFilter('all'); setProductFilter('all') }}
                  style={{ border: 'none', background: 'none', color: 'var(--dashboard-blue)', fontWeight: 600, fontSize: 'var(--text-small)', cursor: 'pointer' }}
                >
                  {t('reviewsClearFilters')}
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {filtered.map(r => <ReviewCard key={r.id} review={r} clientFallback={t('reviewsClientFallback')} verifiedLabel={t('reviewsVerifiedBadge')} />)}
            </div>
          )}
        </section>
      </div>
    </>
  )
}

function ReviewCard({ review, clientFallback, verifiedLabel }: { review: ReviewRow; clientFallback: string; verifiedLabel: string }) {
  const { language } = useTranslation('dashboard')
  const date = formatDate(review.created_at, language, { day: 'numeric', month: 'short', year: 'numeric' })
  const buyer = review.buyer_name ?? clientFallback

  return (
    <article style={{ ...cardStyle, padding: 14, display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Stars value={review.rating} />
          {review.order_id && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#E8F8F0', color: '#0B7A4B', fontSize: 'var(--text-badge)', fontWeight: 600, padding: '2px 8px', borderRadius: 999 }}>
              <BadgeCheck size={12} />
              {verifiedLabel}
            </span>
          )}
        </div>
        <span style={{ fontSize: 'var(--text-caption)', color: '#818F98' }}>{date}</span>
      </div>

      {review.comment && (
        <p style={{ fontSize: 'var(--text-small)', color: '#344054', lineHeight: 1.5, margin: 0 }}>{review.comment}</p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: 8, background: '#F7F9FB', borderRadius: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, background: '#EEF2F6', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {review.product_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={review.product_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : null}
        </div>
        <div style={{ minWidth: 0, flex: '1 1 160px' }}>
          <div style={{ fontSize: 'var(--text-small)', fontWeight: 600, color: '#131A18', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{review.product_name}</div>
          {review.product_price != null && (
            <div style={{ fontSize: 'var(--text-caption)', color: '#475467' }}>{formatPrice(review.product_price)}</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <span style={{ width: 24, height: 24, borderRadius: 999, background: 'var(--dashboard-blue)', color: '#fff', fontSize: 'var(--text-badge)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {buyer.charAt(0).toUpperCase()}
          </span>
          <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: '#344054' }}>{buyer}</span>
        </div>
      </div>
    </article>
  )
}

function EmptyReviews() {
  const { t } = useTranslation('dashboard')
  return (
    <div style={{ ...cardStyle, padding: 28, maxWidth: 560, margin: '0 auto', display: 'grid', gap: 10, justifyItems: 'center', textAlign: 'center' }}>
      <div style={{ width: 52, height: 52, borderRadius: 999, background: '#FFF7DB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Star size={24} fill={STAR_COLOR} color={STAR_COLOR} />
      </div>
      <p style={{ color: '#131A18', fontSize: 'var(--text-body)', fontWeight: 700, margin: 0 }}>{t('noReviewsTitle')}</p>
      <p style={{ color: '#667085', fontSize: 'var(--text-small)', maxWidth: 420, margin: 0 }}>
        {t('noReviewsSubPrefix')}
        <strong> {t('statusDeliveredPlain')}</strong>{t('noReviewsSubSuffix')}
      </p>
      <p style={{ color: '#475467', fontSize: 'var(--text-caption)', maxWidth: 420, margin: 0, background: '#F7F9FB', borderRadius: 10, padding: '10px 12px' }}>
        {t('reviewsEmptyTip')}
      </p>
    </div>
  )
}
