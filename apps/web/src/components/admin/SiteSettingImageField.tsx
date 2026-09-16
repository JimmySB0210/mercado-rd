'use client'
// ============================================================
// MercadoRD — Campo de imagen genérico para site_settings (admin)
// Ruta: src/components/admin/SiteSettingImageField.tsx
// ============================================================
// Extraído de BrandBannerToggle.tsx (antes vivía ahí como componente
// privado, usado solo para brand_banner_image_url/brand_banner_mobile_
// image_url) para que PromoCardImages.tsx lo reutilice tal cual con
// otras keys — mismo mecanismo genérico (key, value jsonb) de
// site_settings, mismo bucket 'banners' de Storage, mismo componente,
// sin duplicar la lógica de subida/borrado.
// ============================================================

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, uploadBanner } from '@/lib/storage/upload'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { BRAND } from '@/lib/colors'

interface SiteSettingImageFieldProps {
  settingKey: string
  label: string
  hint: string
  previewWidth: number
  previewHeight: number
  url: string | null
  onUpdated: (url: string | null) => void
}

export function SiteSettingImageField({ settingKey, label, hint, previewWidth, previewHeight, url, onUpdated }: SiteSettingImageFieldProps) {
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
    // de intentar guardar null, se borra la fila entera (los lectores de
    // cada key ya tratan "fila ausente" igual que "sin imagen
    // configurada" — mismo criterio que ya usaba brand_banner_image_url).
    // Al subir una nueva, upsert por si la fila fue borrada en un
    // "Quitar" anterior.
    const { error: opError } = value === null
      ? await supabase.from('site_settings').delete().eq('key', settingKey)
      : await supabase.from('site_settings').upsert(
          { key: settingKey, value, updated_by: user?.id ?? null, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )

    setSaving(false)

    if (opError) {
      console.error('[SiteSettingImageField]', opError)
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
