'use client'
// ============================================================
// MercadoRD — Configuración, sección: A quién vendes y condiciones
// Ruta: src/components/vendor/settings/CustomersSection.tsx
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CUSTOMER_TYPE_OPTIONS, MIN_ORDER_QUANTITY_OPTIONS } from '@/lib/vendorWizardOptions'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { CustomerType } from '@/types/database.types'
import { inputStyle, labelStyle, CheckboxGrid } from '@/components/vendor/wizard/sharedUI'
import { SectionCard, SaveSectionButton } from './SectionCard'

interface Props {
  vendorId: string
  initialTargetCustomers: CustomerType[]
  initial: { minOrderQuantity: string; minOrderUnit: string }
}

const CUSTOM_MARKER = '__custom__'

export function CustomersSection({ vendorId, initialTargetCustomers, initial }: Props) {
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

  const handleSave = async () => {
    setError(null)
    setSuccess(false)
    setSaving(true)

    const { error: deleteError } = await supabase.from('vendor_target_customers').delete().eq('vendor_id', vendorId)
    if (deleteError) {
      setSaving(false)
      console.error('[CustomersSection]', deleteError)
      setError('Ocurrió un error al guardar. Intenta de nuevo.')
      return
    }

    if (targetCustomers.length > 0) {
      const { error: insertError } = await supabase
        .from('vendor_target_customers')
        .insert(targetCustomers.map(customer_type => ({ vendor_id: vendorId, customer_type })))
      if (insertError) {
        setSaving(false)
        console.error('[CustomersSection]', insertError)
        setError('Ocurrió un error al guardar. Intenta de nuevo.')
        return
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
      return
    }
    setSuccess(true)
    router.refresh()
  }

  return (
    <SectionCard title="A quién vendes y condiciones de compra">
      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle}>¿A quién le vendes?</label>
        <div style={{ marginTop: 8 }}>
          <CheckboxGrid options={options} selected={targetCustomers} onToggle={toggle} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Cantidad mínima de compra</label>
        <div style={{ display: 'grid', gridTemplateColumns: selectValue === CUSTOM_MARKER ? '1fr 1fr' : '1fr', gap: 10 }}>
          <select
            style={{ ...inputStyle, background: '#fff' }}
            value={selectValue}
            onChange={e => {
              const v = e.target.value
              setMinOrderQuantity(v === CUSTOM_MARKER ? '' : v)
            }}
          >
            <option value="">Sin mínimo</option>
            {MIN_ORDER_QUANTITY_OPTIONS.map(n => (
              <option key={n} value={n}>{n} {minOrderUnit || 'unidades'}</option>
            ))}
            <option value={CUSTOM_MARKER}>Personalizado</option>
          </select>
          {selectValue === CUSTOM_MARKER && (
            <input
              type="number"
              min="1"
              style={inputStyle}
              value={minOrderQuantity}
              onChange={e => setMinOrderQuantity(e.target.value)}
              placeholder="Cantidad"
            />
          )}
        </div>
      </div>

      <SaveSectionButton onClick={handleSave} saving={saving} error={error} success={success} />
    </SectionCard>
  )
}
