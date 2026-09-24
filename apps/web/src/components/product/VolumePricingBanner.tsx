'use client'
// ============================================================
// MercadoRD — Invitación a precios por volumen (página de producto)
// Ruta: src/components/product/VolumePricingBanner.tsx
// ============================================================
// Reemplaza la tabla de product_pricing_tiers en la vista normal del
// producto (a pedido explícito — esa tabla sigue existiendo en la base
// y en el panel del vendedor, para cuando se construya la experiencia
// de proveedores real; acá ya no se renderiza).
//
// El CTA no inventa un destino: hoy el único mecanismo real para
// negociar un precio por cantidad es el chat con el vendedor — reusa
// ContactVendorButton (mismo send_chat_message, mismo flujo de login)
// con un mensaje de apertura sobre volumen. Una vez en el chat, el
// botón real "💰 Solicitar cotización" (mensajes/[id]/page.tsx) sigue
// el resto del proceso — no se duplica esa lógica acá.
// ============================================================

import { Store } from 'lucide-react'
import { ContactVendorButton } from '@/components/product/ContactVendorButton'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { BRAND } from '@/lib/colors'

interface Props {
  vendorId: string
  productId: string
  productName: string
  vendorName: string
}

export function VolumePricingBanner({ vendorId, productId, productName, vendorName }: Props) {
  const { t } = useTranslation('products')

  return (
    <div
      className="flex items-start gap-3 p-4"
      style={{
        borderRadius: 'var(--radius-card)',
        background: 'color-mix(in srgb, var(--brand-blue) 6%, white)',
        border: '1px solid color-mix(in srgb, var(--brand-blue) 20%, white)',
      }}
    >
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{ width: 36, height: 36, borderRadius: 'var(--radius-control)', background: 'color-mix(in srgb, var(--brand-blue) 12%, white)' }}
      >
        <Store size={18} color={BRAND.blue} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{t('volumePricingTitle')}</p>
        <p className="text-xs text-gray-500 mt-0.5 mb-3">{t('volumePricingSubtitle', { vendorName })}</p>
        <ContactVendorButton
          vendorId={vendorId}
          productId={productId}
          productName={productName}
          message={`Hola, me interesa comprar ${productName} en volumen. ¿Tienen precios especiales por cantidad?`}
          label={t('volumePricingCta')}
          icon="💰"
        />
      </div>
    </div>
  )
}
