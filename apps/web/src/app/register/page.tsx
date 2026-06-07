export default function RegisterPage() {
  return (
    <div style={{minHeight:'100vh',fontFamily:'sans-serif',background:'#f5f5f5',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',borderRadius:8,padding:48,maxWidth:420,width:'100%',boxShadow:'0 2px 20px rgba(0,0,0,0.1)'}}>
        <div style={{fontWeight:900,fontSize:24,marginBottom:24}}>
          Mercado<span style={{color:'#E31837'}}>RD</span>
        </div>
        <h1 style={{fontSize:26,fontWeight:900,marginBottom:6}}>Crear cuenta</h1>
        <p style={{color:'#666',marginBottom:28,fontSize:14}}>Empieza a comprar en RD hoy</p>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>Nombre</div>
              <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none',boxSizing:'border-box' as const}} placeholder="Tu nombre"/>
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>Apellido</div>
              <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none',boxSizing:'border-box' as const}} placeholder="Tu apellido"/>
            </div>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>Correo electrónico</div>
            <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none',boxSizing:'border-box' as const}} placeholder="tu@correo.com" type="email"/>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>WhatsApp</div>
            <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none',boxSizing:'border-box' as const}} placeholder="809-000-0000" type="tel"/>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>Provincia</div>
            <select style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none',background:'#fff',boxSizing:'border-box' as const}}>
              <option>Selecciona tu provincia...</option>
              <option>Distrito Nacional</option>
              <option>Santo Domingo</option>
              <option>Santiago</option>
              <option>La Vega</option>
              <option>San Pedro de Macorís</option>
              <option>Puerto Plata</option>
              <option>La Romana</option>
              <option>Barahona</option>
              <option>Higüey</option>
              <option>Moca</option>
              <option>San Francisco de Macorís</option>
              <option>Azua</option>
              <option>Baoruco</option>
              <option>Dajabón</option>
              <option>Duarte</option>
              <option>Elías Piña</option>
              <option>El Seibo</option>
              <option>Espaillat</option>
              <option>Hato Mayor</option>
              <option>Independencia</option>
              <option>La Altagracia</option>
              <option>La Estrelleta</option>
              <option>María Trinidad Sánchez</option>
              <option>Monseñor Nouel</option>
              <option>Monte Cristi</option>
              <option>Monte Plata</option>
              <option>Pedernales</option>
              <option>Peravia</option>
              <option>Samaná</option>
              <option>Sánchez Ramírez</option>
              <option>San Cristóbal</option>
              <option>San José de Ocoa</option>
              <option>Santiago Rodríguez</option>
              <option>Valverde (Mao)</option>
            </select>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6}}>Contraseña</div>
            <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none',boxSizing:'border-box' as const}} placeholder="Mínimo 8 caracteres" type="password"/>
          </div>
          <label style={{display:'flex',gap:8,fontSize:13,cursor:'pointer',alignItems:'flex-start'}}>
            <input type="checkbox" style={{marginTop:2}}/>
            <span style={{color:'#666'}}>Acepto los <a href="#" style={{color:'#111',fontWeight:600}}>Términos</a> y la <a href="#" style={{color:'#111',fontWeight:600}}>Política de Privacidad</a></span>
          </label>
          <button style={{background:'#111',color:'#fff',border:'none',padding:14,borderRadius:4,fontWeight:700,fontSize:15,cursor:'pointer'}}>
            Crear mi cuenta gratis →
          </button>
          <div style={{textAlign:'center',fontSize:13,color:'#999'}}>
            ¿Ya tienes cuenta? <a href="/login" style={{color:'#111',fontWeight:700,textDecoration:'none'}}>Iniciar sesión</a>
          </div>
        </div>
      </div>
    </div>
  );
}
