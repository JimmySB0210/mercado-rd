export function Navbar() {
  return (
    <div>
      <div style={{background:"linear-gradient(135deg,#0038A8 0%,#0055CC 50%,#1a6fd4 100%)",padding:"0 24px"}}>
        <div style={{display:"flex",alignItems:"center",gap:16,height:64,maxWidth:1400,margin:"0 auto"}}>
          <a href="/" style={{textDecoration:"none",flexShrink:0,marginRight:16}}>
            <span style={{fontWeight:900,fontSize:26,color:"#fff",letterSpacing:-1}}>Mercado</span>
            <span style={{fontWeight:900,fontSize:26,letterSpacing:-1}}>
              <span style={{color:"#ff4444"}}>R</span>
              <span style={{color:"#60aaff"}}>D</span>
            </span>
          </a>
          <div style={{flex:1,maxWidth:580}}>
            <div style={{display:"flex",borderRadius:6,overflow:"hidden",border:"2px solid #F5A200",background:"#fff"}}>
              <input type="text" placeholder="Buscar productos, tiendas dominicanas..." style={{flex:1,border:"none",padding:"11px 16px",fontSize:14,outline:"none"}}/>
              <button style={{background:"#F5A200",border:"none",padding:"11px 20px",cursor:"pointer",fontWeight:700,fontSize:15,color:"#111"}}>🔍</button>
            </div>
          </div>
          <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
            <a href="/login" style={{color:"rgba(255,255,255,0.85)",textDecoration:"none",fontSize:13,padding:"8px 14px",border:"1px solid rgba(255,255,255,0.3)",borderRadius:4}}>Iniciar sesión</a>
            <a href="/register" style={{color:"rgba(255,255,255,0.85)",textDecoration:"none",fontSize:13,padding:"8px 14px",border:"1px solid rgba(255,255,255,0.3)",borderRadius:4}}>Registrarse</a>
            <a href="/cart" style={{color:"#fff",textDecoration:"none",fontSize:13,padding:"8px 14px",border:"1px solid rgba(255,255,255,0.3)",borderRadius:4,position:"relative"}}>
              🛒 Carrito
              <span style={{position:"absolute",top:-6,right:-6,background:"#E31837",color:"#fff",borderRadius:"50%",width:17,height:17,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700}}>3</span>
            </a>
            <a href="/dashboard" style={{color:"rgba(255,255,255,0.85)",textDecoration:"none",fontSize:13,padding:"8px 14px",border:"1px solid rgba(255,255,255,0.3)",borderRadius:4}}>Mi Panel</a>
            <a href="/vendor/register" style={{background:"#F5A200",color:"#111",textDecoration:"none",padding:"9px 16px",borderRadius:6,fontWeight:800,fontSize:13,marginLeft:4}}>Vender en RD</a>
          </div>
        </div>
        <div style={{display:"flex",overflow:"hidden",maxWidth:1400,margin:"0 auto",borderTop:"1px solid rgba(255,255,255,0.1)"}}>
          {["Todos","Calzado","Ropa","Electrónica","Alimentos","Belleza","Hogar","Ferretería","Autos","Agropecuario","Ofertas 🔥"].map((cat,i) => (
            <a key={i} href={cat==="Todos"?"/":`/?cat=${cat.toLowerCase().replace(" 🔥","")}`} style={{flexShrink:0,padding:"10px 16px",color:i===0?"#fff":"rgba(255,255,255,0.75)",textDecoration:"none",fontSize:13,fontWeight:i===0?700:400,borderBottom:i===0?"2px solid #F5A200":"2px solid transparent",whiteSpace:"nowrap"}}>
              {cat}
            </a>
          ))}
        </div>
      </div>
      <div style={{background:"linear-gradient(180deg,#1a6fd4 0%,#4a9eff 20%,#c8deff 50%,#eef4ff 75%,#f4f7ff 100%)",height:28}}></div>
    </div>
  );
}
