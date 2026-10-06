'use client'
// ============================================================
// MercadoRD — Mi plan (vendor dashboard)
// Ruta: src/app/dashboard/plan/page.tsx
// ============================================================
// Beneficios mostrados solo si el código los exige por plan:
//   - Límite de 5 productos activos en Free (trigger enforce_product_limit).
//   - Productos ilimitados en Pro (mismo trigger).
//   - Destacar productos solo en Pro (toggle_featured_product).
// "Publicaciones activas" es un conteo real de products.is_active.
// Sin respaldo, y por eso omitidos: badge de verificado, comisión
// reducida, soporte prioritario, promociones exclusivas y reportes
// avanzados (ver el PR de este rediseño).
// El cobro sigue en modo simulado (processPayment) y el botón de Pro
// conserva el mismo comportamiento de siempre.
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Crown, MessageCircle, Package, Star, Store, BarChart3, MessageSquareText, type LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DashboardSidebar } from '@/components/vendor/DashboardSidebar'
import { processPayment } from '@/lib/payments/azul'
import { useTranslation } from '@/lib/hooks/useTranslation'

const PRO_PRICE_RDP = 49900 // RD$499 en centavos
const FREE_PRODUCT_LIMIT = 5

const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(10,30,60,0.06)', border: '1px solid #EEF2F6',
}

export default function VendorPlanPage() {
  const { t } = useTranslation('dashboard')
  const router = useRouter()
  const supabase = createClient()

  const [vendor, setVendor] = useState<{ id: string; business_name: string; plan: string } | null>(null)
  const [activeCount, setActiveCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [cardNumber, setCardNumber] = useState('')
  const [expiration, setExpiration] = useState('')
  const [cvc, setCvc] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/dashboard/plan')
        return
      }

      const { data } = await supabase
        .from('vendors')
        .select('id, business_name, plan')
        .eq('user_id', user.id)
        .single()

      if (!data) {
        router.push('/vendor/register')
        return
      }

      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('vendor_id', data.id)
        .eq('is_active', true)

      setVendor(data)
      setActiveCount(count ?? 0)
      setLoading(false)
    }
    load()
  }, [router, supabase])

  const handleUpgrade = async () => {
    if (!vendor) return
    setError(null)

    if (!cardNumber || !expiration || !cvc) {
      setError(t('cardDetailsRequiredPlan'))
      return
    }

    setProcessing(true)

    try {
      const result = await processPayment({
        orderId: `PRO-${vendor.id}-${Date.now()}`,
        amountCents: PRO_PRICE_RDP,
        itbisCents: 0, // suscripciones de software exentas de ITBIS
        cardNumber: cardNumber.replace(/\s/g, ''),
        expiration,
        cvc,
        customerName: vendor.business_name,
      })

      if (!result.success) {
        // result.responseMessage viene de la pasarela en español fijo —
        // no se traduce (mensaje de un sistema externo), mapeamos por
        // código a un mensaje traducido, igual que en checkout/page.tsx.
        setError(result.responseCode === '05' ? t('paymentDeclinedPlan') : t('paymentErrorGenericPlan'))
        setProcessing(false)
        return
      }

      const { error: activateError } = await supabase.rpc('activate_pro_plan', {
        p_vendor_id: vendor.id,
        p_amount_rdp: PRO_PRICE_RDP,
        p_azul_order_id: result.azulOrderId,
        p_auth_code: result.authCode,
      })

      if (activateError) throw activateError

      setSuccess(true)
      setTimeout(() => router.refresh(), 2000)
    } catch (err) {
      console.error('[VendorPlanPage]', err)
      setError(t('activatePlanError'))
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">{t('loadingGeneric')}</div>
      </div>
    )
  }

  const isPro = vendor?.plan === 'pro'
  const freeFeatures = [t('freePlanFeature1'), t('freePlanFeature2'), t('freePlanFeature3'), t('freePlanFeature4'), t('freePlanFeature5')]
  const sharedBenefits = [
    { Icon: Store, label: t('freePlanFeature2') },
    { Icon: MessageCircle, label: t('freePlanFeature3') },
    { Icon: MessageSquareText, label: t('freePlanFeature4') },
    { Icon: BarChart3, label: t('freePlanFeature5') },
  ]

  return (
    <div className="dashboard-grid" style={{ minHeight: '100vh', fontFamily: 'inherit' }}>

      <DashboardSidebar />

      <main style={{ padding: 24, background: '#F7F9FB', minWidth: 0 }}>
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 'var(--text-dash-title)', fontWeight: 700, lineHeight: 'var(--leading-h1)', color: '#131A18', margin: 0 }}>{t('planPageTitle')}</h1>
          <p style={{ color: '#667085', fontSize: 'var(--text-ui)', margin: '4px 0 0' }}>{t('planPageSub')}</p>
        </div>

        {/* Plan actual + indicadores */}
        <div className="plan-top" style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
          <div style={{ ...cardStyle, padding: 18, display: 'grid', gap: 8, alignContent: 'start', borderColor: isPro ? 'var(--dashboard-yellow)' : '#EEF2F6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 'var(--text-caption)', color: '#818F98', textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 500 }}>{t('planCurrentLabel')}</span>
              <span style={{ fontSize: 'var(--text-badge)', fontWeight: 600, color: '#0B7A4B', background: '#E8F8F0', padding: '3px 9px', borderRadius: 999 }}>{t('planStatusActive')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isPro && <Crown size={20} color="#B98900" fill="var(--dashboard-yellow)" />}
              <span style={{ fontSize: 'var(--text-h3)', fontWeight: 700, color: '#131A18' }}>{isPro ? t('proPlanBadge') : t('freePlanBadge')}</span>
            </div>
            <div style={{ fontSize: 'var(--text-metric)', fontWeight: 700, color: '#131A18', lineHeight: 'var(--leading-price)' }}>
              {isPro ? 'RD$499' : 'RD$0'}
              <span style={{ fontSize: 'var(--text-small)', fontWeight: 500, color: '#667085' }}>{t('perMonth')}</span>
            </div>
          </div>

          <div className="plan-kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
            <IndicatorCard label={t('planLimitLabel')} value={isPro ? t('planLimitProValue') : t('planLimitFreeValue')} />
            <IndicatorCard
              label={t('planPublishedLabel')}
              value={isPro ? String(activeCount) : t('planPublishedOfFree', { count: activeCount, limit: FREE_PRODUCT_LIMIT })}
            />
            <IndicatorCard
              label={t('planHighlightLabel')}
              value={isPro ? t('planHighlightAvailable') : t('planHighlightUnavailable')}
              tone={isPro ? 'green' : 'muted'}
            />
          </div>
        </div>

        {/* Beneficios del plan actual */}
        <div style={{ ...cardStyle, padding: 18, marginBottom: 16 }}>
          <div style={{ fontSize: 'var(--text-h4)', fontWeight: 700, color: '#131A18' }}>{t('planIncludesTitle')}</div>
          <div style={{ fontSize: 'var(--text-caption)', color: '#667085', marginBottom: 12 }}>{t('planIncludesSub')}</div>
          <div className="plan-benefits" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            {isPro ? (
              <>
                <Benefit Icon={Package} label={t('proPlanFeature1')} />
                <Benefit Icon={Star} label={t('planProFeatureHighlight')} />
              </>
            ) : (
              <>
                <Benefit Icon={Package} label={t('freePlanFeature1')} />
                <Benefit Icon={Star} label={t('planProFeatureHighlight')} muted />
              </>
            )}
          </div>
          <div style={{ fontSize: 'var(--text-badge)', fontWeight: 600, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.03em', margin: '14px 0 8px' }}>{t('planSharedTitle')}</div>
          <div className="plan-benefits" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            {sharedBenefits.map(b => <Benefit key={b.label} Icon={b.Icon} label={b.label} />)}
          </div>
        </div>

        {/* Comparar planes */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 'var(--text-h4)', fontWeight: 700, color: '#131A18' }}>{t('planCompareTitle')}</div>
          <div style={{ fontSize: 'var(--text-caption)', color: '#667085', marginBottom: 12 }}>{t('planCompareSub')}</div>
        </div>
        <div className="plan-compare" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>

          {/* Free */}
          <div style={{ ...cardStyle, padding: 18, border: !isPro ? '2px solid var(--dashboard-blue)' : cardStyle.border }}>
            <div style={{ fontSize: 'var(--text-small)', fontWeight: 700, color: '#475467' }}>{t('freePlanBadge')}</div>
            <div style={{ fontSize: 'var(--text-metric)', fontWeight: 700, color: '#131A18', margin: '6px 0 12px' }}>RD$0<span style={{ fontSize: 'var(--text-small)', fontWeight: 500, color: '#667085' }}>{t('perMonth')}</span></div>
            {freeFeatures.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 'var(--text-small)', color: '#344054', padding: '5px 0' }}>
                <Check size={15} color="#667085" style={{ flexShrink: 0, marginTop: 2 }} />{f}
              </div>
            ))}
            {!isPro && (
              <div style={{ marginTop: 14, textAlign: 'center', fontSize: 'var(--text-caption)', fontWeight: 700, color: 'var(--dashboard-blue)', background: '#EAF3FF', padding: 8, borderRadius: 8 }}>
                {t('currentPlanBadge')}
              </div>
            )}
          </div>

          {/* Pro */}
          <div style={{ ...cardStyle, padding: 18, border: isPro ? '2px solid var(--dashboard-yellow)' : '1.5px solid #FDE68A', position: 'relative' }}>
            {!isPro && (
              <span style={{ position: 'absolute', top: 14, right: 14, fontSize: 'var(--text-badge)', fontWeight: 700, color: '#7A5A00', background: 'var(--dashboard-yellow)', padding: '3px 9px', borderRadius: 999 }}>
                {t('planRecommendedBadge')}
              </span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-small)', fontWeight: 700, color: '#131A18' }}>
              <Crown size={15} color="#B98900" fill="var(--dashboard-yellow)" />{t('proPlanBadge')}
            </div>
            <div style={{ fontSize: 'var(--text-metric)', fontWeight: 700, color: '#131A18', margin: '6px 0 12px' }}>RD$499<span style={{ fontSize: 'var(--text-small)', fontWeight: 500, color: '#667085' }}>{t('perMonth')}</span></div>
            {[t('planProAllFree'), t('proPlanFeature1'), t('planProFeatureHighlight')].map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 'var(--text-small)', color: '#131A18', fontWeight: 600, padding: '5px 0' }}>
                <Check size={15} color="var(--dashboard-blue)" style={{ flexShrink: 0, marginTop: 2 }} />{f}
              </div>
            ))}

            {isPro ? (
              <div style={{ marginTop: 16, textAlign: 'center', fontSize: 'var(--text-caption)', fontWeight: 700, color: '#0B7A4B', background: '#E8F8F0', padding: 8, borderRadius: 8 }}>
                {t('activePlanBadge')}
              </div>
            ) : (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #EEF2F6' }}>
                {success ? (
                  <div style={{ textAlign: 'center', fontSize: 'var(--text-small)', fontWeight: 700, color: '#0B7A4B', background: '#E8F8F0', padding: 12, borderRadius: 8 }}>
                    {t('planActivatedMsg')}
                  </div>
                ) : (
                  <>
                    <input
                      type="text" placeholder={t('cardNumberPlaceholder')} value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      style={{ width: '100%', border: '1px solid #D0D5DD', borderRadius: 8, padding: '9px 12px', fontSize: 'var(--text-small)', marginBottom: 8, boxSizing: 'border-box', fontFamily: 'inherit' }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input
                        type="text" placeholder={t('expirationPlaceholder')} value={expiration}
                        onChange={e => setExpiration(e.target.value)}
                        style={{ flex: 1, minWidth: 0, border: '1px solid #D0D5DD', borderRadius: 8, padding: '9px 12px', fontSize: 'var(--text-small)', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      />
                      <input
                        type="text" placeholder={t('cvcPlaceholder')} value={cvc}
                        onChange={e => setCvc(e.target.value)}
                        style={{ flex: 1, minWidth: 0, border: '1px solid #D0D5DD', borderRadius: 8, padding: '9px 12px', fontSize: 'var(--text-small)', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      />
                    </div>
                    <p style={{ fontSize: 'var(--text-badge)', color: '#667085', margin: '0 0 10px' }}>
                      {t('planMockModeNotice')}
                    </p>
                    {error && (
                      <div role="alert" style={{ background: '#FDECEC', border: '1px solid #FBC9C9', borderRadius: 8, padding: '8px 10px', fontSize: 'var(--text-caption)', color: '#B42318', marginBottom: 10 }}>
                        {error}
                      </div>
                    )}
                    <button
                      onClick={handleUpgrade}
                      disabled={processing}
                      style={{ width: '100%', background: processing ? '#98A2B3' : 'var(--dashboard-blue)', color: '#fff', border: 'none', padding: 12, borderRadius: 8, fontWeight: 700, fontSize: 'var(--text-small)', cursor: processing ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                    >
                      {processing ? t('processingUpgrade') : t('upgradeToProBtn')}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

        </div>

        <style>{`
          @media (min-width: 900px) {
            .plan-top { grid-template-columns: minmax(240px, 300px) minmax(0, 1fr); align-items: stretch; }
          }
          @media (max-width: 560px) {
            .plan-benefits { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </main>
    </div>
  )
}

function IndicatorCard({ label, value, tone }: { label: string; value: string; tone?: 'green' | 'muted' }) {
  const color = tone === 'green' ? '#0B7A4B' : tone === 'muted' ? '#667085' : '#131A18'
  return (
    <div style={{ ...cardStyle, padding: 14 }}>
      <div style={{ fontSize: 'var(--text-caption)', color: '#818F98', textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 'var(--text-metric)', fontWeight: 700, lineHeight: 'var(--leading-price)', color }}>{value}</div>
    </div>
  )
}

function Benefit({ Icon, label, muted }: { Icon: LucideIcon; label: string; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: muted ? '#F7F9FB' : '#EAF3FF', opacity: muted ? 0.75 : 1 }}>
      <Icon size={16} color={muted ? '#98A2B3' : 'var(--dashboard-blue)'} />
      <span style={{ fontSize: 'var(--text-small)', fontWeight: 600, color: '#131A18' }}>{label}</span>
    </div>
  )
}
