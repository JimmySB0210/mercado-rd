'use client'
// ============================================================
// MercadoRD — Wizard vendor, Paso 1: Información básica
// Ruta: src/components/vendor/wizard/Step1BasicInfo.tsx
// ============================================================

import { BRAND } from '@/lib/colors'
import type { VendorWizardFormData } from './vendorWizardTypes'

interface ProvinceOption { id: number; name: string }

// Un mensaje por campo — mostrarlos junto a su input evita que el
// usuario no sepa cuál corregir (antes era un solo error genérico).
export interface Step1Errors {
  businessName?: string
  provinceId?: string
  address?: string
  whatsapp?: string
}

interface Props {
  data: VendorWizardFormData
  updateData: (patch: Partial<VendorWizardFormData>) => void
  provinces: ProvinceOption[]
  onNext: () => void
  saving: boolean
  errors: Step1Errors
  saveError: string | null
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #E0E0E0', borderRadius: 8, padding: '11px 13px',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
}

const errorInputStyle: React.CSSProperties = {
  ...inputStyle, border: '1px solid #FECACA',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: BRAND.dark, display: 'block', marginBottom: 5,
}

const fieldErrorStyle: React.CSSProperties = {
  color: '#B91C1C', fontSize: 12, marginTop: 4,
}

function YesNoToggle({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div>
      <span style={labelStyle}>{label}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        {[{ v: true, text: 'Sí' }, { v: false, text: 'No' }].map(opt => (
          <button
            key={String(opt.v)}
            type="button"
            onClick={() => onChange(opt.v)}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: value === opt.v ? `1.5px solid ${BRAND.blue}` : '1px solid #E0E0E0',
              background: value === opt.v ? 'color-mix(in srgb, ' + BRAND.blue + ' 8%, white)' : '#fff',
              color: value === opt.v ? BRAND.blue : BRAND.dark,
            }}
          >
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Step1BasicInfo({ data, updateData, provinces, onNext, saving, errors, saveError }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={labelStyle}>Nombre del negocio *</label>
        <input
          style={errors.businessName ? errorInputStyle : inputStyle}
          value={data.businessName}
          onChange={e => updateData({ businessName: e.target.value })}
          placeholder="Ej. Distribuidora Hermanos Peña"
        />
        {errors.businessName && <p style={fieldErrorStyle}>{errors.businessName}</p>}
      </div>

      <div>
        <label style={labelStyle}>Razón social (opcional)</label>
        <input
          style={inputStyle}
          value={data.legalName}
          onChange={e => updateData({ legalName: e.target.value })}
          placeholder="Nombre legal registrado, si es distinto"
        />
      </div>

      <div>
        <label style={labelStyle}>Nombre completo del contacto (opcional)</label>
        <input
          style={inputStyle}
          value={data.contactFullName}
          onChange={e => updateData({ contactFullName: e.target.value })}
          placeholder="Tu nombre completo"
        />
      </div>

      <div>
        <label style={labelStyle}>WhatsApp (opcional)</label>
        <input
          style={errors.whatsapp ? errorInputStyle : inputStyle}
          value={data.whatsapp}
          onChange={e => updateData({ whatsapp: e.target.value })}
          placeholder="809-555-5555"
        />
        {errors.whatsapp && <p style={fieldErrorStyle}>{errors.whatsapp}</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Provincia *</label>
          <select
            style={errors.provinceId ? { ...errorInputStyle, background: '#fff' } : { ...inputStyle, background: '#fff' }}
            value={data.provinceId}
            onChange={e => updateData({ provinceId: e.target.value })}
          >
            <option value="">Selecciona...</option>
            {provinces.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {errors.provinceId && <p style={fieldErrorStyle}>{errors.provinceId}</p>}
        </div>
        <div>
          <label style={labelStyle}>Municipio (opcional)</label>
          <input
            style={inputStyle}
            value={data.municipio}
            onChange={e => updateData({ municipio: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Sector (opcional)</label>
        <input
          style={inputStyle}
          value={data.sector}
          onChange={e => updateData({ sector: e.target.value })}
        />
      </div>

      <div>
        <label style={labelStyle}>Dirección del negocio *</label>
        <textarea
          style={errors.address ? { ...errorInputStyle, resize: 'vertical', minHeight: 70 } : { ...inputStyle, resize: 'vertical', minHeight: 70 }}
          value={data.address}
          onChange={e => updateData({ address: e.target.value })}
          placeholder="Ej: Calle Duarte #45, cerca del colmado Los Hermanos"
        />
        {errors.address && <p style={fieldErrorStyle}>{errors.address}</p>}
      </div>

      <YesNoToggle
        label="¿Tienes tienda física?"
        value={data.hasPhysicalStore}
        onChange={v => updateData({ hasPhysicalStore: v })}
      />
      <YesNoToggle
        label="¿Tienes almacén?"
        value={data.hasWarehouse}
        onChange={v => updateData({ hasWarehouse: v })}
      />
      <YesNoToggle
        label="¿Tienes taller?"
        value={data.hasWorkshop}
        onChange={v => updateData({ hasWorkshop: v })}
      />

      {saveError && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', fontSize: 13, borderRadius: 8, padding: '10px 12px' }}>
          {saveError}
        </div>
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={saving}
        style={{
          background: BRAND.blue, color: '#fff', border: 'none', padding: 14, borderRadius: 8,
          fontWeight: 600, fontSize: 15, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? 'Guardando...' : 'Continuar'}
      </button>
    </div>
  )
}
