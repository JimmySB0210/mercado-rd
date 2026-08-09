'use client'
// ============================================================
// MercadoRD — Wizard vendor, Paso 5: A quién vendes + condiciones
// Ruta: src/components/vendor/wizard/Step5Customers.tsx
// ============================================================

import { CUSTOMER_TYPE_OPTIONS, MIN_ORDER_QUANTITY_OPTIONS } from '@/lib/vendorWizardOptions'
import type { CustomerType } from '@/types/database.types'
import type { VendorWizardFormData } from './vendorWizardTypes'
import { inputStyle, labelStyle, helperTextStyle, SaveErrorBox, StepNavButtons, CheckboxGrid } from './sharedUI'

interface Props {
  data: VendorWizardFormData
  updateData: (patch: Partial<VendorWizardFormData>) => void
  onNext: () => void
  onBack: () => void
  saving: boolean
  error: string | null
}

const CUSTOM_MARKER = '__custom__'

export function Step5Customers({ data, updateData, onNext, onBack, saving, error }: Props) {
  const toggle = (value: CustomerType) => {
    updateData({
      targetCustomers: data.targetCustomers.includes(value)
        ? data.targetCustomers.filter(v => v !== value)
        : [...data.targetCustomers, value],
    })
  }

  const isPreset = data.minOrderQuantity !== '' && MIN_ORDER_QUANTITY_OPTIONS.includes(Number(data.minOrderQuantity))
  const selectValue = data.minOrderQuantity === '' ? '' : (isPreset ? data.minOrderQuantity : CUSTOM_MARKER)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <label style={labelStyle}>¿A quién le vendes?</label>
        <p style={{ ...helperTextStyle, marginBottom: 10 }}>Selecciona todas las que apliquen.</p>
        <CheckboxGrid options={CUSTOMER_TYPE_OPTIONS} selected={data.targetCustomers} onToggle={toggle} />
      </div>

      <div>
        <label style={labelStyle}>Cantidad mínima de compra (opcional)</label>
        <div style={{ display: 'grid', gridTemplateColumns: selectValue === CUSTOM_MARKER ? '1fr 1fr' : '1fr', gap: 10 }}>
          <select
            style={{ ...inputStyle, background: '#fff' }}
            value={selectValue}
            onChange={e => {
              const v = e.target.value
              if (v === CUSTOM_MARKER) {
                updateData({ minOrderQuantity: '' })
              } else {
                updateData({ minOrderQuantity: v })
              }
            }}
          >
            <option value="">Sin mínimo</option>
            {MIN_ORDER_QUANTITY_OPTIONS.map(n => (
              <option key={n} value={n}>{n} {data.minOrderUnit || 'unidades'}</option>
            ))}
            <option value={CUSTOM_MARKER}>Personalizado</option>
          </select>
          {selectValue === CUSTOM_MARKER && (
            <input
              type="number"
              min="1"
              style={inputStyle}
              value={data.minOrderQuantity}
              onChange={e => updateData({ minOrderQuantity: e.target.value })}
              placeholder="Cantidad"
            />
          )}
        </div>
      </div>

      <SaveErrorBox error={error} />
      <StepNavButtons onBack={onBack} onNext={onNext} saving={saving} />
    </div>
  )
}
