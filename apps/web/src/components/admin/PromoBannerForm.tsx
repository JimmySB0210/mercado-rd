'use client'
// ============================================================
// MercadoRD — Crear banner promocional (admin)
// Ruta: src/components/admin/PromoBannerForm.tsx
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validateImageFile, uploadBanner } from '@/lib/storage/upload'
import { BRAND } from '@/lib/colors'

interface Props {
  nextSortOrder: number
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none',
}

export function PromoBannerForm({ nextSortOrder }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [mobileFile, setMobileFile] = useState<File | null>(null)
  const [mobilePreview, setMobilePreview] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [sortOrder, setSortOrder] = useState(String(nextSortOrder))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return

    const validationError = validateImageFile(f)
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

    const validationError = validateImageFile(f)
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Selecciona una imagen para el banner')
      return
    }

    setSaving(true)
    setError(null)

    const { url, error: uploadError } = await uploadBanner(file)
    if (uploadError || !url) {
      setSaving(false)
      setError(uploadError ?? 'No se pudo subir la imagen')
      return
    }

    let mobileUrl: string | null = null
    if (mobileFile) {
      const { url: mUrl, error: mUploadError } = await uploadBanner(mobileFile)
      if (mUploadError || !mUrl) {
        setSaving(false)
        setError(mUploadError ?? 'No se pudo subir la imagen para mobile')
        return
      }
      mobileUrl = mUrl
    }

    const { error: insertError } = await supabase.from('promo_banners').insert({
      image_url: url,
      mobile_image_url: mobileUrl,
      title: title.trim() || null,
      subtitle: subtitle.trim() || null,
      link_url: linkUrl.trim() || null,
      sort_order: Number(sortOrder) || 0,
      is_active: true,
    })

    setSaving(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    resetForm(Number(sortOrder) + 1 || nextSortOrder + 1)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: 18, display: 'grid', gap: 12 }}>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
          Imagen para desktop
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Vista previa" style={{ width: 96, height: 56, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} style={{ fontSize: 12 }} />
        </div>
      </div>

      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
          Imagen para mobile (vertical, opcional)
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {mobilePreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mobilePreview} alt="Vista previa mobile" style={{ width: 56, height: 80, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleMobileFileChange} style={{ fontSize: 12 }} />
        </div>
        <p style={{ fontSize: 11, color: '#999', margin: '6px 0 0' }}>
          Si no subes una, se usa la imagen de desktop también en mobile.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
            Título (opcional)
          </label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej. Ofertas de temporada" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
            Subtítulo (opcional)
          </label>
          <input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Ej. Hasta 30% off" style={inputStyle} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
            Link de destino (opcional)
          </label>
          <input
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            placeholder="/categoria/ropa, /tienda/xxx o https://..."
            style={inputStyle}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#333', display: 'block', marginBottom: 6 }}>
            Orden
          </label>
          <input
            type="number"
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {error && <p style={{ fontSize: 12, color: BRAND.red, margin: 0 }}>{error}</p>}

      <button
        type="submit"
        disabled={saving}
        style={{
          justifySelf: 'start', background: BRAND.blue, color: '#fff', border: 'none',
          padding: '9px 20px', borderRadius: 8, fontWeight: 700, fontSize: 13,
          cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? 'Subiendo...' : '+ Crear banner'}
      </button>
    </form>
  )
}
