'use client'
// ============================================================
// MercadoRD — 3 banners promocionales (home)
// Ruta: src/components/shop/PromoBannersRow.tsx
// ============================================================
// Reemplaza a SellerCta.tsx (un solo banner ancho): la referencia
// visual pide exactamente 3 tarjetas en una fila — vendedores / envíos
// / ofertas — como franja promocional entre "Productos destacados" y
// el resto del home. Envíos enlaza a /soporte (ShippingBenefitsStrip,
// que traía el anchor #envios, se eliminó por completo a pedido
// explícito).
//
// Ofertas enlaza a #productos (HomeProductGrid → "Ofertas destacadas"),
// NO a #ofertas (DailyDealsGrid, "⚡ Ofertas del día") — verificado con
// clic real: hoy no hay ningún producto que califique como oferta del
// día en la base, así que DailyDeals no renderiza y ese id no existe en
// el DOM, dejando el botón sin destino. "Ofertas destacadas" sí tiene
// contenido real hoy. Cuando haya ofertas del día reales en producción,
// reconsiderar apuntar a #ofertas en su lugar.
//
// Fotos configurables — mismo patrón que brand_banner_image_url en
// HeroBanner.tsx: 3 keys opcionales en site_settings
// (promo_card_sell/shipping/offers_image_url), administradas desde
// /admin/promociones (PromoCardImages.tsx). Sin foto configurada (el
// default), la tarjeta se ve exactamente igual que antes — ícono +
// degradado de color, nunca vacía ni rota. Con foto, se muestra de
// fondo con el mismo degradado/color de la tarjeta como wash encima
// (igual técnica que BrandSlide en HeroBanner) para que el texto siga
// legible.
// ============================================================

import { useEffect, useState } from 'react'
import { Store, Truck, Tag } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { createPublicClient } from '@/lib/supabase/public'

type ImageSettingKey = 'promo_card_sell_image_url' | 'promo_card_shipping_image_url' | 'promo_card_offers_image_url'

interface CardDef {
  href: string
  background: string
  imageSettingKey: ImageSettingKey
  icon: typeof Store
  titleKey: 'sellerCtaTitle' | 'shippingCardTitle' | 'offersCardTitle'
  subtitleKey: 'sellerCtaSubtitle' | 'shippingCardSubtitle' | 'offersCardSubtitle'
  ctaKey: 'sellerCtaButton' | 'moreInfoCta' | 'viewOffersCta'
  textColor: string
  ctaBg: string
  ctaColor: string
}

const CARDS: CardDef[] = [
  {
    href: '/vendor/register',
    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)',
    imageSettingKey: 'promo_card_sell_image_url',
    icon: Store,
    titleKey: 'sellerCtaTitle',
    subtitleKey: 'sellerCtaSubtitle',
    ctaKey: 'sellerCtaButton',
    textColor: '#fff',
    ctaBg: 'var(--color-yellow-cta)',
    ctaColor: 'var(--color-primary)',
  },
  {
    href: '/soporte',
    background: '#FEF8EC',
    imageSettingKey: 'promo_card_shipping_image_url',
    icon: Truck,
    titleKey: 'shippingCardTitle',
    subtitleKey: 'shippingCardSubtitle',
    ctaKey: 'moreInfoCta',
    textColor: 'var(--color-text-primary)',
    ctaBg: 'var(--color-primary)',
    ctaColor: '#fff',
  },
  {
    href: '#productos',
    background: 'linear-gradient(135deg, var(--color-purple-deep) 0%, var(--color-purple-bright) 100%)',
    imageSettingKey: 'promo_card_offers_image_url',
    icon: Tag,
    titleKey: 'offersCardTitle',
    subtitleKey: 'offersCardSubtitle',
    ctaKey: 'viewOffersCta',
    textColor: '#fff',
    ctaBg: 'var(--color-yellow-cta)',
    ctaColor: 'var(--color-purple-deep)',
  },
]

const IMAGE_SETTING_KEYS: ImageSettingKey[] = CARDS.map(c => c.imageSettingKey)

export function PromoBannersRow() {
  const { t } = useTranslation('products')
  const [images, setImages] = useState<Partial<Record<ImageSettingKey, string>>>({})

  useEffect(() => {
    const supabase = createPublicClient()
    supabase
      .from('site_settings')
      .select('key, value')
      .in('key', IMAGE_SETTING_KEYS)
      .then(({ data }) => {
        const map: Partial<Record<ImageSettingKey, string>> = {}
        for (const row of data ?? []) {
          if (typeof row.value === 'string' && row.value) map[row.key as ImageSettingKey] = row.value
        }
        setImages(map)
      })
  }, [])

  return (
    // w-full explícito — mismo bug que en HeroBanner: este div es flex
    // item de la columna raíz de page.tsx, y sin ancho explícito el
    // margin:auto horizontal desactiva el stretch y las 3 tarjetas se
    // encogen a su contenido en vez de repartirse el ancho completo.
    <div className="w-full max-w-[1400px] mx-auto px-4 md-860:px-6" style={{ margin: '28px auto 8px' }}>
      {/* Compacto a propósito — banners horizontales tipo franja, no
          tarjetas verticales. Sin minHeight: el row (align-items:stretch
          por defecto) ya iguala las 3 alturas al contenido más alto. */}
      <div className="flex flex-col md-860:flex-row" style={{ gap: 20 }}>
        {CARDS.map(card => {
          const Icon = card.icon
          const imageUrl = images[card.imageSettingKey]
          return (
            <a
              key={card.titleKey}
              href={card.href}
              className="flex-1 hover:brightness-95"
              style={{
                position: 'relative',
                overflow: 'hidden',
                background: imageUrl ? undefined : card.background,
                borderRadius: 'var(--radius-card)',
                padding: '18px 20px',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                transition: 'filter var(--transition-fast)',
              }}
            >
              {imageUrl && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt=""
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
                  />
                  {/* Wash del mismo color/degradado de la tarjeta encima
                      de la foto, para que el texto siga legible — misma
                      técnica que BrandSlide en HeroBanner.tsx */}
                  <div style={{ position: 'absolute', inset: 0, background: card.background, opacity: 0.65, zIndex: 0 }} />
                </>
              )}

              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  position: 'relative', zIndex: 1,
                  width: 36, height: 36, borderRadius: '50%',
                  background: card.textColor === '#fff' ? 'rgba(255,255,255,0.15)' : 'var(--color-primary-subtle)',
                }}
              >
                <Icon size={17} color={card.textColor === '#fff' ? '#fff' : 'var(--color-primary)'} strokeWidth={1.75} />
              </div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3
                  style={{
                    fontSize: 17, fontWeight: 800, lineHeight: 1.2, margin: '0 0 4px',
                    color: card.textColor, fontFamily: 'var(--font-heading)', whiteSpace: 'pre-line',
                  }}
                >
                  {t(card.titleKey)}
                </h3>
                <p style={{ fontSize: 12, lineHeight: 1.35, margin: 0, color: card.textColor, opacity: 0.85, whiteSpace: 'pre-line' }}>
                  {t(card.subtitleKey)}
                </p>
              </div>

              <span
                className="inline-flex self-start"
                style={{
                  position: 'relative', zIndex: 1,
                  marginTop: 'auto', background: card.ctaBg, color: card.ctaColor,
                  padding: '7px 14px', borderRadius: 'var(--radius-control)',
                  fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap',
                }}
              >
                {t(card.ctaKey)}
              </span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
