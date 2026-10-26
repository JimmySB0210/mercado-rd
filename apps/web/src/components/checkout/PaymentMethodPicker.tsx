'use client'
// ============================================================
// MercadoRD — Selector de método de pago
// Ruta: src/components/checkout/PaymentMethodPicker.tsx
// ============================================================
// Mosaico de opciones con radios reales (se manejan con teclado: Tab para
// entrar y flechas para cambiar). El método elegido se marca con relleno azul
// Y con una marca de verificación, no solo con color. Los métodos que todavía
// no tienen integración (lib/checkout/paymentMethods.ts) se ven pero no se
// pueden elegir.
// ============================================================

import { Banknote, Check, CreditCard, Landmark, type LucideIcon } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { PAYMENT_METHOD_OPTIONS, type PaymentMethodId } from '@/lib/checkout/paymentMethods'

const ICONS: Record<PaymentMethodId, LucideIcon> = {
  azul: CreditCard,
  cardnet: CreditCard,
  transfer: Landmark,
  cash: Banknote,
}

interface Props {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function PaymentMethodPicker({ value, onChange }: Props) {
  const { t } = useTranslation('checkout')

  return (
    <fieldset className="ck-pay-fieldset">
      <legend className="sr-only">{t('paymentMethodHeading')}</legend>
      <div className="ck-pay-grid">
        {PAYMENT_METHOD_OPTIONS.map(method => {
          const selected = value === method.id
          const unavailable = method.status === 'unavailable'
          const Icon = ICONS[method.id]
          return (
            <label key={method.id} className="ck-pay-tile" data-selected={selected} data-disabled={unavailable}>
              <input
                type="radio"
                name="payMethod"
                value={method.id}
                checked={selected}
                disabled={unavailable}
                onChange={onChange}
                className="sr-only"
              />
              <Icon size={22} aria-hidden="true" style={{ flexShrink: 0 }} />
              <span className="ck-pay-text">
                <span className="ck-pay-name">{t(method.labelKey)}</span>
                <span className="ck-pay-hint">{t(method.hintKey)}</span>
              </span>
              {selected && (
                <span className="ck-pay-check" aria-hidden="true"><Check size={13} strokeWidth={3} /></span>
              )}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
