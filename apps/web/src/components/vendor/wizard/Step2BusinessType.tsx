'use client'
// ============================================================
// MercadoRD — Wizard vendor, Paso 2: Tipo de negocio
// Ruta: src/components/vendor/wizard/Step2BusinessType.tsx
// ============================================================

import { BUSINESS_TYPE_OPTIONS } from '@/lib/vendorWizardOptions'
import type { BusinessType } from '@/types/database.types'
import type { VendorWizardFormData } from './vendorWizardTypes'
import { helperTextStyle, SaveErrorBox, StepNavButtons, CheckboxGrid } from './sharedUI'

interface Props {
  data: VendorWizardFormData
  updateData: (patch: Partial<VendorWizardFormData>) => void
  onNext: () => void
  onBack: () => void
  saving: boolean
  error: string | null
}

export function Step2BusinessType({ data, updateData, onNext, onBack, saving, error }: Props) {
  const toggle = (value: BusinessType) => {
    updateData({
      businessTypes: data.businessTypes.includes(value)
        ? data.businessTypes.filter(v => v !== value)
        : [...data.businessTypes, value],
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={helperTextStyle}>¿Cuál es tu tipo de negocio? Selecciona todas las que apliquen.</p>

      <CheckboxGrid options={BUSINESS_TYPE_OPTIONS} selected={data.businessTypes} onToggle={toggle} />

      <SaveErrorBox error={error} />
      <StepNavButtons onBack={onBack} onNext={onNext} saving={saving} />
    </div>
  )
}
