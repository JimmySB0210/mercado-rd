'use client'
// ============================================================
// MercadoRD — Reseñas (vendor dashboard)
// Ruta: src/app/dashboard/resenas/page.tsx
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DashboardSidebar } from '@/components/vendor/DashboardSidebar'
import { useTranslation } from '@/lib/hooks/useTranslation'

interface ReviewRow {
  id: string
  rating: number
  comment: string | null
  created_at: string
  product_name: string
  buyer_name: string
}

export default function VendorReviewsPage() {
  const { t } = useTranslation('dashboard')
  const router = useRouter()
  const supabase = createClient()

  const [reviews, setReviews] = useState<ReviewRow[]>([])
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
        .select('id, rating_avg')
        .eq('user_id', user.id)
        .single()

      if (!vendor) {
        router.push('/vendor/register')
        return
      }

      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, product:products(name), buyer:users(full_name)')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[VendorReviews]', error)
        setReviews([])
      } else {
        setReviews((data ?? []).map((r: any) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          product_name: r.product?.name ?? 'Producto',
          buyer_name: r.buyer?.full_name ?? 'Cliente',
        })))
      }

      setLoading(false)
    }
    load()
  }, [router, supabase])

  const avgRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0

  const distribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
  }))

  const Stars = ({ value }: { value: number }) => (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} style={{ color: n <= value ? '#F5A200' : '#ddd', fontSize: 14 }}>★</span>
      ))}
    </div>
  )

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

      <div style={{ padding: 28, background: '#f5f5f5' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{t('reviewsPageTitle')}</h1>
          <p style={{ color: '#666', fontSize: 14 }}>{t('reviewsPageSub')}</p>
        </div>

        {reviews.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: 48, textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
            <p style={{ color: '#333', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{t('noReviewsTitle')}</p>
            <p style={{ color: '#999', fontSize: 13, maxWidth: 360, margin: '0 auto' }}>
              {t('noReviewsSubPrefix')}
              <strong> {t('statusDeliveredPlain')}</strong>{t('noReviewsSubSuffix')}
            </p>
          </div>
        ) : (
          <>
            {/* Resumen */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, fontWeight: 900, color: '#111' }}>{avgRating.toFixed(1)}</div>
                <Stars value={Math.round(avgRating)} />
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{t('reviewsCountSuffix', { count: reviews.length })}</div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                {distribution.map(d => (
                  <div key={d.stars} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: '#666', width: 12 }}>{d.stars}</span>
                    <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${reviews.length > 0 ? (d.count / reviews.length) * 100 : 0}%`, height: '100%', background: '#F5A200' }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#999', width: 16 }}>{d.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lista de reviews */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reviews.map(r => {
                const date = new Date(r.created_at).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' })
                return (
                  <div key={r.id} style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{r.buyer_name}</span>
                        <span style={{ fontSize: 12, color: '#999', marginLeft: 8 }}>{r.product_name}</span>
                      </div>
                      <span style={{ fontSize: 11, color: '#999' }}>{date}</span>
                    </div>
                    <Stars value={r.rating} />
                    {r.comment && (
                      <p style={{ fontSize: 13, color: '#444', marginTop: 8, lineHeight: 1.5 }}>{r.comment}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
