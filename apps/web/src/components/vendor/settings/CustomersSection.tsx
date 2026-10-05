'use client'
// ============================================================
// MercadoRD — Configuración, sección: A quién vendes y condiciones
// Ruta: src/components/vendor/settings/CustomersSection.tsx
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CUSTOMER_TYPE_OPTIONS, MIN_ORDER_QUANTITY_OPTIONS } from '@/lib/vendorWizardOptions'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { CustomerType } from '@/types/database.types'
import { inputStyle, labelStyle, PlainCheckboxList } from '@/components/vendor/wizard/sharedUI'
import { SectionCard, SaveSectionButton } from './SectionCard'

interface Props {
  vendorId: string
  initialTargetCustomers: CustomerType[]
  initial: { minOrderQuantity: string; minOrderUnit: string }
  onRegisterSave?: (save: (() => Promise<boolean>) | null) => void
  hideOwnButton?: boolean
}

const CUSTOM_MARKER = '__custom__'

export function CustomersSection({ vendorId, initialTargetCustomers, initial, onRegisterSave, hideOwnButton }: Props) {
  const { t } = useTranslation('vendorOptions')
  const options = CUSTOMER_TYPE_OPTIONS.map(value => ({ value, label: t(`customerType.${value}`) }))
  const router = useRouter()
  const supabase = createClient()

  const [targetCustomers, setTargetCustomers] = useState<CustomerType[]>(initialTargetCustomers)
  const [minOrderQuantity, setMinOrderQuantity] = useState(initial.minOrderQuantity)
  const [minOrderUnit, setMinOrderUnit] = useState(initial.minOrderUnit)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const toggle = (value: CustomerType) => {
    setTargetCustomers(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])
  }

  const isPreset = minOrderQuantity !== '' && MIN_ORDER_QUANTITY_OPTIONS.includes(Number(minOrderQuantity))
  const selectValue = minOrderQuantity === '' ? '' : (isPreset ? minOrderQuantity : CUSTOM_MARKER)

  const handleSave = useCallback(async () => {
    setError(null)
    setSuccess(false)
    setSaving(true)

    const { error: deleteError } = await supabase.from('vendor_target_customers').delete().eq('vendor_id', vendorId)
    if (deleteError) {
      setSaving(false)
      console.error('[CustomersSection]', deleteError)
      setError('Ocurrió un error al guardar. Intenta de nuevo.')
      return false
    }

    if (targetCustomers.length > 0) {
      const { error: insertError } = await supabase
        .from('vendor_target_customers')
        .insert(targetCustomers.map(customer_type => ({ vendor_id: vendorId, customer_type })))
      if (insertError) {
        setSaving(false)
        console.error('[CustomersSection]', insertError)
        setError('Ocurrió un error al guardar. Intenta de nuevo.')
        return false
      }
    }

    const { error: updateError } = await supabase
      .from('vendors')
      .update({
        min_order_quantity: minOrderQuantity ? Number(minOrderQuantity) : null,
        min_order_unit: minOrderQuantity ? (minOrderUnit || 'unidades') : null,
      })
      .eq('id', vendorId)
    setSaving(false)

    if (updateError) {
      console.error('[CustomersSection]', updateError)
      setError('Ocurrió un error al guardar. Intenta de nuevo.')
      return false
    }
    setSuccess(true)
    router.refresh()
    return true
  }, [targetCustomers, minOrderQuantity, minOrderUnit, vendorId, supabase, router])

  useEffect(() => {
    onRegisterSave?.(handleSave)
    return () => onRegisterSave?.(null)
  }, [handleSave, onRegisterSave])

  return (
    <SectionCard title="A quién vendes y condiciones de compra">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" style={{ marginBottom: 18 }}>
        <div>
          <label style={labelStyle}>¿A quién le vendes?</label>
          <div style={{ marginTop: 8 }}>
            <PlainCheckboxList options={options} selected={targetCustomers} onToggle={toggle} accentColor="var(--dashboard-blue)" />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Cantidad mínima de compra</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 8 }}>
            {[{ v: '', text: 'Sin mínimo' }, ...MIN_ORDER_QUANTITY_OPTIONS.map(n => ({ v: String(n), text: `${n} ${minOrderUnit || 'unidades'}` })), { v: CUSTOM_MARKER, text: 'Personalizado' }].map(opt => {
              const checked = selectValue === opt.v
              return (
                <label key={opt.v} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 'var(--text-ui)', color: '#131A18', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="minOrderQuantity"
                    checked={checked}
                    onChange={() => setMinOrderQuantity(opt.v === CUSTOM_MARKER ? '' : opt.v)}
                    style={{ width: 16, height: 16, accentColor: 'var(--dashboard-blue)', flexShrink: 0 }}
                  />
                  {opt.text}
                </label>
              )
            })}
            {selectValue === CUSTOM_MARKER && (
              <input
                type="number"
                min="1"
                style={{ ...inputStyle, marginTop: 2 }}
                value={minOrderQuantity}
                onChange={e => setMinOrderQuantity(e.target.value)}
                placeholder="Cantidad"
              />
            )}
          </div>
        </div>
      </div>

      <SaveSectionButton onClick={handleSave} saving={saving} error={error} success={success} showButton={!hideOwnButton} />
    </SectionCard>
  )
}
