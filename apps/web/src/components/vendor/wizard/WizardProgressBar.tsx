'use client'
// ============================================================
// MercadoRD — Barra de progreso del wizard de registro de vendor
// Ruta: src/components/vendor/wizard/WizardProgressBar.tsx
// ============================================================

import { BRAND } from '@/lib/colors'

const STEP_LABELS = [
  'Información básica',
  'Tipo de negocio',
  'Qué vendes',
  'Servicios',
  'A quién vendes',
  'Revisión',
]

interface Props {
  currentStep: number
  totalSteps?: number
}

export function WizardProgressBar({ currentStep, totalSteps = 6 }: Props) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepNum = i + 1
          const reached = stepNum <= currentStep
          return (
            <div
              key={i}
              style={{
                flex: 1, height: 6, borderRadius: 3,
                background: reached ? BRAND.blue : '#E5E7EB',
                transition: 'background 0.3s ease',
              }}
            />
          )
        })}
      </div>
      <p style={{ fontSize: 12, color: BRAND.gray, margin: 0 }}>
        Paso {currentStep} de {totalSteps} — {STEP_LABELS[currentStep - 1]}
      </p>
    </div>
  )
}
