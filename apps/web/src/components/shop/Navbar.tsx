'use client';

import { Search, ChevronDown, ShoppingCart } from 'lucide-react';
import { BRAND } from '@/lib/colors';

const CATEGORIES = ['Electrónica', 'Moda', 'Hogar', 'Belleza', 'Deportes', 'Autos', 'Más'];

export function Navbar() {
  return (
    <header style={{background:'#fff',borderBottom:'1px solid #EAEAEA'}}>

      {/* ── Desktop row ── */}
      <div className="mrd-desktop-row" style={{alignItems:'center',gap:20,maxWidth:1400,margin:'0 auto',padding:'16px 24px'}}>

        <a href='/' style={{textDecoration:'none',flexShrink:0}}>
          <span style={{fontWeight:700,fontSize:24,color:BRAND.blue}}>Mercado</span>
          <span style={{fontWeight:700,fontSize:24,color:BRAND.red}}>RD</span>
        </a>

        <div style={{flex:1,maxWidth:560,position:'relative'}}>
          <input
            type='text'
            placeholder='Buscar productos, tiendas...'
            style={{width:'100%',border:'1px solid #E0E0E0',background:BRAND.bg,borderRadius:24,padding:'11px 50px 11px 18px',fontSize:14,outline:'none',color:BRAND.dark,boxSizing:'border-box'}}
          />
          <button style={{position:'absolute',right:4,top:4,bottom:4,width:38,border:'none',borderRadius:'50%',background:BRAND.blue,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
            <Search size={16} />
          </button>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',flexShrink:0}}>
          <div style={{lineHeight:1.3}}>
            <div style={{fontSize:11,color:BRAND.gray}}>Enviar a</div>
            <div style={{display:'flex',alignItems:'center',gap:2}}>
              <span style={{fontSize:13,fontWeight:600,color:BRAND.dark}}>Rep. Dom.</span>
              <ChevronDown size={14} color={BRAND.gray} />
            </div>
          </div>
        </div>

        <a href='/cart' style={{position:'relative',color:BRAND.dark,flexShrink:0,display:'flex'}}>
          <ShoppingCart size={22} />
          <span style={{position:'absolute',top:-6,right:-8,background:BRAND.red,color:'#fff',borderRadius:'50%',width:17,height:17,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700}}>3</span>
        </a>

        <a href='/login' style={{color:BRAND.dark,textDecoration:'none',fontSize:14,flexShrink:0,whiteSpace:'nowrap'}}>Iniciar sesión</a>

        <a href='/vendor/register' style={{background:BRAND.blue,color:'#fff',textDecoration:'none',padding:'10px 20px',borderRadius:8,fontWeight:600,fontSize:14,flexShrink:0,whiteSpace:'nowrap'}}>
          Vender en RD
        </a>
      </div>

      {/* ── Mobile rows ── */}
      <div className="mrd-mobile-row" style={{padding:'12px 16px 10px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
          <a href='/' style={{textDecoration:'none'}}>
            <span style={{fontWeight:700,fontSize:20,color:BRAND.blue}}>Mercado</span>
            <span style={{fontWeight:700,fontSize:20,color:BRAND.red}}>RD</span>
          </a>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <div style={{display:'flex',alignItems:'center',gap:2,fontSize:12,color:BRAND.gray}}>
              Rep. Dom. <ChevronDown size={13} color={BRAND.gray} />
            </div>
            <a href='/cart' style={{position:'relative',color:BRAND.dark,display:'flex'}}>
              <ShoppingCart size={21} />
              <span style={{position:'absolute',top:-6,right:-8,background:BRAND.red,color:'#fff',borderRadius:'50%',width:16,height:16,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700}}>3</span>
            </a>
          </div>
        </div>
        <div style={{position:'relative'}}>
          <input
            type='text'
            placeholder='Buscar productos, tiendas...'
            style={{width:'100%',border:'1px solid #E0E0E0',background:BRAND.bg,borderRadius:24,padding:'10px 44px 10px 16px',fontSize:13,outline:'none',color:BRAND.dark,boxSizing:'border-box'}}
          />
          <button style={{position:'absolute',right:3,top:3,bottom:3,width:32,border:'none',borderRadius:'50%',background:BRAND.blue,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Search size={14} />
          </button>
        </div>
      </div>

      {/* ── Category bar (shared, scrollable) ── */}
      <div style={{background:BRAND.blue}}>
        <div className="mrd-cats" style={{display:'flex',alignItems:'center',maxWidth:1400,margin:'0 auto',padding:'0 24px'}}>
          <a href='/' style={{display:'flex',alignItems:'center',gap:8,padding:'11px 16px',color:'#fff',textDecoration:'none',fontSize:13,fontWeight:600,background:'rgba(255,255,255,0.14)',flexShrink:0,whiteSpace:'nowrap'}}>
            ☰ Todas las categorías
          </a>
          {CATEGORIES.map((cat,i) => (
            <a key={i} href={'/?cat='+cat.toLowerCase()} style={{padding:'11px 16px',color:'rgba(255,255,255,0.85)',textDecoration:'none',fontSize:13,whiteSpace:'nowrap',flexShrink:0}}>
              {cat}
            </a>
          ))}
          <a href='/vendor/register' style={{padding:'11px 16px',color:'#fff',textDecoration:'none',fontSize:13,fontWeight:700,whiteSpace:'nowrap',flexShrink:0}}>
            Vender en RD
          </a>
        </div>
      </div>

      <style jsx>{`
        .mrd-desktop-row { display: flex; }
        .mrd-mobile-row { display: none; }
        .mrd-cats {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .mrd-cats::-webkit-scrollbar { display: none; }
        @media (max-width: 860px) {
          .mrd-desktop-row { display: none; }
          .mrd-mobile-row { display: block; }
        }
      `}</style>
    </header>
  );
}
