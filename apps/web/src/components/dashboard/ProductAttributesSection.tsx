'use client'
// ============================================================
// MercadoRD — Campos dinámicos de atributos por categoría
// Ruta: src/components/dashboard/ProductAttributesSection.tsx
// ============================================================
// Usado por ProductForm cuando la categoría seleccionada tiene
// category_attributes definidos (tipo de producto). Solo recibe los
// atributos con applies_to_variant = false — los que sí aplican a
// variante se manejan aparte, como dimensiones de la tabla de
// variantes, no como campos fijos aquí.
// ============================================================

import { useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { createClient } from '@/lib/supabase/client'
import type { CategoryAttribute, AttributeOption } from '@/types/database.types'

export type AttributeValue = string | string[] | boolean
export type AttributeValuesState = Record<number, AttributeValue>

interface Props {
  attributes: CategoryAttribute[]
  optionsMap: Map<number, AttributeOption[]>
  values: AttributeValuesState
  onChange: (attributeId: number, value: AttributeValue) => void
  // Verificación externa (IMEI/VIN) — solo tiene sentido en modo editar,
  // con un product_id real ya guardado en la base de datos.
  mode?: 'crear' | 'editar'
  productId?: string | null
}

const inputClass = 'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none'

// Atributos de texto que tienen una verificación externa disponible —
// arquitectura lista, sin proveedor conectado todavía, así que la RPC
// siempre responde 'unavailable'. Mapea attribute_key → el valor del
// enum external_verification_type que espera la función.
const VERIFIABLE_ATTRIBUTES: Record<string, 'imei' | 'vehicle_vin'> = {
  imei: 'imei',
  vin: 'vehicle_vin',
}

export function ProductAttributesSection({ attributes, optionsMap, values, onChange, mode, productId }: Props) {
  const { t } = useTranslation('dashboard')
  const [verifying, setVerifying] = useState<Record<number, boolean>>({})
  const [verifyNotices, setVerifyNotices] = useState<Record<number, string>>({})

  const handleVerify = async (attr: CategoryAttribute) => {
    const verificationType = VERIFIABLE_ATTRIBUTES[attr.attribute_key]
    const currentValue = values[attr.id]
    if (!verificationType || !productId || typeof currentValue !== 'string' || !currentValue.trim()) return

    setVerifying(prev => ({ ...prev, [attr.id]: true }))
    const supabase = createClient()
    const { data, error } = await supabase.rpc('request_external_verification', {
      p_verification_type: verificationType,
      p_input_data: { [attr.attribute_key]: currentValue.trim() },
      p_target_type: 'product',
      p_target_id: productId,
    })
    setVerifying(prev => ({ ...prev, [attr.id]: false }))

    if (error) console.error('[ProductAttributesSection verify]', error)
    const message = !error && data?.message ? data.message : t('verificationRequestError')
    setVerifyNotices(prev => ({ ...prev, [attr.id]: message }))
    setTimeout(() => {
      setVerifyNotices(prev => {
        const next = { ...prev }
        delete next[attr.id]
        return next
      })
    }, 6000)
  }

  if (attributes.length === 0) return null

  const required = attributes.filter(a => a.is_required)
  const recommended = attributes.filter(a => !a.is_required && a.is_recommended)
  const optional = attributes.filter(a => !a.is_required && !a.is_recommended)

  const renderField = (attr: CategoryAttribute) => {
    const value = values[attr.id]

    switch (attr.attribute_type) {
      case 'number':
        return (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={typeof value === 'string' ? value : ''}
              onChange={e => onChange(attr.id, e.target.value)}
              className={inputClass}
            />
            {attr.unit && <span className="text-xs text-gray-400 flex-shrink-0">{attr.unit}</span>}
          </div>
        )

      case 'select':
        return (
          <select
            value={typeof value === 'string' ? value : ''}
            onChange={e => onChange(attr.id, e.target.value)}
            className={`${inputClass} bg-white`}
          >
            <option value="">{t('selectAttributePlaceholder')}</option>
            {(optionsMap.get(attr.id) ?? []).map(opt => (
              <option key={opt.id} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )

      case 'multiselect': {
        const selected = Array.isArray(value) ? value : []
        const options = optionsMap.get(attr.id) ?? []
        return (
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {options.map(opt => {
              const checked = selected.includes(opt.value)
              return (
                <label key={opt.id} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? selected.filter(v => v !== opt.value)
                        : [...selected, opt.value]
                      onChange(attr.id, next)
                    }}
                  />
                  {opt.label}
                </label>
              )
            })}
          </div>
        )
      }

      case 'boolean': {
        const boolValue = typeof value === 'boolean' ? value : null
        return (
          <div className="flex gap-2">
            {[{ v: true, label: t('booleanYes') }, { v: false, label: t('booleanNo') }].map(opt => (
              <button
                key={String(opt.v)}
                type="button"
                onClick={() => onChange(attr.id, opt.v)}
                className="flex-1 py-2 rounded-lg text-sm font-medium border transition-colors"
                style={
                  boolValue === opt.v
                    ? { background: '#EAF1FC', borderColor: '#2563EB', color: '#2563EB' }
                    : { background: '#fff', borderColor: '#e5e7eb', color: '#374151' }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        )
      }

      case 'text':
      default: {
        const verificationType = VERIFIABLE_ATTRIBUTES[attr.attribute_key]
        const showVerifyButton = verificationType && mode === 'editar' && !!productId
        const currentValue = typeof value === 'string' ? value : ''

        return (
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={currentValue}
                onChange={e => onChange(attr.id, e.target.value)}
                className={inputClass}
              />
              {showVerifyButton && (
                <button
                  type="button"
                  onClick={() => handleVerify(attr)}
                  disabled={verifying[attr.id] || !currentValue.trim()}
                  className="flex-shrink-0 text-xs font-medium px-3 py-2.5 rounded-lg border border-gray-200 bg-white whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying[attr.id] ? t('verifyingLabel') : t('verifyAttributeButton', { label: attr.attribute_key.toUpperCase() })}
                </button>
              )}
            </div>
            {verifyNotices[attr.id] && (
              <p className="text-xs text-blue-600 mt-1.5">{verifyNotices[attr.id]}</p>
            )}
          </div>
        )
      }
    }
  }

  const renderGroup = (heading: string, items: CategoryAttribute[]) => {
    if (items.length === 0) return null
    return (
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{heading}</p>
        <div className="space-y-3">
          {items.map(attr => (
            <div key={attr.id}>
              <label className="text-xs text-gray-500 mb-1 block">{attr.attribute_label}</label>
              {renderField(attr)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {renderGroup(t('requiredAttributesHeading'), required)}
      {renderGroup(t('recommendedAttributesHeading'), recommended)}
      {renderGroup(t('optionalAttributesHeading'), optional)}
    </div>
  )
}
