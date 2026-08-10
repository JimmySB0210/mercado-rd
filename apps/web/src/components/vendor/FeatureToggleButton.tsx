'use client'
// ============================================================
// MercadoRD — Toggle "Destacar producto" (solo plan Pro)
// Ruta: src/components/vendor/FeatureToggleButton.tsx
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BRAND } from '@/lib/colors'
import { useTranslation } from '@/lib/hooks/useTranslation'

interface Props {
  productId: string
  initialFeatured: boolean
  isPro: boolean
}

export function FeatureToggleButton({ productId, initialFeatured, isPro }: Props) {
  const { t } = useTranslation('dashboard')
  const router = useRouter()
  const supabase = createClient()

  const [featured, setFeatured] = useState(initialFeatured)
  const [saving, setSaving] = useState(false)

  if (!isPro) {
    return (
      <span style={{ fontSize: 11, color: '#999' }}>{t('proOnlyLabel')}</span>
    )
  }

  const handleToggle = async () => {
    setSaving(true)
    const { error } = await supabase.rpc('toggle_featured_product', {
      p_product_id: productId,
      p_featured: !featured,
    })
    setSaving(false)

    if (error) {
      console.error('[FeatureToggleButton]', error)
      return
    }

    setFeatured(f => !f)
    router.refresh()
  }

  return (
    <button
      onClick={handleToggle}
      disabled={saving}
      style={{
        border: `1px solid ${featured ? BRAND.blue : '#ddd'}`,
        background: featured ? BRAND.blue : '#fff',
        color: featured ? '#fff' : '#333',
        borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600,
        cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
      }}
    >
      {featured ? t('featuredBadge') : t('featureButton')}
    </button>
  )
}
