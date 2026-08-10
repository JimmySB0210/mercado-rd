'use client'
// ============================================================
// MercadoRD — Wizard vendor, Paso 4: Servicios que ofreces
// Ruta: src/components/vendor/wizard/Step4Services.tsx
// ============================================================

import { VENDOR_SERVICE_GROUPS } from '@/lib/vendorWizardOptions'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { VendorService } from '@/types/database.types'
import type { VendorWizardFormData } from './vendorWizardTypes'
import { labelStyle, helperTextStyle, SaveErrorBox, StepNavButtons, CheckboxGrid } from './sharedUI'

interface Props {
  data: VendorWizardFormData
  updateData: (patch: Partial<VendorWizardFormData>) => void
  onNext: () => void
  onBack: () => void
  saving: boolean
  error: string | null
}

export function Step4Services({ data, updateData, onNext, onBack, saving, error }: Props) {
  const { t } = useTranslation('vendorOptions')

  const toggle = (value: VendorService) => {
    updateData({
      services: data.services.includes(value)
        ? data.services.filter(v => v !== value)
        : [...data.services, value],
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={helperTextStyle}>Selecciona todos los servicios que ofreces.</p>

      {VENDOR_SERVICE_GROUPS.map(group => (
        <div key={group.titleKey}>
          <label style={labelStyle}>{t(`serviceGroupTitles.${group.titleKey}`)}</label>
          <CheckboxGrid
            options={group.options.map(value => ({ value, label: t(`service.${value}`) }))}
            selected={data.services}
            onToggle={toggle}
          />
        </div>
      ))}

      <SaveErrorBox error={error} />
      <StepNavButtons onBack={onBack} onNext={onNext} saving={saving} />
    </div>
  )
}
