'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ShieldCheck, Truck, Store, Headset } from 'lucide-react';
import { createPublicClient } from '@/lib/supabase/public'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { PromoBanner } from '@/types/database.types'
import type { HomeDict } from '@/lib/i18n/es/home'

const PERK_KEYS: { icon: typeof ShieldCheck; titleKey: keyof HomeDict; subKey: keyof HomeDict }[] = [
  { icon: ShieldCheck, titleKey: 'perkSecurePaymentTitle', subKey: 'perkSecurePaymentSub' },
  { icon: Truck, titleKey: 'perkShippingTitle', subKey: 'perkShippingSub' },
  { icon: Store, titleKey: 'perkStoresTitle', subKey: 'perkStoresSub' },
  { icon: Headset, titleKey: 'perkSupportTitle', subKey: 'perkSupportSub' },
];

const SLIDE_INTERVAL_MS = 3500
const MOBILE_BREAKPOINT = 1010

// Diapositiva de marca — contenido y estilos sin cambios respecto a la
// versión original de HeroBanner. Solo se usa en desktop (≥1010px de
// contenedor); en mobile se reemplaza por WelcomeSlide + PerksSlide.
// imageUrl: foto configurable desde /admin/promociones
// (site_settings.brand_banner_image_url) — null usa la imagen por
// defecto, mismo posicionamiento y tratamiento visual en ambos casos.
function BrandSlide({ imageUrl }: { imageUrl: string | null }) {
  const { t } = useTranslation('home')

  return (
    <div style={{
      position:'relative',
      background:`linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)`,
      padding:'40px',
      display:'flex',
      alignItems:'center',
      justifyContent:'space-between',
      gap:32,
      color:'#fff',
      flexWrap:'wrap',
    }}>
      {/* Modelo — desktop only, detrás de las feature cards (ver z-index abajo) */}
      <div className="hero-model-image" style={{position:'absolute',top:0,bottom:0,right:0,width:'38%',zIndex:0}}>
        <Image
          src={imageUrl || "/images/hero-model.jpg"}
          alt={t('heroModelAlt')}
          fill
          sizes="45vw"
          quality={90}
          style={{objectFit:'contain',objectPosition:'center'}}
        />
        {/* Blend con el fondo del hero — del color del banner hacia transparente */}
        <div style={{
          position:'absolute',
          inset:0,
          background:`linear-gradient(to right, var(--color-primary) 0%, rgba(15,76,129,0) 100%)`,
        }} />
      </div>

      <div style={{position:'relative',zIndex:1,flex:'1 1 320px',minWidth:280}}>
        <h1 style={{fontFamily:'var(--font-heading)',letterSpacing:'var(--tracking-heading)',fontSize:32,fontWeight:700,lineHeight:1.25,margin:'0 0 14px'}}>
          {t('welcomeTitle')}
        </h1>
        <p style={{color:'rgba(255,255,255,0.75)',fontSize:14,margin:'0 0 22px',maxWidth:320}}>
          {t('welcomeSubtitle')}
        </p>
        <a href='#productos' style={{display:'inline-block',background:'var(--color-accent)',color:'var(--color-primary)',textDecoration:'none',padding:'13px 26px',borderRadius:'var(--radius-control)',fontWeight:700,fontSize:14,boxShadow:'0 2px 10px rgba(232,185,35,0.35)'}}>
          {t('exploreCta')}
        </a>
      </div>

      <div className="hero-perks" style={{position:'relative',zIndex:1,flex:'1 1 320px'}}>
        {PERK_KEYS.map((p,i) => {
          const Icon = p.icon;
          return (
            <div key={i} style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:38,height:38,borderRadius:10,background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <Icon size={18} color='#fff' />
              </div>
              <div>
                <div style={{fontWeight:600,fontSize:13}}>{t(p.titleKey)}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.65)'}}>{t(p.subKey)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Mobile — mitad 1 de 2 del BrandSlide dividido: título + CTA, compacto
// para caber en el aspect-ratio corto del contenedor en mobile.
// imageUrl: foto configurable desde /admin/promociones
// (site_settings.brand_banner_mobile_image_url) — null se queda
// exactamente como antes (solo el degradado, sin foto).
function WelcomeSlide({ imageUrl }: { imageUrl: string | null }) {
  const { t } = useTranslation('home')

  return (
    <div style={{
      position:'relative', width:'100%', height:'100%', overflow:'hidden',
      background: imageUrl ? undefined : `linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)`,
      display:'flex', flexDirection:'column', alignItems:'flex-start', justifyContent:'center',
      padding:'0 20px', color:'#fff', gap:6,
    }}>
      {imageUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
          />
          {/* Mismo degradado navy de siempre, ahora como wash encima de la foto para que el texto siga legible */}
          <div style={{
            position:'absolute', inset:0,
            background:`linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)`,
            opacity: 0.72,
          }} />
        </>
      )}
      <h1 style={{position:'relative',zIndex:1,fontFamily:'var(--font-heading)',letterSpacing:'var(--tracking-heading)',fontSize:18,fontWeight:700,lineHeight:1.25,margin:0}}>
        {t('welcomeTitle')}
      </h1>
      <p style={{position:'relative',zIndex:1,color:'rgba(255,255,255,0.75)',fontSize:11,margin:0,maxWidth:280}}>
        {t('welcomeSubtitle')}
      </p>
      <a href='#productos' style={{position:'relative',zIndex:1,display:'inline-block',background:'var(--color-accent)',color:'var(--color-primary)',textDecoration:'none',padding:'7px 16px',borderRadius:'var(--radius-control)',fontWeight:700,fontSize:12,marginTop:4}}>
        {t('exploreCta')}
      </a>
    </div>
  );
}

// Mobile — mitad 2 de 2: los mismos 4 perks, en fila compacta en vez
// del grid 2×2 de desktop (no cabría en el alto corto).
function PerksSlide() {
  const { t } = useTranslation('home')

  return (
    <div style={{
      position:'relative', width:'100%', height:'100%',
      background:`linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)`,
      display:'flex', alignItems:'center', justifyContent:'space-around',
      padding:'0 8px', color:'#fff',
    }}>
      {PERK_KEYS.map((p,i) => {
        const Icon = p.icon;
        return (
          <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5,flex:'1 1 0',minWidth:0}}>
            <div style={{width:32,height:32,borderRadius:9,background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <Icon size={16} color='#fff' />
            </div>
            <div style={{fontSize:10,fontWeight:600,textAlign:'center',lineHeight:1.2}}>{t(p.titleKey)}</div>
          </div>
        );
      })}
    </div>
  );
}

// Diapositiva promocional — imagen a pantalla completa del hero, con
// title/subtitle superpuestos (mismo estilo tipográfico que BrandSlide).
function PromoSlide({ banner }: { banner: PromoBanner }) {
  const hasText = !!(banner.title || banner.subtitle)

  const content = (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 260 }}>
      {/* Debajo de 1010px de contenedor, BrandSlide pasa a layout apilado
          (ver HeroBanner: umbral donde el heading + perks dejan de caber
          lado a lado) — coincide con el breakpoint usado aquí */}
      <picture>
        <source media="(max-width: 1009px)" srcSet={banner.mobile_image_url || banner.image_url} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={banner.image_url || banner.mobile_image_url || undefined}
          alt={banner.title ?? 'Promoción'}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </picture>
      {hasText && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(0deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 45%)',
        }} />
      )}
      {hasText && (
        <div style={{ position: 'absolute', left: 40, right: 40, bottom: 36, color: '#fff', zIndex: 1 }}>
          {banner.title && (
            <h2 style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.25, margin: '0 0 8px' }}>
              {banner.title}
            </h2>
          )}
          {banner.subtitle && (
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, margin: 0, maxWidth: 420 }}>
              {banner.subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  )

  if (banner.link_url) {
    return (
      <a href={banner.link_url} style={{ display: 'block', width: '100%', height: '100%' }}>
        {content}
      </a>
    )
  }
  return content
}

export function HeroBanner() {
  const { t } = useTranslation('home')
  const [banners, setBanners] = useState<PromoBanner[]>([])
  const [showBrandBanner, setShowBrandBanner] = useState(true)
  const [brandImageUrl, setBrandImageUrl] = useState<string | null>(null)
  const [brandMobileImageUrl, setBrandMobileImageUrl] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const isMobile = useIsMobile(MOBILE_BREAKPOINT)

  // Mobile: Bienvenida + Perks (BrandSlide dividido) + promos.
  // Desktop: BrandSlide entero (sin cambios) + promos. Si el admin
  // apagó el interruptor en /admin/promociones, la de marca no cuenta.
  const brandSlideCount = showBrandBanner ? (isMobile ? 2 : 1) : 0
  const totalSlides = brandSlideCount + banners.length

  useEffect(() => {
    const supabase = createPublicClient()
    const nowIso = new Date().toISOString()
    supabase
      .from('promo_banners')
      .select('id, image_url, mobile_image_url, title, subtitle, link_url, sort_order, is_active, expires_at, created_at')
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order('sort_order')
      .then(({ data }) => setBanners(data ?? []))

    supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['show_brand_banner', 'brand_banner_image_url', 'brand_banner_mobile_image_url'])
      .then(({ data }) => {
        const settings = new Map((data ?? []).map(row => [row.key, row.value]))
        if (settings.get('show_brand_banner') === false) setShowBrandBanner(false)

        const desktopUrl = settings.get('brand_banner_image_url')
        if (typeof desktopUrl === 'string' && desktopUrl) setBrandImageUrl(desktopUrl)

        const mobileUrl = settings.get('brand_banner_mobile_image_url')
        if (typeof mobileUrl === 'string' && mobileUrl) setBrandMobileImageUrl(mobileUrl)
      })
  }, [])

  // Auto-avance — usa el updater funcional para no reiniciar el intervalo
  // cada vez que activeIndex cambia (ni por el propio timer ni por un dot)
  useEffect(() => {
    if (totalSlides <= 1) return
    const interval = setInterval(() => {
      setActiveIndex(i => (i + 1) % totalSlides)
    }, SLIDE_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [totalSlides])

  return (
    <div style={{maxWidth:1400, margin:'0 auto', padding: isMobile ? 0 : '24px 24px 0'}}>
      <div style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: isMobile ? 0 : 16,
        aspectRatio: isMobile ? '2.4 / 1' : undefined,
      }}>
        <div style={{
          display: 'flex',
          height: '100%',
          transition: 'transform 0.6s ease',
          transform: `translateX(-${activeIndex * 100}%)`,
        }}>
          {showBrandBanner && (
            isMobile ? (
              <>
                <div style={{ flex: '0 0 100%', minWidth: 0, height: '100%' }}>
                  <WelcomeSlide imageUrl={brandMobileImageUrl} />
                </div>
                <div style={{ flex: '0 0 100%', minWidth: 0, height: '100%' }}>
                  <PerksSlide />
                </div>
              </>
            ) : (
              <div style={{ flex: '0 0 100%', minWidth: 0, height: '100%' }}>
                <BrandSlide imageUrl={brandImageUrl} />
              </div>
            )
          )}
          {banners.map(banner => (
            <div key={banner.id} style={{ flex: '0 0 100%', minWidth: 0, height: '100%' }}>
              <PromoSlide banner={banner} />
            </div>
          ))}
        </div>

        {totalSlides > 1 && (
          <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8, zIndex: 2 }}>
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIndex(i)}
                aria-label={`${t('slideGoToAria')} ${i + 1}`}
                style={{
                  width: i === activeIndex ? 20 : 8, height: 8, borderRadius: 4, border: 'none', padding: 0,
                  cursor: 'pointer', background: i === activeIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                  transition: 'width 0.3s ease, background 0.3s ease',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
