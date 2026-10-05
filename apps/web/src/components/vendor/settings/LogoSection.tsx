'use client'
// ============================================================
// MercadoRD — Configuración, sección: Logo de la tienda
// Ruta: src/components/vendor/settings/LogoSection.tsx
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validateImageFile } from '@/lib/storage/upload'
import { BRAND } from '@/lib/colors'
import { SectionCard, SaveSectionButton } from './SectionCard'

interface Props {
  vendorId: string
  userId: string
  initialLogoUrl: string | null
  // Wizard de Configuración: deja que el paso dispare el guardado desde
  // un único botón "Guardar cambios" en vez del propio de esta tarjeta.
  onRegisterSave?: (save: (() => Promise<boolean>) | null) => void
  hideOwnButton?: boolean
  bare?: boolean
}

export function LogoSection({ vendorId, userId, initialLogoUrl, onRegisterSave, hideOwnButton, bare }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(initialLogoUrl)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [removing, setRemoving] = useState(false)

  // Acción instantánea, no pasa por "Guardar cambios" -- mismo patrón que
  // activar/desactivar en FaqSection. Solo limpia vendors.logo_url; el
  // archivo en Storage queda huérfano (no existe un mapeo guardado de
  // public URL -> path para borrarlo de forma segura hoy).
  const handleRemove = async () => {
    if (!window.confirm('¿Eliminar el logo de tu tienda?')) return
    setRemoving(true)
    const { error } = await supabase.from('vendors').update({ logo_url: null }).eq('id', vendorId)
    setRemoving(false)
    if (error) {
      console.error('[LogoSection remove]', error)
      setLogoError('Ocurrió un error al eliminar el logo. Intenta de nuevo.')
      return
    }
    setLogoPreview(null)
    setLogoFile(null)
    router.refresh()
  }

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

  const handleSave = useCallback(async () => {
    if (!logoFile) return true // nada pendiente -- no es un error
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
      return true
    } catch (err) {
      console.error('[LogoSection]', err)
      setLogoError('Ocurrió un error al guardar el logo. Intenta de nuevo.')
      return false
    } finally {
      setSaving(false)
    }
  }, [logoFile, userId, vendorId, supabase, router])

  useEffect(() => {
    onRegisterSave?.(handleSave)
    return () => onRegisterSave?.(null)
  }, [handleSave, onRegisterSave])

  return (
    <SectionCard title="Logo de la tienda" bare={bare}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: BRAND.bg, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {logoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 28 }}>🏪</span>
          )}
        </div>
        <label style={{ cursor: 'pointer' }}>
          <span style={{ display: 'inline-block', border: '1px solid #ddd', borderRadius: 8, padding: '8px 16px', fontSize: 'var(--text-small)', fontWeight: 600, color: '#333' }}>
            Cambiar logo
          </span>
          <input type="file" accept="image/*" onChange={handleLogoSelect} style={{ display: 'none' }} />
        </label>
        {logoPreview && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            style={{ background: 'none', border: 'none', color: '#c00', fontSize: 'var(--text-small)', fontWeight: 600, cursor: removing ? 'not-allowed' : 'pointer', padding: 0 }}
          >
            {removing ? 'Eliminando...' : 'Eliminar'}
          </button>
        )}
      </div>

      {logoFile && (
        <SaveSectionButton onClick={handleSave} saving={saving} error={logoError} success={success} showButton={!hideOwnButton} />
      )}
      {!logoFile && logoError && (
        <p style={{ fontSize: 'var(--text-caption)', color: '#c00', marginTop: 10 }}>{logoError}</p>
      )}
    </SectionCard>
  )
}
