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

import { useEffect, useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { createClient } from '@/lib/supabase/client'
import type { CategoryAttribute, AttributeOption } from '@/types/database.types'

// Convención de la BD: una option con value 'otro' en un atributo select
// habilita "escribir tu propio valor" — genérico para cualquier atributo
// select que la tenga (hoy: Modelo en Smartphones), no solo Talla (que
// tiene su propio patrón separado, hardcodeado, en ProductForm.tsx para
// el sistema viejo de variantes fijas).
const OTHER_OPTION_VALUE = 'otro'

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

  // Qué atributos select están en modo "escribir mi propio valor" — no se
  // puede derivar solo de values[attr.id] porque, apenas se elige 'Otro',
  // el valor real se deja en '' para que el input libre lo llene (así
  // isAttrFilled en ProductForm.tsx no cuenta 'otro' como un valor real).
  // Solo agrega (nunca quita) automáticamente, para no pelear con lo que
  // el vendor ya seleccionó — quitar del modo custom es una acción
  // explícita en handleSelectChange.
  const [customModeIds, setCustomModeIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    setCustomModeIds(prev => {
      let changed = false
      const next = new Set(prev)
      for (const attr of attributes) {
        if (attr.attribute_type !== 'select' || next.has(attr.id)) continue
        const val = values[attr.id]
        if (typeof val !== 'string' || !val) continue
        const options = optionsMap.get(attr.id) ?? []
        if (!options.some(o => o.value === OTHER_OPTION_VALUE)) continue
        if (!options.some(o => o.value === val)) {
          next.add(attr.id)
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [attributes, optionsMap, values])

  // Filtrado dependiente genérico (ej. Modelo depende de Marca): cuando el
  // valor de `attr` cambia, cualquier otro select cuya opción YA elegida
  // dependía de `attr.attribute_key` con un depends_on_value distinto al
  // nuevo valor queda "huérfano" — se limpia en vez de dejarlo elegido
  // pero invisible en las opciones ya filtradas.
  const setValueAndClearOrphanedDependents = (attr: CategoryAttribute, newValue: string) => {
    onChange(attr.id, newValue)

    for (const dependent of attributes) {
      if (dependent.attribute_type !== 'select' || dependent.id === attr.id) continue
      const dependentValue = values[dependent.id]
      if (typeof dependentValue !== 'string' || !dependentValue) continue

      const currentOption = (optionsMap.get(dependent.id) ?? []).find(o => o.value === dependentValue)
      if (currentOption?.depends_on_attribute_key !== attr.attribute_key) continue
      if (currentOption.depends_on_value !== newValue) {
        onChange(dependent.id, '')
      }
    }
  }

  const handleSelectChange = (attr: CategoryAttribute, newValue: string) => {
    if (newValue === OTHER_OPTION_VALUE) {
      setCustomModeIds(prev => new Set(prev).add(attr.id))
      setValueAndClearOrphanedDependents(attr, '')
    } else {
      setCustomModeIds(prev => {
        if (!prev.has(attr.id)) return prev
        const next = new Set(prev)
        next.delete(attr.id)
        return next
      })
      setValueAndClearOrphanedDependents(attr, newValue)
    }
  }

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

      case 'select': {
        const isCustom = customModeIds.has(attr.id)
        const allOptions = optionsMap.get(attr.id) ?? []

        // Detecta si ESTE atributo depende de otro (ej. Modelo → Marca).
        // Asume una sola clave controladora por atributo (el caso real
        // hoy) — si en el futuro hubiera varias, el filtrado por opción
        // sigue siendo correcto igual, solo no se deshabilita el select.
        const dependencyKeys = [...new Set(allOptions.map(o => o.depends_on_attribute_key).filter((k): k is string => !!k))]
        const dependencyKey = dependencyKeys.length === 1 ? dependencyKeys[0] : null
        const dependencyAttr = dependencyKey ? attributes.find(a => a.attribute_key === dependencyKey) : undefined
        const dependencyValue = dependencyAttr ? values[dependencyAttr.id] : undefined
        const dependencyUnmet = !!dependencyAttr && (typeof dependencyValue !== 'string' || !dependencyValue)

        const visibleOptions = allOptions.filter(opt => {
          if (!opt.depends_on_attribute_key) return true
          const controllingAttr = attributes.find(a => a.attribute_key === opt.depends_on_attribute_key)
          const controllingValue = controllingAttr ? values[controllingAttr.id] : undefined
          return controllingValue === opt.depends_on_value
        })

        return (
          <div>
            <select
              value={isCustom ? OTHER_OPTION_VALUE : (typeof value === 'string' ? value : '')}
              onChange={e => handleSelectChange(attr, e.target.value)}
              disabled={dependencyUnmet}
              className={`${inputClass} bg-white ${dependencyUnmet ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
            >
              <option value="">{t('selectAttributePlaceholder')}</option>
              {visibleOptions.map(opt => (
                <option key={opt.id} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {dependencyUnmet && dependencyAttr && (
              <p className="text-xs text-gray-400 mt-1">{t('selectDependencyFirstHint', { label: dependencyAttr.attribute_label })}</p>
            )}
            {isCustom && (
              <input
                type="text"
                value={typeof value === 'string' ? value : ''}
                onChange={e => onChange(attr.id, e.target.value)}
                placeholder={t('customAttributeValuePlaceholder')}
                className={`${inputClass} mt-2`}
              />
            )}
          </div>
        )
      }

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
