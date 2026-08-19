'use client'
// ============================================================
// MercadoRD — Crear/gestionar "Oferta del día" por producto
// Ruta: src/components/vendor/DailyDealAction.tsx
// ============================================================
// INSERT/UPDATE van directo a daily_deals con el cliente normal —
// RLS (daily_deals_vendor_write) ya restringe a productos propios del
// vendor autenticado. El precio lo valida un trigger en la BD
// (validate_daily_deal_price) que rechaza cualquier oferta que no sea
// más barata que products.price_rdp — este componente solo muestra el
// mensaje de error exacto que el trigger devuelve, no duplica esa
// validación en el cliente.
// ============================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/types/database.types'
import { BRAND } from '@/lib/colors'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { DashboardDict } from '@/lib/i18n/es/dashboard'

interface DealRow {
  id: string
  deal_price_rdp: number
  expires_at: string
}

interface Props {
  productId: string
  currentPriceRdp: number
  initialDeal: DealRow | null
}

const DURATION_OPTIONS: { hours: number; labelKey: keyof DashboardDict }[] = [
  { hours: 6, labelKey: 'dealDuration6h' },
  { hours: 12, labelKey: 'dealDuration12h' },
  { hours: 24, labelKey: 'dealDuration24h' },
  { hours: 72, labelKey: 'dealDuration3d' },
  { hours: 168, labelKey: 'dealDuration7d' },
]

// null = ya expiró (o expiresAt inválido) — deja de mostrarse como activa
function formatTimeRemaining(expiresAt: string): string | null {
  const diffMs = new Date(expiresAt).getTime() - Date.now()
  if (diffMs <= 0) return null
  const totalMinutes = Math.floor(diffMs / 60000)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function DailyDealAction({ productId, currentPriceRdp, initialDeal }: Props) {
  const { t } = useTranslation('dashboard')
  const router = useRouter()

  const [deal, setDeal] = useState(initialDeal)
  const [open, setOpen] = useState(false)
  const [priceInput, setPriceInput] = useState('')
  const [durationHours, setDurationHours] = useState(24)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remaining, setRemaining] = useState<string | null>(
    initialDeal ? formatTimeRemaining(initialDeal.expires_at) : null
  )

  // Cuenta regresiva en vivo — se re-evalúa cada minuto, no una imagen estática
  useEffect(() => {
    if (!deal) { setRemaining(null); return }
    setRemaining(formatTimeRemaining(deal.expires_at))
    const interval = setInterval(() => {
      const r = formatTimeRemaining(deal.expires_at)
      setRemaining(r)
      if (!r) setDeal(null)
    }, 60000)
    return () => clearInterval(interval)
  }, [deal])

  const handleCreate = async () => {
    const priceRdp = Math.round(Number(priceInput) * 100)
    if (!priceInput || !Number.isFinite(priceRdp) || priceRdp <= 0) {
      setError(t('dealGenericError'))
      return
    }

    setSaving(true)
    setError(null)

    const supabase = createClient()
    const nowIso = new Date().toISOString()
    const expiresAtIso = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()

    const { data, error: insertError } = await supabase
      .from('daily_deals')
      .insert({ product_id: productId, deal_price_rdp: priceRdp, starts_at: nowIso, expires_at: expiresAtIso })
      .select('id, deal_price_rdp, expires_at')
      .single()

    setSaving(false)

    if (insertError || !data) {
      // Mensaje tal cual lo manda validate_daily_deal_price() en la BD
      setError(insertError?.message ?? t('dealGenericError'))
      return
    }

    setDeal(data)
    setOpen(false)
    setPriceInput('')
    router.refresh()
  }

  const handleDeactivate = async () => {
    if (!deal) return
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('daily_deals')
      .update({ is_active: false })
      .eq('id', deal.id)

    setSaving(false)

    if (updateError) {
      console.error('[DailyDealAction] deactivate', updateError)
      setError(t('dealDeactivateError'))
      return
    }

    setDeal(null)
    router.refresh()
  }

  // Oferta activa — badge + cuenta regresiva + desactivar
  if (deal && remaining) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', width: '100%' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#B45309', background: '#FEF3C7', padding: '3px 8px', borderRadius: 6 }}>
          {t('dealActiveLabel')} · {t('dealTimeRemaining', { time: remaining })}
        </span>
        <button
          onClick={handleDeactivate}
          disabled={saving}
          style={{ fontSize: 11, fontWeight: 600, color: BRAND.red, background: 'none', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', padding: 0 }}
        >
          {saving ? t('dealDeactivating') : t('dealDeactivateButton')}
        </button>
        {error && <p style={{ fontSize: 10, color: BRAND.red, width: '100%', margin: 0 }}>{error}</p>}
      </div>
    )
  }

  // Sin oferta activa — botón que abre el formulario inline
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ fontSize: 11, fontWeight: 600, color: '#B45309', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        {t('createDealCta')}
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', padding: 8, background: '#FFFBEB', borderRadius: 6, border: '1px solid #FDE68A' }}>
      <label style={{ fontSize: 10, fontWeight: 600, color: '#92400E' }}>
        {t('dealPriceLabel')} — {formatPrice(currentPriceRdp)}
        <input
          type="number"
          min={0}
          step="0.01"
          value={priceInput}
          onChange={e => setPriceInput(e.target.value)}
          style={{ width: '100%', marginTop: 2, border: '1px solid #ddd', borderRadius: 4, padding: '4px 6px', fontSize: 12, boxSizing: 'border-box' }}
        />
      </label>
      <label style={{ fontSize: 10, fontWeight: 600, color: '#92400E' }}>
        {t('dealDurationLabel')}
        <select
          value={durationHours}
          onChange={e => setDurationHours(Number(e.target.value))}
          style={{ width: '100%', marginTop: 2, border: '1px solid #ddd', borderRadius: 4, padding: '4px 6px', fontSize: 12, boxSizing: 'border-box' }}
        >
          {DURATION_OPTIONS.map(opt => (
            <option key={opt.hours} value={opt.hours}>{t(opt.labelKey)}</option>
          ))}
        </select>
      </label>
      {error && <p style={{ fontSize: 10, color: BRAND.red, margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={handleCreate}
          disabled={saving}
          style={{ flex: 1, background: '#B45309', color: '#fff', border: 'none', borderRadius: 4, padding: '5px 0', fontSize: 11, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}
        >
          {saving ? t('dealCreating') : t('dealCreateButton')}
        </button>
        <button
          onClick={() => { setOpen(false); setError(null) }}
          disabled={saving}
          style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 4, padding: '5px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
        >
          {t('dealCancelButton')}
        </button>
      </div>
    </div>
  )
}
