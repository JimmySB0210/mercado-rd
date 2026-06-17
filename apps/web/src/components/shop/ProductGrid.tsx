'use client';

import { Star, ShieldCheck, Users, BadgeCheck, Truck } from 'lucide-react';
import { BRAND } from '@/lib/colors';

const PRODUCTS = [
  { id:'1', name:'Samsung Galaxy S23', price:32500, old:38500, badge:'-16%', vendor:'TechStore RD', rating:4.8, reviews:124, e:'📱' },
  { id:'2', name:"Nike Air Force 1 '07", price:5200, badge:'Nuevo', vendor:'SportStore', rating:4.7, reviews:89, e:'👟' },
  { id:'3', name:'Audífonos Inalámbricos', price:1850, vendor:'TechStore RD', rating:4.6, reviews:72, e:'🎧' },
  { id:'4', name:'Juego de Sala Moderno', price:28000, vendor:'Hogar Perfecto', rating:4.9, reviews:31, e:'🛋️' },
  { id:'5', name:'Reloj Curren Elegante', price:2450, old:2900, badge:'-10%', vendor:'AccesoriosRD', rating:4.5, reviews:64, e:'⌚' },
];

const STORES = [
  { name:'TechStore RD', cat:'Electrónica', rating:4.9, reviews:320, e:'📱', bg:BRAND.blue },
  { name:'Moda Urbana', cat:'Moda', rating:4.8, reviews:250, e:'👕', bg:BRAND.dark },
  { name:'Hogar Perfecto', cat:'Hogar', rating:4.7, reviews:180, e:'🛋️', bg:'#8D6E63' },
  { name:'Belleza Total', cat:'Belleza', rating:4.9, reviews:210, e:'💄', bg:BRAND.red },
  { name:'AutoPartes RD', cat:'Autos', rating:4.6, reviews:160, e:'🚗', bg:BRAND.green },
];

const TRUST = [
  { icon: ShieldCheck, title:'Compra 100% segura', sub:'Protegemos tu dinero' },
  { icon: Users, title:'Miles de compradores', sub:'Confían en nosotros' },
  { icon: BadgeCheck, title:'Productos de calidad', sub:'Verificados' },
  { icon: Truck, title:'+32 provincias', sub:'Envíos a todo el país' },
];

export function ProductGrid({ products }: { products?: any[] }) {
  const items = products?.length ? products : PRODUCTS;

  return (
    <div style={{maxWidth:1400,margin:'0 auto',padding:'8px 24px 40px'}}>

      {/* Ofertas destacadas */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',margin:'20px 0 16px'}}>
        <h2 style={{fontSize:18,fontWeight:700,color:BRAND.dark,margin:0}}>Ofertas destacadas</h2>
        <a href='/' style={{color:BRAND.blue,fontSize:13,fontWeight:600,textDecoration:'none'}}>Ver todas →</a>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:16}}>
        {items.map((p: any) => (
          <div key={p.id} style={{background:'#fff',border:'1px solid #EEE',borderRadius:10,overflow:'hidden',cursor:'pointer'}}>
            <div style={{aspectRatio:'1',background:BRAND.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,position:'relative'}}>
              {p.e || '📦'}
              {p.badge && (
                <span style={{position:'absolute',top:8,left:8,background: p.badge === 'Nuevo' ? BRAND.dark : BRAND.red,color:'#fff',fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:4}}>
                  {p.badge}
                </span>
              )}
            </div>
            <div style={{padding:14}}>
              <div style={{fontWeight:600,fontSize:14,color:BRAND.dark,marginBottom:6,lineHeight:1.3}}>{p.name}</div>
              <div style={{display:'flex',alignItems:'baseline',gap:6,marginBottom:6}}>
                <span style={{fontWeight:700,fontSize:15,color:BRAND.dark}}>RD${(p.price || 0).toLocaleString()}</span>
                {p.old && <span style={{fontSize:12,color:'#bbb',textDecoration:'line-through'}}>RD${p.old.toLocaleString()}</span>}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:BRAND.gray}}>
                <Star size={12} fill='#F5A623' color='#F5A623' />
                {p.rating} ({p.reviews})
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tiendas destacadas */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',margin:'36px 0 16px'}}>
        <h2 style={{fontSize:18,fontWeight:700,color:BRAND.dark,margin:0}}>Tiendas destacadas</h2>
        <a href='/' style={{color:BRAND.blue,fontSize:13,fontWeight:600,textDecoration:'none'}}>Ver todas →</a>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:16,marginBottom:36}}>
        {STORES.map((s,i) => (
          <div key={i} style={{background:'#fff',border:'1px solid #EEE',borderRadius:10,padding:18,display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',gap:10}}>
            <div style={{width:48,height:48,borderRadius:10,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>
              {s.e}
            </div>
            <div>
              <div style={{fontWeight:600,fontSize:13,color:BRAND.dark}}>{s.name}</div>
              <div style={{fontSize:12,color:BRAND.gray}}>{s.cat}</div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:BRAND.gray}}>
              <Star size={12} fill='#F5A623' color='#F5A623' />
              {s.rating} ({s.reviews})
            </div>
          </div>
        ))}
      </div>

      {/* Trust bar */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,background:'#fff',border:'1px solid #EEE',borderRadius:10,padding:'22px 0'}}>
        {TRUST.map((t,i) => {
          const Icon = t.icon;
          return (
            <div key={i} style={{display:'flex',alignItems:'center',gap:10,justifyContent:'center'}}>
              <Icon size={20} color={BRAND.blue} />
              <div>
                <div style={{fontWeight:600,fontSize:13,color:BRAND.dark}}>{t.title}</div>
                <div style={{fontSize:11,color:BRAND.gray}}>{t.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
