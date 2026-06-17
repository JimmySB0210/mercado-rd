export function Navbar() {
  return (
    <header>
      {/* ── Top bar: white, like Alibaba ── */}
      <div style={{background:'#fff',borderBottom:'1px solid #e8e8e8'}}>
        <div style={{display:'flex',alignItems:'center',gap:16,height:72,maxWidth:1400,margin:'0 auto',padding:'0 24px'}}>

          {/* Logo */}
          <a href='/' style={{textDecoration:'none',flexShrink:0,marginRight:8}}>
            <span style={{fontWeight:900,fontSize:26,color:'#4A7FD6',letterSpacing:-1}}>Mercado</span>
            <span style={{fontWeight:900,fontSize:26,color:'#E31837',letterSpacing:-1}}>RD</span>
          </a>

          {/* Search bar */}
          <div style={{flex:1,maxWidth:680}}>
            <div style={{display:'flex',borderRadius:4,overflow:'hidden',border:'2px solid #4A7FD6'}}>
              <input
                type='text'
                placeholder='Buscar productos, tiendas dominicanas...'
                style={{flex:1,border:'none',padding:'13px 16px',fontSize:14,outline:'none',color:'#333'}}
              />
              <button style={{background:'#4A7FD6',border:'none',padding:'13px 24px',cursor:'pointer',fontWeight:700,fontSize:14,color:'#fff',whiteSpace:'nowrap'}}>
                🔍 Buscar
              </button>
            </div>
          </div>

          {/* Right controls */}
          <div style={{display:'flex',alignItems:'center',gap:4,marginLeft:'auto',flexShrink:0}}>

            {/* Location */}
            <div style={{padding:'0 10px',cursor:'pointer',textAlign:'center'}}>
              <div style={{fontSize:11,color:'#888',lineHeight:'1.4'}}>🇩🇴 Entregar en</div>
              <div style={{fontSize:13,fontWeight:700,color:'#111',lineHeight:'1.4'}}>Rep. Dom.</div>
            </div>

            {/* Cart */}
            <a href='/cart' style={{position:'relative',padding:'6px 12px',color:'#333',textDecoration:'none',textAlign:'center'}}>
              <div style={{fontSize:22}}>🛒</div>
              <div style={{fontSize:11,color:'#888'}}>Carrito</div>
              <span style={{position:'absolute',top:2,right:6,background:'#E31837',color:'#fff',borderRadius:'50%',width:16,height:16,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700}}>3</span>
            </a>

            {/* Login */}
            <a href='/login' style={{padding:'6px 12px',color:'#333',textDecoration:'none',textAlign:'center'}}>
              <div style={{fontSize:22}}>👤</div>
              <div style={{fontSize:11,color:'#888'}}>Iniciar sesión</div>
            </a>

            {/* Register */}
            <a href='/register' style={{border:'2px solid #4A7FD6',color:'#4A7FD6',textDecoration:'none',padding:'9px 16px',borderRadius:4,fontWeight:700,fontSize:13,whiteSpace:'nowrap'}}>
              Registrarse
            </a>

            {/* Sell CTA */}
            <a href='/vendor/register' style={{background:'#F5A200',color:'#111',textDecoration:'none',padding:'10px 16px',borderRadius:4,fontWeight:800,fontSize:13,whiteSpace:'nowrap',marginLeft:4}}>
              Vender en RD
            </a>
          </div>
        </div>
      </div>

      {/* ── Category bar: blue ── */}
      <div style={{background:'#4A7FD6'}}>
        <div style={{display:'flex',alignItems:'center',maxWidth:1400,margin:'0 auto',padding:'0 24px',overflow:'hidden'}}>
          <a href='/' style={{display:'flex',alignItems:'center',gap:8,padding:'10px 16px',color:'#fff',textDecoration:'none',fontSize:13,fontWeight:700,background:'rgba(0,0,0,0.18)',flexShrink:0,whiteSpace:'nowrap'}}>
            ☰ Todas las categorías
          </a>
          {['Calzado','Ropa','Electrónica','Alimentos','Belleza','Hogar','Ferretería','Autos','Agropecuario'].map((cat,i) => (
            <a key={i} href={'/?cat='+cat.toLowerCase()} style={{padding:'10px 14px',color:'rgba(255,255,255,0.88)',textDecoration:'none',fontSize:13,whiteSpace:'nowrap',flexShrink:0}}>
              {cat}
            </a>
          ))}
        </div>
      </div>
    </header>
  );
}
