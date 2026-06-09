export function Navbar() {
  return (
    <div>
      <div style={{background:'linear-gradient(135deg,#0038A8 0%,#0055CC 50%,#1a6fd4 100%)',padding:'0 24px'}}>
        <div style={{display:'flex',alignItems:'center',gap:16,height:64,maxWidth:1400,margin:'0 auto'}}>
          <a href="/" style={{textDecoration:'none',flexShrink:0,marginRight:16}}>
            <span style={{fontWeight:900,fontSize:26,color:'#fff',letterSpacing:-1}}>Mercado</span>
            <span style={{fontWeight:900,fontSize:26,letterSpacing:-1}}>
              <span style={{color:'#ff4444'}}>R</span>
              <span style={{color:'#60aaff'}}>D</span>
            </span>
          </a>
          <div style={{flex:1,maxWidth:580}}>
            <div style={{display:'flex',borderRadius:6,overflow:'hidden',border:'2px solid #F5A200',background:'#fff'}}>
              <input type="text" placeholder="Buscar productos, tiendas dominicanas..." style={{flex:1,border:'none',padding:'11px 16px',fontSize:14,outline:'none',fontFamily:'sans-serif'}}/>
              <button style={{background:'#F5A200',border:'none',padding:'11px 20px',cursor:'pointer',fontWeight:700,fontSize:15,color:'#111'}}>
                🔍
              </button>
            </div>
          </div>
          <div style={{marginLeft:'auto',display:'flex',gap:4,alignItems:'center',flexShrink:0}}>
            <a href="/login" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,color:'rgba(255,255,255,0.85)',textDecoration:'none',padding:'6px 12px',borderRadius:4}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span style={{fontSize:11,whiteSpace:'nowrap'}}>Iniciar sesión</span>
            </a>
            <a href="/register" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,color:'rgba(255,255,255,0.85)',textDecoration:'none',padding:'6px 12px',borderRadius:4}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/>
                <line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
              <span style={{fontSize:11,whiteSpace:'nowrap'}}>Registrarse</span>
            </a>
            <a href="/cart" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,color:'rgba(255,255,255,0.85)',textDecoration:'none',padding:'6px 12px',borderRadius:4,position:'relative'}}>
              <div style={{position:'relative'}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                <span style={{position:'absolute',top:-8,right:-10,background:'#E31837',color:'#fff',borderRadius:'50%',width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700}}>3</span>
              </div>
              <span style={{fontSize:11}}>Carrito</span>
            </a>
            <a href="/dashboard" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,color:'rgba(255,255,255,0.85)',textDecoration:'none',padding:'6px 12px',borderRadius:4}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
              </svg>
              <span style={{fontSize:11}}>Mi Panel</span>
            </a>
            <a href="/vendor/register" style={{background:'#F5A200',color:'#111',textDecoration:'none',padding:'10px 16px',borderRadius:6,fontWeight:800,fontSize:13,marginLeft:8,whiteSpace:'nowrap',boxShadow:'0 2px 8px rgba(0,0,0,0.2)'}}>
              Vender en RD
            </a>
          </div>
        </div>
        <div style={{display:'flex',overflow:'hidden',maxWidth:1400,margin:'0 auto',borderTop:'1px solid rgba(255,255,255,0.1)'}}>
          {['Todos','Calzado','Ropa','Electrónica','Alimentos','Belleza','Hogar','Ferretería','Autos','Agropecuario','Ofertas 🔥'].map((cat,i) => (
            <a key={i} href={cat==='Todos'?'/':'/?cat='+cat.toLowerCase().replace(' 🔥','')} style={{flexShrink:0,padding:'10px 16px',color:i===0?'#fff':'rgba(255,255,255,0.75)',textDecoration:'none',fontSize:13,fontWeight:i===0?700:400,borderBottom:i===0?'2px solid #F5A200':'2px solid transparent',whiteSpace:'nowrap',background:'transparent'}}>
              {cat}
            </a>
          ))}
        </div>
      </div>
      <div style={{background:'linear-gradient(180deg,#1a6fd4 0%,#4a9eff 20%,#c8deff 50%,#eef4ff 75%,#f4f7ff 100%)',height:28}}></div>
    </div>
  );
}
