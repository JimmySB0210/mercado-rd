'use client'
// ============================================================
// MercadoRD — Interruptor: banner de marca de MercadoRD en el home
// Ruta: src/components/admin/BrandBannerToggle.tsx
// ============================================================
// Controla site_settings.value donde key = 'show_brand_banner' — leído
// por HeroBanner.tsx en el home para decidir si incluye la diapositiva
// de marca (BrandSlide / WelcomeSlide+PerksSlide) en el carrusel.
// ============================================================

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useTranslation } from '@/lib/hooks/useTranslation'

interface Props {
  initialValue: boolean
}

export function BrandBannerToggle({ initialValue }: Props) {
  const { t } = useTranslation('admin')
  const { user } = useAuth()
  const [enabled, setEnabled] = useState(initialValue)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const handleToggle = async () => {
    if (loading) return
    const next = !enabled
    setLoading(true)
    setError(false)

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('site_settings')
      .update({ value: next, updated_by: user?.id ?? null, updated_at: new Date().toISOString() })
      .eq('key', 'show_brand_banner')

    setLoading(false)

    if (updateError) {
      console.error('[BrandBannerToggle]', updateError)
      setError(true)
      return
    }
    setEnabled(next)
  }

  return (
    <div
      style={{
        background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
        padding: '16px 18px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}
    >
      <div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{t('brandBannerToggleLabel')}</div>
        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{t('brandBannerToggleSub')}</div>
        {error && <div style={{ fontSize: 12, color: '#E53935', marginTop: 4 }}>{t('brandBannerToggleError')}</div>}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={t('brandBannerToggleLabel')}
        onClick={handleToggle}
        disabled={loading}
        style={{
          width: 44, height: 26, borderRadius: 9999, border: 'none', flexShrink: 0, padding: 0,
          background: enabled ? 'var(--color-primary)' : '#ccc',
          position: 'relative', cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1, transition: 'background-color var(--transition-fast)',
        }}
      >
        <span
          style={{
            position: 'absolute', top: 3, left: enabled ? 21 : 3, width: 20, height: 20, borderRadius: '50%',
            background: '#fff', transition: 'left var(--transition-fast)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </button>
    </div>
  )
}
