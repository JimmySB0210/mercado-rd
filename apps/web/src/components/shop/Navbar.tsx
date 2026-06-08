export function Navbar() {
  return (
    <nav style={{background:'#111',height:56,display:'flex',alignItems:'center',padding:'0 20px',gap:16,position:'sticky',top:0,zIndex:500,boxShadow:'0 2px 10px rgba(0,0,0,0.3)'}}>
      <a href="/" style={{fontWeight:900,fontSize:20,color:'#fff',textDecoration:'none',flexShrink:0,letterSpacing:-0.5}}>
        Mercado<span style={{color:'#E31837'}}>RD</span>
      </a>
      <div style={{flex:1,maxWidth:480,margin:'0 16px'}}>
        <div style={{display:'flex',background:'#fff',borderRadius:4,overflow:'hidden',border:'2px solid #F5A200'}}>
          <input
            type="text"
            placeholder="Buscar productos, tiendas..."
            style={{flex:1,border:'none',padding:'8px 14px',fontSize:14,outline:'none',fontFamily:'sans-serif'}}
          />
          <button style={{background:'#F5A200',border:'none',padding:'8px 14px',cursor:'pointer',fontSize:14,fontWeight:700,color:'#111'}}>
            🔍
          </button>
        </div>
      </div>
      <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
        <a href="/login" style={{color:'rgba(255,255,255,0.7)',fontSize:13,textDecoration:'none',padding:'7px 14px',border:'1px solid rgba(255,255,255,0.2)',borderRadius:4,fontWeight:500,transition:'all 0.15s'}}>
          Iniciar sesión
        </a>
        <a href="/register" style={{color:'rgba(255,255,255,0.7)',fontSize:13,textDecoration:'none',padding:'7px 14px',border:'1px solid rgba(255,255,255,0.2)',borderRadius:4,fontWeight:500}}>
          Registrarse
        </a>
        <a href="/cart" style={{position:'relative',color:'#fff',fontSize:13,textDecoration:'none',padding:'7px 14px',border:'1px solid rgba(255,255,255,0.2)',borderRadius:4,fontWeight:500,display:'flex',alignItems:'center',gap:6}}>
          🛒 Carrito
          <span style={{position:'absolute',top:-6,right:-6,background:'#E31837',color:'#fff',borderRadius:'50%',width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700}}>
            3
          </span>
        </a>
        <a href="/dashboard" style={{background:'#fff',color:'#111',fontSize:13,textDecoration:'none',padding:'7px 14px',borderRadius:4,fontWeight:700}}>
          Mi Panel
        </a>
        <a href="/vendor/register" style={{background:'#F5A200',color:'#111',fontSize:13,textDecoration:'none',padding:'7px 14px',borderRadius:4,fontWeight:700}}>
          Vender en RD
        </a>
      </div>
    </nav>
  );
}