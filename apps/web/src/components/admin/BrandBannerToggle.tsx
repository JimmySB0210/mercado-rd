'use client'
// ============================================================
// MercadoRD — Ajustes del banner de marca de MercadoRD en el home
// Ruta: src/components/admin/BrandBannerToggle.tsx
// ============================================================
// Controla 3 filas de site_settings, leídas por HeroBanner.tsx:
//   - show_brand_banner: incluye o no la diapositiva de marca en el carrusel
//   - brand_banner_image_url: foto de fondo del modelo en BrandSlide (desktop)
//   - brand_banner_mobile_image_url: foto de fondo en WelcomeSlide (mobile)
// Mismo patrón de subida que PromoBannerForm.tsx (bucket 'banners',
// validateImageFileLocal replicado localmente).
// ============================================================

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, uploadBanner } from '@/lib/storage/upload'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { BRAND } from '@/lib/colors'

interface Props {
  initialValue: boolean
  initialDesktopImageUrl: string | null
  initialMobileImageUrl: string | null
}

interface ImageFieldProps {
  settingKey: 'brand_banner_image_url' | 'brand_banner_mobile_image_url'
  label: string
  hint: string
  previewWidth: number
  previewHeight: number
  url: string | null
  onUpdated: (url: string | null) => void
}

function ImageField({ settingKey, label, hint, previewWidth, previewHeight, url, onUpdated }: ImageFieldProps) {
  const { t } = useTranslation('admin')
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const persist = async (value: string | null) => {
    setSaving(true)
    setError(null)

    const supabase = createClient()
    // PostgREST no distingue "columna jsonb con el literal JSON null" de
    // "columna SQL NULL" cuando se manda `value: null` en un UPDATE — con
    // value NOT NULL eso viola la constraint. Al quitar la imagen, en vez
    // de intentar guardar null, se borra la fila entera (HeroBanner.tsx ya
    // trata "fila ausente" igual que "sin imagen configurada"). Al subir
    // una nueva, upsert por si la fila fue borrada en un "Quitar" anterior.
    const { error: opError } = value === null
      ? await supabase.from('site_settings').delete().eq('key', settingKey)
      : await supabase.from('site_settings').upsert(
          { key: settingKey, value, updated_by: user?.id ?? null, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )

    setSaving(false)

    if (opError) {
      console.error('[BrandBannerToggle:ImageField]', opError)
      setError(t('brandImageUpdateFailed'))
      return
    }
    onUpdated(value)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError(t('invalidImageType'))
      return
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError(t('imageTooLarge'))
      return
    }

    setError(null)
    setSaving(true)
    const { url: uploadedUrl, error: uploadError } = await uploadBanner(file)

    if (uploadError || !uploadedUrl) {
      setSaving(false)
      setError(uploadError ?? t('brandImageUploadFailed'))
      return
    }

    await persist(uploadedUrl)
  }

  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={t('previewAlt')} style={{ width: previewWidth, height: previewHeight, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
        )}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} disabled={saving} style={{ fontSize: 12 }} />
        {url && (
          <button
            type="button"
            onClick={() => persist(null)}
            disabled={saving}
            style={{
              background: '#fff', color: '#666', border: '1px solid #ddd', borderRadius: 6,
              padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {t('brandImageRemoveButton')}
          </button>
        )}
      </div>
      <p style={{ fontSize: 11, color: '#999', margin: '6px 0 0' }}>{hint}</p>
      {error && <p style={{ fontSize: 12, color: BRAND.red, margin: '4px 0 0' }}>{error}</p>}
    </div>
  )
}

export function BrandBannerToggle({ initialValue, initialDesktopImageUrl, initialMobileImageUrl }: Props) {
  const { t } = useTranslation('admin')
  const { user } = useAuth()
  const [enabled, setEnabled] = useState(initialValue)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [desktopImageUrl, setDesktopImageUrl] = useState(initialDesktopImageUrl)
  const [mobileImageUrl, setMobileImageUrl] = useState(initialMobileImageUrl)

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
        padding: '16px 18px', marginBottom: 20, display: 'grid', gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
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

      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, display: 'grid', gap: 16 }}>
        <ImageField
          settingKey="brand_banner_image_url"
          label={t('brandDesktopImageLabel')}
          hint={t('brandDesktopImageHint')}
          previewWidth={96}
          previewHeight={56}
          url={desktopImageUrl}
          onUpdated={setDesktopImageUrl}
        />
        <ImageField
          settingKey="brand_banner_mobile_image_url"
          label={t('brandMobileImageLabel')}
          hint={t('brandMobileImageHint')}
          previewWidth={56}
          previewHeight={80}
          url={mobileImageUrl}
          onUpdated={setMobileImageUrl}
        />
      </div>
    </div>
  )
}
