'use client'
// ============================================================
// MercadoRD — Configuración, sección: Contacto
// Ruta: src/components/vendor/settings/ContactSection.tsx
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validatePhone } from '@/lib/validation'
import { SectionCard, SaveSectionButton } from './SectionCard'

interface Props {
  vendorId: string
  initial: { whatsapp: string; instagram: string }
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = { fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }

export function ContactSection({ vendorId, initial }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [whatsapp, setWhatsapp] = useState(initial.whatsapp)
  const [instagram, setInstagram] = useState(initial.instagram)
  const [whatsappError, setWhatsappError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    setError(null)
    setWhatsappError(null)
    setSuccess(false)

    if (whatsapp.trim().length > 0) {
      const whatsappErr = validatePhone(whatsapp)
      if (whatsappErr) { setWhatsappError(whatsappErr); return }
    }

    setSaving(true)
    const { error: updateError } = await supabase
      .from('vendors')
      .update({ whatsapp: whatsapp.trim() || null, instagram: instagram.trim() || null })
      .eq('id', vendorId)
    setSaving(false)

    if (updateError) {
      console.error('[ContactSection]', updateError)
      setError('Ocurrió un error al guardar. Intenta de nuevo.')
      return
    }
    setSuccess(true)
    router.refresh()
  }

  return (
    <SectionCard title="Contacto">
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>WhatsApp (con código de país, sin +)</label>
        <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="18095550000"
          style={{ ...inputStyle, border: `1px solid ${whatsappError ? '#c00' : '#ddd'}` }} />
        {whatsappError && <p style={{ fontSize: 12, color: '#c00', marginTop: 6 }}>{whatsappError}</p>}
      </div>

      <div>
        <label style={labelStyle}>Instagram (sin @)</label>
        <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="mitiendard" style={inputStyle} />
      </div>

      <SaveSectionButton onClick={handleSave} saving={saving} error={error} success={success} />
    </SectionCard>
  )
}
