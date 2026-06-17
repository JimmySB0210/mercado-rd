import { ShieldCheck, Truck, Store, Headset } from 'lucide-react';
import { BRAND } from '@/lib/colors';

const PERKS = [
  { icon: ShieldCheck, title: 'Pago seguro', sub: 'Protegemos tu compra' },
  { icon: Truck, title: 'Envíos a todo el país', sub: 'Rápido y confiable' },
  { icon: Store, title: 'Miles de tiendas', sub: 'Apoya lo local' },
  { icon: Headset, title: 'Soporte 24/7', sub: 'Estamos para ayudarte' },
];

const CATEGORIES = [
  { e: '💻', label: 'Electrónica' },
  { e: '👗', label: 'Moda' },
  { e: '🏠', label: 'Hogar' },
  { e: '💄', label: 'Belleza' },
  { e: '⚽', label: 'Deportes' },
  { e: '🚗', label: 'Autos' },
  { e: '🧸', label: 'Juguetes' },
  { e: '⋯', label: 'Más' },
];

export function HeroBanner() {
  return (
    <div style={{maxWidth:1400,margin:'0 auto',padding:'24px 24px 0'}}>

      {/* Hero card */}
      <div style={{
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
        <div style={{flex:'1 1 320px',minWidth:280}}>
          <h1 style={{fontSize:32,fontWeight:700,lineHeight:1.25,margin:'0 0 14px'}}>
            Compra y vende<br/>en toda República<br/>Dominicana
          </h1>
          <p style={{color:'rgba(255,255,255,0.75)',fontSize:14,margin:'0 0 22px',maxWidth:320}}>
            Miles de productos, tiendas y personas conectados contigo.
          </p>
          <a href='/' style={{display:'inline-block',background:BRAND.red,color:'#fff',textDecoration:'none',padding:'13px 26px',borderRadius:8,fontWeight:600,fontSize:14}}>
            Explorar productos
          </a>
        </div>

        <div className="hero-perks" style={{flex:'1 1 320px'}}>
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

      {/* Category icons row — blue bar */}
      <div style={{background:BRAND.blue,borderRadius:16,padding:'20px 16px',margin:'28px 0'}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
          {CATEGORIES.map((c,i) => (
            <a key={i} href={'/?cat='+c.label.toLowerCase()} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,textDecoration:'none',color:'#fff',minWidth:72}}>
              <div style={{width:56,height:56,borderRadius:'50%',background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>
                {c.e}
              </div>
              <span style={{fontSize:12,fontWeight:500}}>{c.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
