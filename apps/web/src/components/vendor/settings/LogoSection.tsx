'use client'
// ============================================================
// MercadoRD — Configuración, sección: Logo de la tienda
// Ruta: src/components/vendor/settings/LogoSection.tsx
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validateImageFile } from '@/lib/storage/upload'
import { BRAND } from '@/lib/colors'
import { SectionCard, SaveSectionButton } from './SectionCard'

interface Props {
  vendorId: string
  userId: string
  initialLogoUrl: string | null
}

export function LogoSection({ vendorId, userId, initialLogoUrl }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(initialLogoUrl)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateImageFile(file)
    if (validationError) {
      setLogoError(validationError)
      return
    }
    setLogoError(null)
    setSuccess(false)

    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!logoFile) return
    setLogoError(null)
    setSuccess(false)
    setSaving(true)

    try {
      const ext = logoFile.name.split('.').pop()
      const filename = `${userId}/logo-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('vendors')
        .upload(filename, logoFile, { upsert: true })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('vendors').getPublicUrl(filename)

      const { error: updateError } = await supabase
        .from('vendors')
        .update({ logo_url: data.publicUrl })
        .eq('id', vendorId)
      if (updateError) throw updateError

      setLogoFile(null)
      setSuccess(true)
      router.refresh()
    } catch (err) {
      console.error('[LogoSection]', err)
      setLogoError('Ocurrió un error al guardar el logo. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard title="Logo de la tienda">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 72, height: 72, borderRadius: 12, background: BRAND.bg, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {logoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 28 }}>🏪</span>
          )}
        </div>
        <label style={{ cursor: 'pointer' }}>
          <span style={{ display: 'inline-block', border: '1px solid #ddd', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#333' }}>
            Cambiar logo
          </span>
          <input type="file" accept="image/*" onChange={handleLogoSelect} style={{ display: 'none' }} />
        </label>
      </div>

      {logoFile && (
        <SaveSectionButton onClick={handleSave} saving={saving} error={logoError} success={success} />
      )}
      {!logoFile && logoError && (
        <p style={{ fontSize: 12, color: '#c00', marginTop: 10 }}>{logoError}</p>
      )}
    </SectionCard>
  )
}
