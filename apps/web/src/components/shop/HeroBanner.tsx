'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ShieldCheck, Truck, Headset } from 'lucide-react'
import { createPublicClient } from '@/lib/supabase/public'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { useTranslation } from '@/lib/hooks/useTranslation'
import type { PromoBanner } from '@/types/database.types'

const SLIDE_INTERVAL_MS = 3500
const MOBILE_BREAKPOINT = 1010

// Los 3 perks del banner — vuelven a pedido explícito, con el texto
// exacto de la imagen de referencia (antes se habían quitado del todo;
// ver comentario en HeroBanner más abajo). Mismos íconos que usaba la
// franja vieja de beneficios (ShieldCheck/Truck/Headset).
const HERO_PERKS = [
  { Icon: ShieldCheck, key: 'perkSecurePaymentTitle' as const },
  { Icon: Truck, key: 'perkShippingTitle' as const },
  { Icon: Headset, key: 'perkSupportTitle' as const },
]

// Diapositiva de marca — contenido y estilos sin cambios respecto a la
// versión original de HeroBanner. Solo se usa en desktop (≥1010px de
// contenedor); en mobile se reemplaza por WelcomeSlide.
// imageUrl: foto configurable desde /admin/promociones
// (site_settings.brand_banner_image_url).
//   - null: comportamiento de siempre — foto del modelo en el recorte
//     angosto de la derecha (hero-model-image), object-fit: contain.
//   - con valor: fondo completo del slide (object-fit: cover) con el
//     mismo degradado navy como wash encima para legibilidad — mismo
//     tratamiento que WelcomeSlide en mobile, mejor ajuste para fotos
//     panorámicas (paisajes, playas) que no son un recorte de persona.
function BrandSlide({ imageUrl }: { imageUrl: string | null }) {
  const { t } = useTranslation('home')

  return (
    <div style={{
      position:'relative',
      overflow:'hidden',
      background: imageUrl ? undefined : `linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)`,
      padding:'32px 40px',
      display:'flex',
      alignItems:'center',
      justifyContent:'space-between',
      gap:32,
      color:'#fff',
      flexWrap:'wrap',
    }}>
      {imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:0 }}
          />
          {/* Wash de marca encima de la foto para que el texto siga legible —
              más oscuro del lado izquierdo (donde vive el texto), se aclara
              hacia la derecha para dejar respirar la foto. */}
          <div style={{
            position:'absolute', inset:0,
            background:`linear-gradient(100deg, var(--color-primary) 0%, rgba(4,88,180,0.55) 45%, rgba(4,88,180,0.35) 100%)`,
          }} />
        </>
      ) : (
        /* Modelo — desktop only, detrás de las feature cards (ver z-index abajo) */
        <div className="hero-model-image" style={{position:'absolute',top:0,bottom:0,right:0,width:'38%',zIndex:0}}>
          <Image
            src="/images/hero-model.jpg"
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
            background:`linear-gradient(to right, var(--color-primary) 0%, rgba(4,88,180,0) 100%)`,
          }} />
        </div>
      )}

      {/* flex: '0 1 480px' (antes '1 1 320px') — sin el grid de perks al
          lado, flex-grow:1 hubiera estirado este bloque a todo el ancho
          del panel; con basis 480px y sin grow se queda como una
          columna de texto normal, dejando ver la foto de fondo/modelo
          a la derecha en vez de un vacío. */}
      <div style={{position:'relative',zIndex:1,flex:'0 1 580px',minWidth:280}}>
        <span style={{display:'inline-block',fontSize:12,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--color-yellow-cta)',marginBottom:8}}>
          {t('heroKicker')}
        </span>
        <h1 style={{fontFamily:'var(--font-heading)',letterSpacing:'var(--tracking-heading)',fontSize:36,fontWeight:800,lineHeight:1.15,margin:'0 0 10px',textShadow:'0 2px 12px rgba(0,0,0,0.2)'}}>
          {t('welcomeTitle')}
        </h1>
        <p style={{color:'rgba(255,255,255,0.85)',fontSize:14,lineHeight:1.45,margin:'0 0 18px',maxWidth:360}}>
          {t('welcomeSubtitle')}
        </p>
        <a href='#categorias' style={{display:'inline-block',background:'var(--color-yellow-cta)',color:'var(--color-primary)',textDecoration:'none',padding:'12px 26px',borderRadius:'var(--radius-control)',fontWeight:700,fontSize:14,boxShadow:'0 4px 14px rgba(232,185,35,0.4)'}}>
          {t('exploreCta')}
        </a>

        {/* Los 3 perks — vueltos a pedido explícito, con el texto exacto
            de la imagen de referencia. Secundarios a propósito: nunca
            deben competir con el titular, por eso van chicos y en un
            blanco apagado, no en el amarillo del CTA. */}
        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          {HERO_PERKS.map(({ Icon, key }) => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap' }}>
              <Icon size={12} color="rgba(255,255,255,0.8)" />
              {t(key)}
            </span>
          ))}
        </div>
      </div>

      {/* Bandera + tagline — puramente decorativo, refuerza la identidad
          dominicana pedida en el brief. Siempre encima de lo que haya de
          fondo (gradiente, modelo, o foto configurada desde admin). */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, marginLeft: 'auto' }}>
        <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 16, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.35)', textAlign: 'right', maxWidth: 220 }}>
          {t('heroTagline')}
        </span>
        <span style={{ fontSize: 40, lineHeight: 1 }} role="img" aria-label="República Dominicana">🇩🇴</span>
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
            background:`linear-gradient(100deg, var(--color-primary) 0%, rgba(4,88,180,0.6) 100%)`,
          }} />
        </>
      )}
      <h1 style={{position:'relative',zIndex:1,fontFamily:'var(--font-heading)',letterSpacing:'var(--tracking-heading)',fontSize:19,fontWeight:800,lineHeight:1.2,margin:0,textShadow:'0 1px 8px rgba(0,0,0,0.2)'}}>
        {t('welcomeTitle')}
      </h1>
      <p
        style={{position:'relative',zIndex:1,color:'rgba(255,255,255,0.85)',fontSize:12,lineHeight:1.4,margin:0,maxWidth:300,display:'-webkit-box',WebkitLineClamp:1,WebkitBoxOrient:'vertical',overflow:'hidden',textOverflow:'ellipsis'}}
      >
        {t('welcomeSubtitle')}
      </p>
      <a href='#categorias' style={{position:'relative',zIndex:1,display:'inline-block',background:'var(--color-yellow-cta)',color:'var(--color-primary)',textDecoration:'none',padding:'8px 18px',borderRadius:'var(--radius-control)',fontWeight:700,fontSize:12,marginTop:6}}>
        {t('exploreCta')}
      </a>
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

  // Una sola diapositiva de marca (WelcomeSlide en mobile, BrandSlide
  // en desktop) + promos. Los 3 perks (compra segura/envíos/soporte)
  // habían salido del banner porque esa info ya vive en la barra de
  // confianza del Navbar — volvieron a pedido explícito, con el texto
  // exacto de la imagen de referencia (ver HERO_PERKS arriba). Si el
  // admin apagó el interruptor en /admin/promociones, la de marca no
  // cuenta.
  const brandSlideCount = showBrandBanner ? 1 : 0
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
    // width:'100%' explícito — este div es flex item de la columna raíz
    // de page.tsx (`flex flex-col`); sin ancho explícito, el margin:auto
    // horizontal desactiva el stretch por defecto y el banner se
    // encoge al ancho de su contenido (~800px) en vez de llenar el
    // contenedor hasta maxWidth. Mismo bug latente por el que "ampliar
    // el banner" nunca se sentía suficiente sin importar el aspectRatio.
    <div style={{width:'100%', maxWidth:1400, margin:'0 auto', padding: isMobile ? '12px 16px 0' : '24px 24px 0'}}>
      <div style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: isMobile ? 12 : 16,
        // Fase 2A Batch 2: copy más corto en WelcomeSlide +
        // proporción más comprimida (antes 2.4/1) para que el hero
        // ocupe notablemente menos alto en mobile — "vende una acción,
        // no explica toda la plataforma". El interruptor/imagen
        // configurable de BrandSlide y WelcomeSlide no se tocaron.
        // Desktop: 4.4/1 — ancho ya correcto (width:100%, ver abajo);
        // más bajo que el 4/1 anterior a pedido explícito ("el banner
        // está muy grande"), compensado con paddings/márgenes internos
        // más ajustados en BrandSlide para que los 3 perks entren sin
        // que el conjunto se sienta apretado.
        aspectRatio: isMobile ? '3.2 / 1' : '4.4 / 1',
      }}>
        <div style={{
          display: 'flex',
          height: '100%',
          transition: 'transform 0.6s ease',
          transform: `translateX(-${activeIndex * 100}%)`,
        }}>
          {showBrandBanner && (
            <div style={{ flex: '0 0 100%', minWidth: 0, height: '100%' }}>
              {isMobile ? <WelcomeSlide imageUrl={brandMobileImageUrl} /> : <BrandSlide imageUrl={brandImageUrl} />}
            </div>
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
