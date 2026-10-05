'use client'
// ============================================================
// MercadoRD — Configuración, sección: Fabricación
// Ruta: src/components/vendor/settings/ManufacturingSection.tsx
// ============================================================

import { useCallback, useEffect, useState } from 'react'
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
  onRegisterSave?: (save: (() => Promise<boolean>) | null) => void
  hideOwnButton?: boolean
}

const CUSTOMIZATION_VALUES = ['yes', 'no', 'depends'] as const

export function ManufacturingSection({ vendorId, initial, onRegisterSave, hideOwnButton }: Props) {
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

  const handleSave = useCallback(async () => {
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
      return false
    }
    setSuccess(true)
    router.refresh()
    return true
  }, [manufacturingStatus, productionTime, productionTimeCustom, acceptsPrivateLabel, allowsCustomization, showManufacturingFields, vendorId, supabase, router])

  useEffect(() => {
    onRegisterSave?.(handleSave)
    return () => onRegisterSave?.(null)
  }, [handleSave, onRegisterSave])

  return (
    <SectionCard title="Fabricación">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>¿Tú fabricas alguno de los productos que ofreces?</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            {manufacturingOptions.map(opt => {
              const checked = manufacturingStatus === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setManufacturingStatus(opt.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 0', minWidth: 140,
                    padding: '9px 14px', borderRadius: 999, fontSize: 'var(--text-small)', fontWeight: 600, cursor: 'pointer',
                    border: checked ? '1.5px solid var(--dashboard-blue)' : '1px solid #E0E0E0',
                    background: checked ? 'color-mix(in srgb, var(--dashboard-blue) 8%, white)' : '#fff',
                    color: checked ? 'var(--dashboard-blue)' : BRAND.dark,
                  }}
                >
                  <span style={{
                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                    border: checked ? 'none' : '1.5px solid #ccc',
                    background: checked ? 'var(--dashboard-blue)' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {checked && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                  </span>
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <YesNoToggle label="¿Fabricas bajo la marca del cliente?" value={acceptsPrivateLabel} onChange={setAcceptsPrivateLabel} accentColor="var(--dashboard-blue)" />

              <SegmentedChoice
                label="¿Permites personalización?"
                options={customizationOptions}
                value={allowsCustomization}
                onChange={setAllowsCustomization}
                accentColor="var(--dashboard-blue)"
              />
            </div>
          </div>
        )}
      </div>

      <SaveSectionButton onClick={handleSave} saving={saving} error={error} success={success} showButton={!hideOwnButton} />
    </SectionCard>
  )
}
