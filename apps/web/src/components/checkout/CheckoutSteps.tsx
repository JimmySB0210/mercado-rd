'use client'
// ============================================================
// MercadoRD — Barra de progreso del checkout
// Ruta: src/components/checkout/CheckoutSteps.tsx
// ============================================================
// Refleja el flujo real, que tiene tres pasos: Carrito → Entrega y pago
// (una sola página, la de checkout) → Confirmación (/confirm, solo después de
// crear el pedido). Por eso aquí el paso actual siempre es «Entrega y pago»,
// el primero ya está hecho y el último todavía no. En «Comprar ahora» no hay
// carrito: el primer paso es el producto.
// ============================================================

import { Check } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'

interface Props {
  // Dónde vuelve el primer paso: /cart, o la página del producto en «Comprar ahora».
  backHref: string
  isExpress: boolean
}

export function CheckoutSteps({ backHref, isExpress }: Props) {
  const { t } = useTranslation('checkout')

  return (
    <nav aria-label={t('progressLabel')}>
      <ol className="ck-steps">
        <li className="ck-step" data-state="done">
          <a href={backHref} className="ck-step-link">
            <span className="ck-step-dot"><Check size={15} strokeWidth={3} aria-hidden="true" /></span>
            <span className="ck-step-label">
              {isExpress ? t('stepProduct') : t('stepCart')}
              <span className="sr-only"> ({t('stepDoneSr')})</span>
            </span>
          </a>
        </li>
        <li className="ck-step" data-state="current" aria-current="step">
          <span className="ck-step-link">
            <span className="ck-step-dot" aria-hidden="true">2</span>
            <span className="ck-step-label">{t('stepDeliveryPayment')}</span>
          </span>
        </li>
        <li className="ck-step" data-state="upcoming">
          <span className="ck-step-link">
            <span className="ck-step-dot" aria-hidden="true">3</span>
            <span className="ck-step-label">{t('stepConfirmation')}</span>
          </span>
        </li>
      </ol>
    </nav>
  )
}
