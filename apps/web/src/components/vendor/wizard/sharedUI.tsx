'use client'
// ============================================================
// MercadoRD — UI compartida entre los pasos 2-6 del wizard de vendor
// Ruta: src/components/vendor/wizard/sharedUI.tsx
// ============================================================

import { BRAND } from '@/lib/colors'

export const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #E0E0E0', borderRadius: 8, padding: '11px 13px',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
}

export const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: BRAND.dark, display: 'block', marginBottom: 5,
}

export const helperTextStyle: React.CSSProperties = {
  fontSize: 13, color: BRAND.gray, margin: 0,
}

export function SaveErrorBox({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', fontSize: 13, borderRadius: 8, padding: '10px 12px' }}>
      {error}
    </div>
  )
}

export function StepNavButtons({ onBack, onNext, saving, nextLabel = 'Continuar' }: {
  onBack: () => void
  onNext: () => void
  saving: boolean
  nextLabel?: string
}) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <button
        type="button"
        onClick={onBack}
        style={{ flex: 1, background: '#fff', color: BRAND.blue, border: `1px solid ${BRAND.blue}`, padding: 14, borderRadius: 8, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
      >
        ← Atrás
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={saving}
        style={{
          flex: 2, background: BRAND.blue, color: '#fff', border: 'none', padding: 14, borderRadius: 8,
          fontWeight: 600, fontSize: 15, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? 'Guardando...' : nextLabel}
      </button>
    </div>
  )
}

interface CheckboxOption<T extends string> { value: T; label: string }

export function CheckboxGrid<T extends string>({ options, selected, onToggle, columns = 2 }: {
  options: CheckboxOption<T>[]
  selected: T[]
  onToggle: (value: T) => void
  columns?: number
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 8 }}>
      {options.map(opt => {
        const checked = selected.includes(opt.value)
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onToggle(opt.value)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
              padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
              border: checked ? `1.5px solid ${BRAND.blue}` : '1px solid #E0E0E0',
              background: checked ? 'color-mix(in srgb, ' + BRAND.blue + ' 6%, white)' : '#fff',
              color: BRAND.dark,
            }}
          >
            <span style={{
              width: 16, height: 16, borderRadius: 4, flexShrink: 0,
              border: checked ? 'none' : '1.5px solid #ccc',
              background: checked ? BRAND.blue : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {checked && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>}
            </span>
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function YesNoToggle({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div>
      <span style={labelStyle}>{label}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        {[{ v: true, text: 'Sí' }, { v: false, text: 'No' }].map(opt => (
          <button
            key={String(opt.v)}
            type="button"
            onClick={() => onChange(opt.v)}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: value === opt.v ? `1.5px solid ${BRAND.blue}` : '1px solid #E0E0E0',
              background: value === opt.v ? 'color-mix(in srgb, ' + BRAND.blue + ' 8%, white)' : '#fff',
              color: value === opt.v ? BRAND.blue : BRAND.dark,
            }}
          >
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  )
}

export function SegmentedChoice<T extends string>({ label, options, value, onChange }: {
  label: string
  options: { value: T; label: string }[]
  value: T | null
  onChange: (v: T) => void
}) {
  return (
    <div>
      <span style={labelStyle}>{label}</span>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              flex: '1 1 0', minWidth: 90, padding: '9px 10px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: value === opt.value ? `1.5px solid ${BRAND.blue}` : '1px solid #E0E0E0',
              background: value === opt.value ? 'color-mix(in srgb, ' + BRAND.blue + ' 8%, white)' : '#fff',
              color: value === opt.value ? BRAND.blue : BRAND.dark,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
