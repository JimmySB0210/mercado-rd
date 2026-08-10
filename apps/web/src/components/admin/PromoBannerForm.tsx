'use client'
// ============================================================
// MercadoRD — Crear / editar banner promocional (admin)
// Ruta: src/components/admin/PromoBannerForm.tsx
// ============================================================
// Componente compartido entre los modos 'crear' y 'editar', mismo
// patrón que components/dashboard/ProductForm.tsx.
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, uploadBanner } from '@/lib/storage/upload'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { BRAND } from '@/lib/colors'
import type { PromoBanner } from '@/types/database.types'

interface Props {
  mode: 'crear' | 'editar'
  nextSortOrder: number
  initialData?: PromoBanner
  onSaved: (banner: PromoBanner) => void
  onCancel?: () => void
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none',
}

// datetime-local necesita 'YYYY-MM-DDTHH:mm' en hora LOCAL, no el ISO/UTC que devuelve Postgres
function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function PromoBannerForm({ mode, nextSortOrder, initialData, onSaved, onCancel }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useTranslation('admin')

  // Replica localmente la validación de validateImageFile() de
  // lib/storage/upload.ts (con las constantes ya exportadas) en vez de
  // modificar esa función — también la usan ProductForm.tsx y
  // LogoSection.tsx, fuera de este alcance.
  const validateImageFileLocal = (file: File): string | null => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return t('invalidImageType')
    if (file.size > MAX_IMAGE_SIZE_BYTES) return t('imageTooLarge')
    return null
  }

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(initialData?.image_url ?? null)
  const [mobileFile, setMobileFile] = useState<File | null>(null)
  const [mobilePreview, setMobilePreview] = useState<string | null>(initialData?.mobile_image_url ?? null)
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [subtitle, setSubtitle] = useState(initialData?.subtitle ?? '')
  const [linkUrl, setLinkUrl] = useState(initialData?.link_url ?? '')
  const [sortOrder, setSortOrder] = useState(String(initialData?.sort_order ?? nextSortOrder))
  // Modo crear: días relativos a partir de ahora. Modo editar: fecha/hora exacta editable.
  const [expiresInDays, setExpiresInDays] = useState('')
  const [expiresAt, setExpiresAt] = useState(toDatetimeLocalValue(initialData?.expires_at ?? null))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return

    const validationError = validateImageFileLocal(f)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return

    const validationError = validateImageFileLocal(f)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setMobileFile(f)
    setMobilePreview(URL.createObjectURL(f))
  }

  const resetForm = (newSortOrder: number) => {
    setFile(null)
    setPreview(null)
    setMobileFile(null)
    setMobilePreview(null)
    setTitle('')
    setSubtitle('')
    setLinkUrl('')
    setSortOrder(String(newSortOrder))
    setExpiresInDays('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'crear' && !file && !mobileFile) {
      setError(t('selectAtLeastOneImage'))
      return
    }

    setSaving(true)
    setError(null)

    // Imagen de desktop — sube la nueva si se seleccionó, si no conserva la existente
    let imageUrl = initialData?.image_url ?? ''
    if (file) {
      const { url, error: uploadError } = await uploadBanner(file)
      if (uploadError || !url) {
        setSaving(false)
        setError(uploadError ?? t('imageUploadFailed'))
        return
      }
      imageUrl = url
    }

    // Imagen de mobile — igual, opcional
    let mobileImageUrl = initialData?.mobile_image_url ?? null
    if (mobileFile) {
      const { url: mUrl, error: mUploadError } = await uploadBanner(mobileFile)
      if (mUploadError || !mUrl) {
        setSaving(false)
        setError(mUploadError ?? t('mobileImageUploadFailed'))
        return
      }
      mobileImageUrl = mUrl
    }

    // Modo editar: el input datetime-local manda directo (vacío = sin expiración).
    // Modo crear: días relativos a partir de ahora (vacío = sin expiración).
    const expiresAtIso = mode === 'editar'
      ? (expiresAt ? new Date(expiresAt).toISOString() : null)
      : (expiresInDays ? new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000).toISOString() : null)

    const payload = {
      image_url: imageUrl,
      mobile_image_url: mobileImageUrl,
      title: title.trim() || null,
      subtitle: subtitle.trim() || null,
      link_url: linkUrl.trim() || null,
      sort_order: Number(sortOrder) || 0,
      expires_at: expiresAtIso,
    }

    if (mode === 'editar' && initialData) {
      const { data: updated, error: updateError } = await supabase
        .from('promo_banners')
        .update(payload)
        .eq('id', initialData.id)
        .select()
        .single()

      setSaving(false)

      if (updateError || !updated) {
        setError(updateError?.message ?? t('saveBannerFailed'))
        return
      }

      onSaved(updated as PromoBanner)
      router.refresh()
      return
    }

    const { data: inserted, error: insertError } = await supabase
      .from('promo_banners')
      .insert({ ...payload, is_active: true })
      .select()
      .single()

    setSaving(false)

    if (insertError || !inserted) {
      setError(insertError?.message ?? t('createBannerFailed'))
      return
    }

    onSaved(inserted as PromoBanner)
    resetForm(Number(sortOrder) + 1 || nextSortOrder + 1)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: 18, display: 'grid', gap: 12 }}>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
          {t('desktopImageLabel')}
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={t('previewAlt')} style={{ width: 96, height: 56, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} style={{ fontSize: 12 }} />
        </div>
        {mode === 'editar' && (
          <p style={{ fontSize: 11, color: '#999', margin: '6px 0 0' }}>
            {t('keepCurrentImageHint')}
          </p>
        )}
      </div>

      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
          {t('mobileImageLabel')}
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {mobilePreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mobilePreview} alt={t('previewMobileAlt')} style={{ width: 56, height: 80, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleMobileFileChange} style={{ fontSize: 12 }} />
        </div>
        <p style={{ fontSize: 11, color: '#999', margin: '6px 0 0' }}>
          {mode === 'editar' ? t('keepCurrentMobileImageHintEdit') : t('keepCurrentMobileImageHintCreate')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
            {t('titleFieldLabel')}
          </label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder={t('titlePlaceholder')} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
            {t('subtitleFieldLabel')}
          </label>
          <input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder={t('subtitlePlaceholder')} style={inputStyle} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
            {t('linkFieldLabel')}
          </label>
          <input
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            placeholder={t('linkPlaceholder')}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
            {t('orderFieldLabel')}
          </label>
          <input
            type="number"
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
          {mode === 'editar' ? t('expiresOnLabelEdit') : t('expiresInLabelCreate')}
        </label>
        {mode === 'editar' ? (
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={e => setExpiresAt(e.target.value)}
            style={{ ...inputStyle, maxWidth: 260 }}
          />
        ) : (
          <input
            type="number"
            min="1"
            value={expiresInDays}
            onChange={e => setExpiresInDays(e.target.value)}
            placeholder={t('expiresInPlaceholder')}
            style={{ ...inputStyle, maxWidth: 260 }}
          />
        )}
        <p style={{ fontSize: 11, color: '#999', margin: '6px 0 0' }}>
          {mode === 'editar' ? t('clearExpirationHint') : t('autoHideHint')}
        </p>
      </div>

      {error && <p style={{ fontSize: 12, color: BRAND.red, margin: 0 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            background: BRAND.blue, color: '#fff', border: 'none',
            padding: '9px 20px', borderRadius: 8, fontWeight: 700, fontSize: 13,
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? t('savingButton') : mode === 'editar' ? t('saveChangesButton') : t('addBannerButton')}
        </button>
        {mode === 'editar' && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            style={{
              background: '#fff', color: '#666', border: '1px solid #ddd',
              padding: '9px 20px', borderRadius: 8, fontWeight: 600, fontSize: 13,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {t('cancelButton')}
          </button>
        )}
      </div>
    </form>
  )
}
