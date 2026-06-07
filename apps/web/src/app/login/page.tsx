export default function LoginPage() {
  return (
    <div style={{minHeight:'100vh',fontFamily:'sans-serif',background:'#f5f5f5',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',borderRadius:8,padding:48,maxWidth:420,width:'100%',boxShadow:'0 2px 20px rgba(0,0,0,0.1)'}}>
        <div style={{fontWeight:900,fontSize:24,marginBottom:24}}>
          Mercado<span style={{color:'#E31837'}}>RD</span>
        </div>
        <h1 style={{fontSize:26,fontWeight:900,marginBottom:6}}>Iniciar sesión</h1>
        <p style={{color:'#666',marginBottom:28,fontSize:14}}>Bienvenido de vuelta</p>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>Correo electrónico</div>
            <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none',boxSizing:'border-box' as const}} placeholder="tu@correo.com" type="email"/>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>Contraseña</div>
            <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none',boxSizing:'border-box' as const}} placeholder="Tu contraseña" type="password"/>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <a href="#" style={{fontSize:13,color:'#0038A8',textDecoration:'none'}}>¿Olvidaste tu contraseña?</a>
          </div>
          <button style={{background:'#111',color:'#fff',border:'none',padding:14,borderRadius:4,fontWeight:700,fontSize:15,cursor:'pointer'}}>
            Entrar →
          </button>
          <div style={{textAlign:'center',fontSize:13,color:'#999'}}>
            ¿No tienes cuenta? <a href="/register" style={{color:'#111',fontWeight:700,textDecoration:'none'}}>Regístrate gratis</a>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,margin:'4px 0'}}>
            <div style={{flex:1,height:1,background:'#eee'}}></div>
            <span style={{fontSize:12,color:'#999'}}>o continúa con</span>
            <div style={{flex:1,height:1,background:'#eee'}}></div>
          </div>
          <button style={{background:'#fff',border:'1px solid #ddd',padding:12,borderRadius:4,fontWeight:600,fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            <span>🌐</span> Continuar con Google
          </button>
        </div>
        <p style={{textAlign:'center',marginTop:20,fontSize:12,color:'#bbb',lineHeight:1.6}}>
          Al entrar aceptas nuestros <a href="#" style={{color:'#999'}}>Términos de Servicio</a> y <a href="#" style={{color:'#999'}}>Política de Privacidad</a>
        </p>
      </div>
    </div>
  );
}
