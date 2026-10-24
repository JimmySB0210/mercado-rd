'use client'
// ============================================================
// MercadoRD — Campo de precio (RD$) del vendedor
// Ruta: src/components/dashboard/PriceInput.tsx
// ============================================================
// Texto libre en vez de <input type="number">: el navegador no deja
// teclear la coma y el punto se leía como decimal ("5.495" quedaba en
// RD$5.50). Mientras se escribe el campo conserva lo tecleado; al salir
// se acomoda ("5.495" → "5495") y, si showPreview, debajo se ve cómo lo
// verá el comprador ("Se mostrará como RD$5,495"). Las reglas de lectura
// viven en lib/priceInput.ts.
// ============================================================

import { formatPrice } from '@/types/database.types'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { sanitizePriceInput, normalizePriceInput, priceInputToCents } from '@/lib/priceInput'

interface PriceInputProps {
  value: string
  onChange: (next: string) => void
  name?: string
  placeholder?: string
  className?: string
  invalid?: boolean
  // Muestra "Se mostrará como RD$…" debajo (solo en los campos grandes;
  // en las filas de variantes no cabe)
  showPreview?: boolean
}

export function PriceInput({ value, onChange, name, placeholder = '0.00', className, invalid, showPreview = false }: PriceInputProps) {
  const { t } = useTranslation('dashboard')
  const cents = priceInputToCents(value)

  return (
    <>
      <input
        name={name}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        onChange={e => onChange(sanitizePriceInput(e.target.value))}
        onBlur={() => {
          const normalized = normalizePriceInput(value)
          if (normalized !== value) onChange(normalized)
        }}
        className={className}
      />
      {showPreview && cents !== null && cents > 0 && (
        <p className="text-xs text-gray-400 mt-1">{t('pricePreview', { amount: formatPrice(cents) })}</p>
      )}
    </>
  )
}
