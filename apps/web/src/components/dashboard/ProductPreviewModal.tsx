'use client'
// ============================================================
// MercadoRD — Vista previa de producto (desde el formulario, sin guardar)
// Ruta: src/components/dashboard/ProductPreviewModal.tsx
// ============================================================
// Reutiliza el mismo componente que /producto/[id] usa para su
// contenido principal (ProductPageContent), alimentado con los datos
// actuales del formulario en vez de una fila real de la BD — así el
// vendor ve exactamente cómo se vería su producto sin tener que
// guardar primero.
// ============================================================

import { ProductPageContent } from '@/app/producto/[id]/ProductPageContent'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { discountPercent } from '@/types/database.types'
import { BRAND } from '@/lib/colors'
import type { ProductVariant } from '@/types/database.types'
import type { Product } from '@/types'

interface VendorInfo {
  id: string
  business_name: string
  is_verified: boolean
  whatsapp?: string
  rating_avg?: number
  total_sales?: number
}

interface Props {
  product: Product & {
    category: { slug: string; emoji: string; name: string } | null
    province: { name: string } | null
  }
  vendor: VendorInfo | undefined
  variants: ProductVariant[]
  onClose: () => void
}

export function ProductPreviewModal({ product, vendor, variants, onClose }: Props) {
  const { t } = useTranslation('dashboard')

  const hasDiscount = !!(product.compare_rdp && product.compare_rdp > product.price_rdp)
  const discount = hasDiscount ? discountPercent(product.price_rdp, product.compare_rdp!) : null
  const itbis = Math.round(product.price_rdp * 0.18)
  const totalConItbis = product.price_rdp + itbis
  const whatsappMsg = encodeURIComponent(
    `Hola, me interesa este producto en MercadoRD:\n*${product.name}*\n¿Está disponible?`
  )

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300,
        display: 'flex', justifyContent: 'center', padding: 24, overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#f9fafb', width: '100%', maxWidth: 1100, borderRadius: 16,
          overflow: 'hidden', maxHeight: '100%', display: 'flex', flexDirection: 'column',
        }}
      >
        <div
          style={{
            background: BRAND.blue, color: '#fff', padding: '14px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 14 }}>👁️ {t('previewBannerText')}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('closePreviewAria')}
            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 0 }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 24, overflowY: 'auto' }}>
          <ProductPageContent
            product={product}
            vendor={vendor}
            variants={variants}
            hasDiscount={hasDiscount}
            discount={discount}
            itbis={itbis}
            totalConItbis={totalConItbis}
            whatsappMsg={whatsappMsg}
          />
        </div>
      </div>
    </div>
  )
}
