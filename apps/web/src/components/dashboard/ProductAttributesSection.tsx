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

import { useTranslation } from '@/lib/hooks/useTranslation'
import type { CategoryAttribute, AttributeOption } from '@/types/database.types'

export type AttributeValue = string | string[] | boolean
export type AttributeValuesState = Record<number, AttributeValue>

interface Props {
  attributes: CategoryAttribute[]
  optionsMap: Map<number, AttributeOption[]>
  values: AttributeValuesState
  onChange: (attributeId: number, value: AttributeValue) => void
}

const inputClass = 'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none'

export function ProductAttributesSection({ attributes, optionsMap, values, onChange }: Props) {
  const { t } = useTranslation('dashboard')

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
      default:
        return (
          <input
            type="text"
            value={typeof value === 'string' ? value : ''}
            onChange={e => onChange(attr.id, e.target.value)}
            className={inputClass}
          />
        )
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
