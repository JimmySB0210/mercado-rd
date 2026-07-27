'use client'

import Image from 'next/image'
import { ShieldCheck, Truck, Store, Headset } from 'lucide-react';
import { BRAND } from '@/lib/colors';

const PERKS = [
  { icon: ShieldCheck, title: 'Pago seguro', sub: 'Protegemos tu compra' },
  { icon: Truck, title: 'Envíos a todo el país', sub: 'Rápido y confiable' },
  { icon: Store, title: 'Miles de tiendas', sub: 'Apoya lo local' },
  { icon: Headset, title: 'Soporte 24/7', sub: 'Estamos para ayudarte' },
];

export function HeroBanner() {
  return (
    <div style={{maxWidth:1400,margin:'0 auto',padding:'24px 24px 0'}}>

      {/* Hero card */}
      <div style={{
        position:'relative',
        overflow:'hidden',
        background:`linear-gradient(135deg, ${BRAND.blue} 0%, #082f6e 100%)`,
        borderRadius:16,
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
    </div>
  );
}
