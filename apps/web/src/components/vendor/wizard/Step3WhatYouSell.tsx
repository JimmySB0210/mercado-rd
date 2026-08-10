'use client'
// ============================================================
// MercadoRD — Wizard vendor, Paso 3: Qué vende + fabricación
// Ruta: src/components/vendor/wizard/Step3WhatYouSell.tsx
// ============================================================

import { BRAND } from '@/lib/colors'
import { MANUFACTURING_STATUS_OPTIONS, PRODUCTION_TIME_OPTIONS } from '@/lib/vendorWizardOptions'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { Category } from '@/types/database.types'
import type { VendorWizardFormData } from './vendorWizardTypes'
import { inputStyle, labelStyle, helperTextStyle, SaveErrorBox, StepNavButtons, YesNoToggle, SegmentedChoice } from './sharedUI'
import { CategoryMultiSelect } from './CategoryMultiSelect'

interface Props {
  data: VendorWizardFormData
  updateData: (patch: Partial<VendorWizardFormData>) => void
  categories: Category[]
  onNext: () => void
  onBack: () => void
  saving: boolean
  error: string | null
}

const CUSTOMIZATION_VALUES = ['yes', 'no', 'depends'] as const

export function Step3WhatYouSell({ data, updateData, categories, onNext, onBack, saving, error }: Props) {
  const { t } = useTranslation('vendorOptions')
  const manufacturingOptions = MANUFACTURING_STATUS_OPTIONS.map(value => ({ value, label: t(`manufacturingStatus.${value}`) }))
  const customizationOptions = CUSTOMIZATION_VALUES.map(value => ({ value, label: t(`customizationOption.${value}`) }))
  const showManufacturingFields = data.manufacturingStatus === 'fabricates_own' || data.manufacturingStatus === 'mixed'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <label style={labelStyle}>¿Qué categorías de productos vendes? *</label>
        <CategoryMultiSelect
          categories={categories}
          selectedIds={data.categoryIds}
          onChange={ids => updateData({ categoryIds: ids })}
        />
      </div>

      <SegmentedChoice
        label="¿Tú fabricas alguno de los productos que ofreces?"
        options={manufacturingOptions}
        value={data.manufacturingStatus}
        onChange={v => updateData({ manufacturingStatus: v })}
      />

      {showManufacturingFields && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 14, background: BRAND.bg, borderRadius: 8 }}>
          <p style={helperTextStyle}>Ya que fabricas (o fabricas en parte) lo que vendes:</p>

          <div>
            <label style={labelStyle}>Tiempo de producción</label>
            <select
              style={{ ...inputStyle, background: '#fff' }}
              value={data.productionTime ?? ''}
              onChange={e => updateData({ productionTime: (e.target.value || null) as VendorWizardFormData['productionTime'] })}
            >
              <option value="">Selecciona...</option>
              {PRODUCTION_TIME_OPTIONS.map(value => (
                <option key={value} value={value}>{t(`productionTime.${value}`)}</option>
              ))}
            </select>
            {data.productionTime === 'custom' && (
              <input
                style={{ ...inputStyle, marginTop: 8 }}
                value={data.productionTimeCustom}
                onChange={e => updateData({ productionTimeCustom: e.target.value })}
                placeholder="Describe el tiempo de producción"
              />
            )}
          </div>

          <YesNoToggle
            label="¿Fabricas bajo la marca del cliente?"
            value={data.acceptsPrivateLabel}
            onChange={v => updateData({ acceptsPrivateLabel: v })}
          />

          <SegmentedChoice
            label="¿Permites personalización?"
            options={customizationOptions}
            value={data.allowsCustomization}
            onChange={v => updateData({ allowsCustomization: v })}
          />
        </div>
      )}

      <SaveErrorBox error={error} />
      <StepNavButtons onBack={onBack} onNext={onNext} saving={saving} />
    </div>
  )
}
