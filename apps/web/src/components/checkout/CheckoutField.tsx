'use client'
// ============================================================
// MercadoRD — Campo de formulario del checkout (etiqueta + pista + error)
// Ruta: src/components/checkout/CheckoutField.tsx
// ============================================================
// Envuelve un control con su <label> visible, una pista opcional y el error
// junto al campo, y le pasa por render-prop los atributos que lo enlazan
// (id, aria-required, aria-invalid, aria-describedby). El error lleva icono
// y texto: no depende solo del color.
// ============================================================

import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

export interface FieldAria {
  id: string
  'aria-required'?: true
  'aria-invalid'?: true
  'aria-describedby'?: string
}

interface Props {
  id: string
  label: string
  required?: boolean
  hint?: string | null
  error?: string | null
  // Texto corto a la derecha de la etiqueta (por ejemplo, un contador).
  aside?: string | null
  className?: string
  children: (aria: FieldAria) => ReactNode
}

export function CheckoutField({ id, label, required, hint, error, aside, className, children }: Props) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={className}>
      <div className="ck-label-row">
        <label htmlFor={id} className="ck-label">
          {label}
          {required && <span aria-hidden="true" className="ck-req"> *</span>}
        </label>
        {aside && <span className="ck-aside">{aside}</span>}
      </div>
      {children({
        id,
        'aria-required': required ? true : undefined,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
      })}
      {hint && <p id={hintId} className="ck-hint">{hint}</p>}
      {error && (
        <p id={errorId} className="ck-error">
          <AlertCircle size={14} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
