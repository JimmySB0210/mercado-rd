'use client'
// ============================================================
// MercadoRD — Fotos de los 3 banners pequeños del home (admin)
// Ruta: src/components/admin/PromoCardImages.tsx
// ============================================================
// Controla 3 filas de site_settings, leídas por PromoBannersRow.tsx:
//   - promo_card_sell_image_url      ("Vende tus productos en MercadoRD")
//   - promo_card_shipping_image_url  ("Envíos confiables y rápidos")
//   - promo_card_offers_image_url    ("Ofertas especiales")
// Mismo patrón que BrandBannerToggle.tsx (mismo componente de subida,
// SiteSettingImageField, mismo bucket 'banners' de Storage) — sin
// toggle acá, las 3 fotos son independientes y siempre opcionales: si
// una key no tiene fila, PromoBannersRow.tsx sigue mostrando el ícono
// con degradado de esa tarjeta, nunca queda vacía ni rota.
// ============================================================

import { useState } from 'react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { SiteSettingImageField } from '@/components/admin/SiteSettingImageField'

interface Props {
  initialSellImageUrl: string | null
  initialShippingImageUrl: string | null
  initialOffersImageUrl: string | null
}

export function PromoCardImages({ initialSellImageUrl, initialShippingImageUrl, initialOffersImageUrl }: Props) {
  const { t } = useTranslation('admin')
  const [sellImageUrl, setSellImageUrl] = useState(initialSellImageUrl)
  const [shippingImageUrl, setShippingImageUrl] = useState(initialShippingImageUrl)
  const [offersImageUrl, setOffersImageUrl] = useState(initialOffersImageUrl)

  return (
    <div
      style={{
        background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
        padding: '16px 18px', marginBottom: 20, display: 'grid', gap: 16,
      }}
    >
      <div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{t('promoCardImagesTitle')}</div>
        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{t('promoCardImagesSub')}</div>
      </div>

      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, display: 'grid', gap: 16 }}>
        <SiteSettingImageField
          settingKey="promo_card_sell_image_url"
          label={t('promoCardSellImageLabel')}
          hint={t('promoCardSellImageHint')}
          previewWidth={96}
          previewHeight={56}
          url={sellImageUrl}
          onUpdated={setSellImageUrl}
        />
        <SiteSettingImageField
          settingKey="promo_card_shipping_image_url"
          label={t('promoCardShippingImageLabel')}
          hint={t('promoCardShippingImageHint')}
          previewWidth={96}
          previewHeight={56}
          url={shippingImageUrl}
          onUpdated={setShippingImageUrl}
        />
        <SiteSettingImageField
          settingKey="promo_card_offers_image_url"
          label={t('promoCardOffersImageLabel')}
          hint={t('promoCardOffersImageHint')}
          previewWidth={96}
          previewHeight={56}
          url={offersImageUrl}
          onUpdated={setOffersImageUrl}
        />
      </div>
    </div>
  )
}
