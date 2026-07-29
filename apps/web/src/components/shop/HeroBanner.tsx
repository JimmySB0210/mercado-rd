'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ShieldCheck, Truck, Store, Headset } from 'lucide-react';
import { BRAND } from '@/lib/colors';
import { createPublicClient } from '@/lib/supabase/public'
import type { PromoBanner } from '@/types/database.types'

const PERKS = [
  { icon: ShieldCheck, title: 'Pago seguro', sub: 'Protegemos tu compra' },
  { icon: Truck, title: 'Envíos a todo el país', sub: 'Rápido y confiable' },
  { icon: Store, title: 'Miles de tiendas', sub: 'Apoya lo local' },
  { icon: Headset, title: 'Soporte 24/7', sub: 'Estamos para ayudarte' },
];

const SLIDE_INTERVAL_MS = 3500

// Diapositiva de marca — contenido y estilos sin cambios respecto a la
// versión original de HeroBanner, solo que ahora vive dentro del carrusel.
function BrandSlide() {
  return (
    <div style={{
      position:'relative',
      background:`linear-gradient(135deg, ${BRAND.blue} 0%, #082f6e 100%)`,
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
          src="/images/hero-model.jpg"
          alt="Clienta sonriendo mientras usa MercadoRD desde su celular"
          fill
          sizes="45vw"
          style={{objectFit:'contain',objectPosition:'center'}}
        />
        {/* Blend con el fondo del hero — del color del banner hacia transparente */}
        <div style={{
          position:'absolute',
          inset:0,
          background:`linear-gradient(to right, ${BRAND.blue} 0%, rgba(13,71,161,0) 100%)`,
        }} />
      </div>

      <div style={{position:'relative',zIndex:1,flex:'1 1 320px',minWidth:280}}>
        <h1 style={{fontSize:32,fontWeight:700,lineHeight:1.25,margin:'0 0 14px'}}>
          Compra y vende<br/>en toda República<br/>Dominicana
        </h1>
        <p style={{color:'rgba(255,255,255,0.75)',fontSize:14,margin:'0 0 22px',maxWidth:320}}>
          Miles de productos, tiendas y personas conectados contigo.
        </p>
        <a href='#productos' style={{display:'inline-block',background:BRAND.red,color:'#fff',textDecoration:'none',padding:'13px 26px',borderRadius:8,fontWeight:600,fontSize:14}}>
          Explorar productos
        </a>
      </div>

      <div className="hero-perks" style={{position:'relative',zIndex:1,flex:'1 1 320px'}}>
        {PERKS.map((p,i) => {
          const Icon = p.icon;
          return (
            <div key={i} style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:38,height:38,borderRadius:10,background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <Icon size={18} color='#fff' />
              </div>
              <div>
                <div style={{fontWeight:600,fontSize:13}}>{p.title}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,0.65)'}}>{p.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
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
  const [banners, setBanners] = useState<PromoBanner[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const totalSlides = 1 + banners.length

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
    <div style={{maxWidth:1400,margin:'0 auto',padding:'24px 24px 0'}}>
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16 }}>
        <div style={{
          display: 'flex',
          transition: 'transform 0.6s ease',
          transform: `translateX(-${activeIndex * 100}%)`,
        }}>
          <div style={{ flex: '0 0 100%', minWidth: 0 }}>
            <BrandSlide />
          </div>
          {banners.map(banner => (
            <div key={banner.id} style={{ flex: '0 0 100%', minWidth: 0 }}>
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
                aria-label={`Ir a diapositiva ${i + 1}`}
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
