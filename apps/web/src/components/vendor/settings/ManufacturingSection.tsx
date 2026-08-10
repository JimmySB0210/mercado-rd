'use client'
// ============================================================
// MercadoRD — Configuración, sección: Fabricación
// Ruta: src/components/vendor/settings/ManufacturingSection.tsx
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MANUFACTURING_STATUS_OPTIONS, PRODUCTION_TIME_OPTIONS } from '@/lib/vendorWizardOptions'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { ManufacturingStatus, ProductionTimeRange, CustomizationOption } from '@/types/database.types'
import { BRAND } from '@/lib/colors'
import { inputStyle, labelStyle, helperTextStyle, YesNoToggle, SegmentedChoice } from '@/components/vendor/wizard/sharedUI'
import { SectionCard, SaveSectionButton } from './SectionCard'

interface Props {
  vendorId: string
  initial: {
    manufacturingStatus: ManufacturingStatus | null
    productionTime: ProductionTimeRange | null
    productionTimeCustom: string
    acceptsPrivateLabel: boolean | null
    allowsCustomization: CustomizationOption | null
  }
}

const CUSTOMIZATION_VALUES = ['yes', 'no', 'depends'] as const

export function ManufacturingSection({ vendorId, initial }: Props) {
  const { t } = useTranslation('vendorOptions')
  const manufacturingOptions = MANUFACTURING_STATUS_OPTIONS.map(value => ({ value, label: t(`manufacturingStatus.${value}`) }))
  const customizationOptions = CUSTOMIZATION_VALUES.map(value => ({ value, label: t(`customizationOption.${value}`) }))
  const router = useRouter()
  const supabase = createClient()

  const [manufacturingStatus, setManufacturingStatus] = useState(initial.manufacturingStatus)
  const [productionTime, setProductionTime] = useState(initial.productionTime)
  const [productionTimeCustom, setProductionTimeCustom] = useState(initial.productionTimeCustom)
  const [acceptsPrivateLabel, setAcceptsPrivateLabel] = useState(initial.acceptsPrivateLabel)
  const [allowsCustomization, setAllowsCustomization] = useState(initial.allowsCustomization)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const showManufacturingFields = manufacturingStatus === 'fabricates_own' || manufacturingStatus === 'mixed'

  const handleSave = async () => {
    setError(null)
    setSuccess(false)
    setSaving(true)

    const { error: updateError } = await supabase
      .from('vendors')
      .update({
        manufacturing_status: manufacturingStatus,
        production_time: showManufacturingFields ? productionTime : null,
        production_time_custom: showManufacturingFields && productionTime === 'custom' ? (productionTimeCustom.trim() || null) : null,
        accepts_private_label: showManufacturingFields ? acceptsPrivateLabel : null,
        allows_customization: showManufacturingFields ? allowsCustomization : null,
      })
      .eq('id', vendorId)
    setSaving(false)

    if (updateError) {
      console.error('[ManufacturingSection]', updateError)
      setError('Ocurrió un error al guardar. Intenta de nuevo.')
      return
    }
    setSuccess(true)
    router.refresh()
  }

  return (
    <SectionCard title="Fabricación">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SegmentedChoice
          label="¿Tú fabricas alguno de los productos que ofreces?"
          options={manufacturingOptions}
          value={manufacturingStatus}
          onChange={setManufacturingStatus}
        />

        {showManufacturingFields && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 14, background: BRAND.bg, borderRadius: 8 }}>
            <p style={helperTextStyle}>Ya que fabricas (o fabricas en parte) lo que vendes:</p>

            <div>
              <label style={labelStyle}>Tiempo de producción</label>
              <select
                style={{ ...inputStyle, background: '#fff' }}
                value={productionTime ?? ''}
                onChange={e => setProductionTime((e.target.value || null) as ProductionTimeRange | null)}
              >
                <option value="">Selecciona...</option>
                {PRODUCTION_TIME_OPTIONS.map(value => (
                  <option key={value} value={value}>{t(`productionTime.${value}`)}</option>
                ))}
              </select>
              {productionTime === 'custom' && (
                <input
                  style={{ ...inputStyle, marginTop: 8 }}
                  value={productionTimeCustom}
                  onChange={e => setProductionTimeCustom(e.target.value)}
                  placeholder="Describe el tiempo de producción"
                />
              )}
            </div>

            <YesNoToggle label="¿Fabricas bajo la marca del cliente?" value={acceptsPrivateLabel} onChange={setAcceptsPrivateLabel} />

            <SegmentedChoice
              label="¿Permites personalización?"
              options={customizationOptions}
              value={allowsCustomization}
              onChange={setAllowsCustomization}
            />
          </div>
        )}
      </div>

      <SaveSectionButton onClick={handleSave} saving={saving} error={error} success={success} />
    </SectionCard>
  )
}
