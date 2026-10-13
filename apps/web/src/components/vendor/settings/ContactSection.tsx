'use client'
// ============================================================
// MercadoRD — Configuración, sección: Contacto
// Ruta: src/components/vendor/settings/ContactSection.tsx
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { usePhoneField } from '@/lib/hooks/usePhoneField'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { PHONE_PLACEHOLDER } from '@/lib/phone'
import { SectionCard, SaveSectionButton } from './SectionCard'

interface Props {
  vendorId: string
  initial: { whatsapp: string; instagram: string }
  onRegisterSave?: (save: (() => Promise<boolean>) | null) => void
  hideOwnButton?: boolean
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 'var(--text-ui)', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = { fontSize: 'var(--text-form-label)', fontWeight: 600, color: '#666', display: 'block', marginBottom: 4 }

export function ContactSection({ vendorId, initial, onRegisterSave, hideOwnButton }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const { t: tc } = useTranslation('common')
  // Se guarda canónico (1809XXXXXXX); se muestra y edita como 809-555-1234.
  const whatsappField = usePhoneField(initial.whatsapp)
  const validateWhatsapp = whatsappField.validate
  const [instagram, setInstagram] = useState(initial.instagram)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSave = useCallback(async () => {
    setError(null)
    setSuccess(false)

    const whatsapp = validateWhatsapp()
    if (whatsapp === false) return false

    setSaving(true)
    const { error: updateError } = await supabase
      .from('vendors')
      .update({ whatsapp, instagram: instagram.trim() || null })
      .eq('id', vendorId)
    setSaving(false)

    if (updateError) {
      console.error('[ContactSection]', updateError)
      setError('Ocurrió un error al guardar. Intenta de nuevo.')
      return false
    }
    setSuccess(true)
    router.refresh()
    return true
  }, [validateWhatsapp, instagram, vendorId, supabase, router])

  useEffect(() => {
    onRegisterSave?.(handleSave)
    return () => onRegisterSave?.(null)
  }, [handleSave, onRegisterSave])

  return (
    <SectionCard title="Contacto">
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>WhatsApp</label>
        <input {...whatsappField.inputProps} placeholder={PHONE_PLACEHOLDER}
          style={{ ...inputStyle, border: `1px solid ${whatsappField.error ? '#c00' : '#ddd'}` }} />
        {whatsappField.error
          ? <p style={{ fontSize: 'var(--text-small)', fontWeight: 500, color: '#c00', marginTop: 6 }}>{whatsappField.error}</p>
          : <p style={{ fontSize: 'var(--text-small)', color: '#666', marginTop: 6 }}>{tc('whatsappHelp')}</p>}
      </div>

      <div>
        <label style={labelStyle}>Instagram (sin @)</label>
        <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="mitiendard" style={inputStyle} />
      </div>

      <SaveSectionButton onClick={handleSave} saving={saving} error={error} success={success} showButton={!hideOwnButton} />
    </SectionCard>
  )
}
