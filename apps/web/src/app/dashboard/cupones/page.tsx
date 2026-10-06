'use client'
// ============================================================
// MercadoRD — Cupones (vendor dashboard)
// Ruta: src/app/dashboard/cupones/page.tsx
// ============================================================
// Lectura y escritura reales: coupons del vendedor, alta (modal con los
// mismos campos y validación de siempre) y activar/desactivar. Sin
// cambios de backend. Estado derivado con los mismos criterios que
// validate_coupon en la base: Desactivado (is_active = false), Expirado
// (expires_at pasado), Agotado (uses_count >= max_uses) o Activo.
// Se omiten "Programados" (no hay fecha de inicio), "descuento generado"
// (los pedidos no guardan el cupón) y "Editar" (no existe la acción).
// ============================================================

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DashboardSidebar } from '@/components/vendor/DashboardSidebar'
import { formatPrice } from '@/types/database.types'
import { formatDate } from '@/lib/utils'
import { useTranslation } from '@/lib/hooks/useTranslation'

interface Coupon {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_order_rdp: number | null
  max_uses: number | null
  uses_count: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}

type CouponStatus = 'active' | 'expired' | 'exhausted' | 'disabled'
type Tab = 'all' | 'active' | 'expired' | 'disabled'
type SortOrder = 'recent' | 'uses' | 'expires'

const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(10,30,60,0.06)', border: '1px solid #EEF2F6',
}

const STATUS_STYLE: Record<CouponStatus, { bg: string; color: string }> = {
  active: { bg: '#E8F8F0', color: '#0B7A4B' },
  expired: { bg: '#FDECEC', color: '#B42318' },
  exhausted: { bg: '#FFF7DB', color: '#8A5A00' },
  disabled: { bg: '#F2F4F7', color: '#475467' },
}

function statusOf(c: Coupon, now: number): CouponStatus {
  if (!c.is_active) return 'disabled'
  if (c.expires_at && Date.parse(c.expires_at) < now) return 'expired'
  if (c.max_uses != null && c.uses_count >= c.max_uses) return 'exhausted'
  return 'active'
}

export default function VendorCouponsPage() {
  const { t, language } = useTranslation('dashboard')
  const router = useRouter()
  const supabase = createClient()

  const [vendorId, setVendorId] = useState<string | null>(null)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortOrder>('recent')

  const loadCoupons = async (vId: string) => {
    const { data, error: loadError } = await supabase
      .from('coupons')
      .select('*')
      .eq('vendor_id', vId)
      .order('created_at', { ascending: false })

    if (loadError) console.error('[VendorCouponsPage load]', loadError)
    setCoupons(data ?? [])
  }

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?redirect=/dashboard/cupones')
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

      setVendorId(vendor.id)
      await loadCoupons(vendor.id)
      setLoading(false)
    }
    load()
  }, [router, supabase])

  const handleToggleActive = async (coupon: Coupon) => {
    const { error: updateError } = await supabase
      .from('coupons')
      .update({ is_active: !coupon.is_active })
      .eq('id', coupon.id)

    if (updateError) {
      console.error('[VendorCouponsPage toggle]', updateError)
      return
    }

    setCoupons(prev => prev.map(c => (c.id === coupon.id ? { ...c, is_active: !c.is_active } : c)))
  }

  const now = Date.now()
  const statuses = useMemo(() => new Map(coupons.map(c => [c.id, statusOf(c, now)])), [coupons, now])

  const counts = useMemo(() => {
    const c = { all: coupons.length, active: 0, expired: 0, disabled: 0 }
    coupons.forEach(coupon => {
      const s = statuses.get(coupon.id)
      if (s === 'active') c.active++
      if (s === 'expired') c.expired++
      if (s === 'disabled') c.disabled++
    })
    return c
  }, [coupons, statuses])

  const totalUses = useMemo(() => coupons.reduce((acc, c) => acc + c.uses_count, 0), [coupons])

  const visible = useMemo(() => {
    const q = query.trim().toUpperCase()
    const list = coupons.filter(c => {
      const s = statuses.get(c.id)
      const matchesTab = tab === 'all' || s === tab
      return matchesTab && (!q || c.code.toUpperCase().includes(q))
    })
    if (sort === 'uses') return [...list].sort((a, b) => b.uses_count - a.uses_count)
    if (sort === 'expires') {
      return [...list].sort((a, b) => {
        if (!a.expires_at && !b.expires_at) return 0
        if (!a.expires_at) return 1
        if (!b.expires_at) return -1
        return Date.parse(a.expires_at) - Date.parse(b.expires_at)
      })
    }
    return list
  }, [coupons, statuses, tab, query, sort])

  const statusLabel = (s: CouponStatus) => ({
    active: t('activeBadge'),
    expired: t('couponsStatusExpired'),
    exhausted: t('couponsStatusExhausted'),
    disabled: t('couponsStatusDisabled'),
  }[s])

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'all', label: t('couponsTabAll'), count: counts.all },
    { key: 'active', label: t('couponsTabActive'), count: counts.active },
    { key: 'expired', label: t('couponsTabExpired'), count: counts.expired },
    { key: 'disabled', label: t('couponsTabDisabled'), count: counts.disabled },
  ]

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#999', fontSize: 'var(--text-ui)' }}>{t('loadingGeneric')}</div>
      </div>
    )
  }

  return (
    <div className="dashboard-grid" style={{ minHeight: '100vh', fontFamily: 'inherit' }}>

      <DashboardSidebar />

      <main style={{ padding: 24, background: '#F7F9FB', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-dash-title)', fontWeight: 700, lineHeight: 'var(--leading-h1)', color: '#131A18', margin: 0 }}>{t('couponsPageTitle')}</h1>
            <p style={{ color: '#667085', fontSize: 'var(--text-ui)', margin: '4px 0 0' }}>{t('couponsPageSub')}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: 'var(--dashboard-blue)', color: '#fff', borderRadius: 10, padding: '10px 16px',
              fontSize: 'var(--text-small)', fontWeight: 700, boxShadow: '0 2px 8px rgba(5,112,230,0.25)',
            }}
          >
            <Plus size={16} />
            {t('couponsNewBtn')}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
          <MetricCard label={t('couponsMetricActive')} value={String(counts.active)} />
          <MetricCard label={t('couponsMetricUses')} value={String(totalUses)} />
          <MetricCard label={t('couponsMetricExpired')} value={String(counts.expired)} />
        </div>

        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '10px 12px', borderBottom: '1px solid #EEF2F6' }}>
            <div className="scroll-hide-x" style={{ display: 'flex', gap: 6, flex: '1 1 auto', minWidth: 0 }}>
              {tabs.map(tb => {
                const active = tab === tb.key
                return (
                  <button
                    key={tb.key}
                    type="button"
                    onClick={() => setTab(tb.key)}
                    aria-pressed={active}
                    style={{
                      flexShrink: 0, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'inherit',
                      padding: '6px 12px', borderRadius: 999, fontSize: 'var(--text-caption)', fontWeight: 600,
                      border: active ? '1px solid var(--dashboard-blue)' : '1px solid #E5E7EB',
                      background: active ? 'var(--dashboard-blue)' : '#fff',
                      color: active ? '#fff' : '#344054',
                    }}
                  >
                    {tb.label} ({tb.count})
                  </button>
                )
              })}
            </div>
            <div style={{ position: 'relative', flex: '0 1 220px', minWidth: 160 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#98A2B3' }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('couponsSearchPlaceholder')}
                aria-label={t('couponsSearchPlaceholder')}
                style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 10px 6px 30px', fontSize: 'var(--text-caption)', fontFamily: 'inherit' }}
              />
            </div>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortOrder)}
              aria-label={t('couponsSortLabel')}
              style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: '6px 10px', fontSize: 'var(--text-caption)', background: '#fff' }}
            >
              <option value="recent">{t('couponsSortRecent')}</option>
              <option value="uses">{t('couponsSortUses')}</option>
              <option value="expires">{t('couponsSortExpires')}</option>
            </select>
          </div>

          {coupons.length === 0 ? (
            <div style={{ padding: 28, textAlign: 'center', display: 'grid', gap: 10, justifyItems: 'center' }}>
              <p style={{ color: '#667085', fontSize: 'var(--text-small)', margin: 0 }}>{t('noCouponsYet')}</p>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                style={{ border: 'none', background: 'none', color: 'var(--dashboard-blue)', fontWeight: 700, fontSize: 'var(--text-small)', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {t('couponsNewBtn')}
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#667085', fontSize: 'var(--text-small)' }}>{t('couponsNoResults')}</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 820, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    {[t('tableCode'), t('tableType'), t('couponsColDiscount'), t('tableUses'), t('couponsColLimit'), t('couponsColExpires'), t('tableStatus'), t('tableActions')].map((h, i) => (
                      <th key={`${h}-${i}`} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 'var(--text-badge)', color: '#667085', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 600, borderBottom: '1px solid #EEF2F6', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map(c => {
                    const s = statuses.get(c.id) ?? 'active'
                    const style = STATUS_STYLE[s]
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #F2F4F7' }}>
                        <td style={{ padding: '10px 12px', fontSize: 'var(--text-small)', fontWeight: 700, color: 'var(--dashboard-blue)', whiteSpace: 'nowrap' }}>{c.code}</td>
                        <td style={{ padding: '10px 12px', fontSize: 'var(--text-caption)', color: '#475467', whiteSpace: 'nowrap' }}>
                          {c.type === 'percentage' ? t('typePercentage') : t('typeFixed')}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 'var(--text-small)', fontWeight: 600, color: '#131A18', whiteSpace: 'nowrap' }}>
                          {c.type === 'percentage' ? `${c.value}%` : formatPrice(c.value)}
                          {c.min_order_rdp != null && (
                            <div style={{ fontSize: 'var(--text-badge)', fontWeight: 500, color: '#667085' }}>{t('couponsMinOrder', { amount: formatPrice(c.min_order_rdp) })}</div>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 'var(--text-caption)', color: '#475467', whiteSpace: 'nowrap' }}>{c.uses_count}</td>
                        <td style={{ padding: '10px 12px', fontSize: 'var(--text-caption)', color: '#475467', whiteSpace: 'nowrap' }}>
                          {c.max_uses != null ? c.max_uses : t('couponsNoLimit')}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 'var(--text-caption)', color: '#475467', whiteSpace: 'nowrap' }}>
                          {c.expires_at ? formatDate(c.expires_at, language, { day: 'numeric', month: 'short', year: 'numeric' }) : t('noExpiration')}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ background: style.bg, color: style.color, fontSize: 'var(--text-badge)', fontWeight: 600, padding: '3px 9px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                            {statusLabel(s)}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(c)}
                            style={{
                              border: '1px solid #D0D5DD', background: '#fff', borderRadius: 8, padding: '5px 10px',
                              fontSize: 'var(--text-caption)', fontWeight: 600, cursor: 'pointer', color: '#344054', fontFamily: 'inherit', whiteSpace: 'nowrap',
                            }}
                          >
                            {c.is_active ? t('deactivateBtn') : t('activateBtn')}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showForm && vendorId && (
        <CouponFormModal
          vendorId={vendorId}
          onClose={() => setShowForm(false)}
          onCreated={async () => {
            setShowForm(false)
            await loadCoupons(vendorId)
          }}
        />
      )}
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ ...cardStyle, padding: 14 }}>
      <div style={{ fontSize: 'var(--text-caption)', color: '#818F98', textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 'var(--text-metric)', fontWeight: 700, lineHeight: 'var(--leading-price)', color: '#131A18' }}>{value}</div>
    </div>
  )
}

function CouponFormModal({ vendorId, onClose, onCreated }: { vendorId: string; onClose: () => void; onCreated: () => Promise<void> }) {
  const { t } = useTranslation('dashboard')
  const supabase = createClient()

  const [form, setForm] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    minOrder: '',
    maxUses: '',
    expiresAt: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.code.trim()) {
      setError(t('codeRequiredError'))
      return
    }

    const valueNum = parseFloat(form.value)
    if (isNaN(valueNum) || valueNum <= 0) {
      setError(t('valueInvalidError'))
      return
    }
    if (form.type === 'percentage' && valueNum > 100) {
      setError(t('percentageMaxError'))
      return
    }

    setSaving(true)

    const { error: insertError } = await supabase.from('coupons').insert({
      vendor_id: vendorId,
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: form.type === 'fixed' ? Math.round(valueNum * 100) : Math.round(valueNum),
      min_order_rdp: form.minOrder ? Math.round(parseFloat(form.minOrder) * 100) : null,
      max_uses: form.maxUses ? parseInt(form.maxUses) : null,
      expires_at: form.expiresAt || null,
      is_active: true,
    })

    setSaving(false)

    if (insertError) {
      console.error('[VendorCouponsPage create]', insertError)
      setError(
        insertError.code === '23505'
          ? t('duplicateCodeError')
          : t('couponCreateError')
      )
      return
    }

    await onCreated()
  }

  const inputStyle: React.CSSProperties = { width: '100%', border: '1px solid #D0D5DD', borderRadius: 8, padding: '9px 12px', fontSize: 'var(--text-ui)', boxSizing: 'border-box', fontFamily: 'inherit' }
  const labelStyle: React.CSSProperties = { fontSize: 'var(--text-caption)', color: '#475467', display: 'block', marginBottom: 4, fontWeight: 500 }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="coupon-form-title"
        onClick={e => e.stopPropagation()}
        style={{ ...cardStyle, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', padding: 20, boxShadow: '0 12px 40px rgba(16,24,40,0.2)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 id="coupon-form-title" style={{ fontSize: 'var(--text-h4)', fontWeight: 700, margin: 0, color: '#131A18' }}>{t('newCouponHeading')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('couponsModalClose')}
            style={{ border: 'none', background: 'none', fontSize: 22, lineHeight: 1, cursor: 'pointer', color: '#667085', padding: 4 }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleCreate} style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={labelStyle}>{t('codeLabel')}</label>
            <input name="code" value={form.code} onChange={handleCodeChange} placeholder={t('codePlaceholder')} style={{ ...inputStyle, textTransform: 'uppercase' }} />
          </div>

          <div>
            <label style={labelStyle}>{t('typeLabel')}</label>
            <select name="type" value={form.type} onChange={handleChange} style={{ ...inputStyle, background: '#fff' }}>
              <option value="percentage">{t('typePercentageOption')}</option>
              <option value="fixed">{t('typeFixedOption')}</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>
              {form.type === 'percentage' ? t('discountPercentLabel') : t('discountAmountLabel')}
            </label>
            <input
              name="value"
              type="number"
              step={form.type === 'percentage' ? '1' : '0.01'}
              min="0"
              value={form.value}
              onChange={handleChange}
              placeholder={form.type === 'percentage' ? '20' : '500.00'}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div>
              <label style={labelStyle}>{t('minOrderLabel')}</label>
              <input name="minOrder" type="number" step="0.01" min="0" value={form.minOrder} onChange={handleChange} placeholder="RD$" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>{t('maxUsesLabel')}</label>
              <input name="maxUses" type="number" min="1" value={form.maxUses} onChange={handleChange} placeholder={t('maxUsesPlaceholder')} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>{t('expirationDateLabel')}</label>
            <input name="expiresAt" type="date" value={form.expiresAt} onChange={handleChange} style={inputStyle} />
          </div>

          {error && (
            <div role="alert" style={{ background: '#FDECEC', border: '1px solid #FBC9C9', borderRadius: 8, padding: '8px 12px', fontSize: 'var(--text-small)', fontWeight: 500, color: '#B42318' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ border: '1px solid #D0D5DD', background: '#fff', borderRadius: 8, padding: '10px 16px', fontWeight: 600, fontSize: 'var(--text-small)', cursor: 'pointer', color: '#344054', fontFamily: 'inherit' }}
            >
              {t('couponsModalCancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                border: 'none', background: saving ? '#98A2B3' : 'var(--dashboard-blue)', color: '#fff', borderRadius: 8,
                padding: '10px 16px', fontWeight: 700, fontSize: 'var(--text-small)', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}
            >
              {saving ? t('creatingCoupon') : t('createCouponBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
