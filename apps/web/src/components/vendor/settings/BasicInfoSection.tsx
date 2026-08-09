'use client'
// ============================================================
// MercadoRD — Configuración, sección: Información básica
// Ruta: src/components/vendor/settings/BasicInfoSection.tsx
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validateText } from '@/lib/validation'
import { SectionCard, SaveSectionButton } from './SectionCard'

interface ProvinceOption { id: number; name: string }

interface Props {
  vendorId: string
  provinces: ProvinceOption[]
  initial: {
    businessName: string
    description: string
    provinceId: string
    address: string
    legalName: string
    contactFullName: string
    municipio: string
    sector: string
  }
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = { fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }

export function BasicInfoSection({ vendorId, provinces, initial }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState(initial)
  const [businessNameError, setBusinessNameError] = useState<string | null>(null)
  const [descriptionError, setDescriptionError] = useState<string | null>(null)
  const [addressError, setAddressError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSave = async () => {
    setError(null)
    setBusinessNameError(null)
    setDescriptionError(null)
    setAddressError(null)
    setSuccess(false)

    const businessNameErr = validateText(form.businessName, 'El nombre de la tienda', 3, 80)
    if (businessNameErr) { setBusinessNameError(businessNameErr); return }

    const descriptionErr = validateText(form.description, 'La descripción', 0, 500)
    if (descriptionErr) { setDescriptionError(descriptionErr); return }

    if (form.address.trim().length > 0) {
      const addressErr = validateText(form.address, 'Dirección', 10, 200)
      if (addressErr) { setAddressError(addressErr); return }
    }

    setSaving(true)
    const { error: updateError } = await supabase
      .from('vendors')
      .update({
        business_name: form.businessName.trim(),
        description: form.description.trim() || null,
        province_id: form.provinceId ? Number(form.provinceId) : null,
        address: form.address.trim() || null,
        legal_name: form.legalName.trim() || null,
        contact_full_name: form.contactFullName.trim() || null,
        municipio: form.municipio.trim() || null,
        sector: form.sector.trim() || null,
      })
      .eq('id', vendorId)
    setSaving(false)

    if (updateError) {
      console.error('[BasicInfoSection]', updateError)
      setError('Ocurrió un error al guardar. Intenta de nuevo.')
      return
    }
    setSuccess(true)
    router.refresh()
  }

  return (
    <SectionCard title="Información de la tienda">
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Nombre de la tienda *</label>
        <input name="businessName" value={form.businessName} onChange={handleChange}
          style={{ ...inputStyle, border: `1px solid ${businessNameError ? '#c00' : '#ddd'}` }} />
        {businessNameError && <p style={{ fontSize: 12, color: '#c00', marginTop: 6 }}>{businessNameError}</p>}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Descripción</label>
        <textarea name="description" value={form.description} onChange={handleChange} rows={3}
          style={{ ...inputStyle, border: `1px solid ${descriptionError ? '#c00' : '#ddd'}`, resize: 'vertical', fontFamily: 'inherit' }} />
        {descriptionError && <p style={{ fontSize: 12, color: '#c00', marginTop: 6 }}>{descriptionError}</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Razón social</label>
          <input name="legalName" value={form.legalName} onChange={handleChange} style={inputStyle} placeholder="Si es distinto del nombre de la tienda" />
        </div>
        <div>
          <label style={labelStyle}>Nombre del contacto</label>
          <input name="contactFullName" value={form.contactFullName} onChange={handleChange} style={inputStyle} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Provincia</label>
          <select name="provinceId" value={form.provinceId} onChange={handleChange} style={{ ...inputStyle, background: '#fff' }}>
            <option value="">Selecciona provincia</option>
            {provinces.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Municipio</label>
          <input name="municipio" value={form.municipio} onChange={handleChange} style={inputStyle} />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Sector</label>
        <input name="sector" value={form.sector} onChange={handleChange} style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Dirección del negocio</label>
        <textarea name="address" value={form.address} onChange={handleChange} rows={2}
          placeholder="Ej: Calle Duarte #45, Sector Villa Consuelo, cerca del colmado Los Hermanos"
          style={{ ...inputStyle, border: `1px solid ${addressError ? '#c00' : '#ddd'}`, resize: 'vertical', fontFamily: 'inherit' }} />
        {addressError && <p style={{ fontSize: 12, color: '#c00', marginTop: 6 }}>{addressError}</p>}
      </div>

      <SaveSectionButton onClick={handleSave} saving={saving} error={error} success={success} />
    </SectionCard>
  )
}
