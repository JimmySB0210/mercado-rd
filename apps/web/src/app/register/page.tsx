import { BRAND } from '@/lib/colors';

const inputStyle = {
  width:'100%',
  border:'1px solid #E0E0E0',
  borderRadius:8,
  padding:'11px 13px',
  fontSize:14,
  outline:'none',
  boxSizing:'border-box' as const,
};

const labelStyle = {
  fontSize:13,
  fontWeight:500,
  color:BRAND.dark,
  marginBottom:6,
};

export default function RegisterPage() {
  return (
    <div style={{minHeight:'100vh',background:BRAND.bg,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div className="auth-card" style={{background:'#fff',borderRadius:12,maxWidth:420,width:'100%',boxShadow:'0 2px 20px rgba(0,0,0,0.08)'}}>
        <div style={{fontWeight:700,fontSize:24,marginBottom:8}}>
          <span style={{color:BRAND.blue}}>Mercado</span><span style={{color:BRAND.red}}>RD</span>
        </div>
        <h1 style={{fontSize:26,fontWeight:700,marginBottom:6,color:BRAND.dark}}>Crear cuenta</h1>
        <p style={{color:BRAND.gray,marginBottom:28,fontSize:14}}>Empieza a comprar en RD hoy</p>

        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div>
              <div style={labelStyle}>Nombre</div>
              <input style={inputStyle} placeholder="Tu nombre"/>
            </div>
            <div>
              <div style={labelStyle}>Apellido</div>
              <input style={inputStyle} placeholder="Tu apellido"/>
            </div>
          </div>

          <div>
            <div style={labelStyle}>Correo electrónico</div>
            <input style={inputStyle} placeholder="tu@correo.com" type="email"/>
          </div>

          <div>
            <div style={labelStyle}>WhatsApp</div>
            <input style={inputStyle} placeholder="809-000-0000" type="tel"/>
          </div>

          <div>
            <div style={labelStyle}>Provincia</div>
            <select style={{...inputStyle,background:'#fff'}}>
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
            <div style={labelStyle}>Contraseña</div>
            <input style={inputStyle} placeholder="Mínimo 8 caracteres" type="password"/>
          </div>

          <label style={{display:'flex',gap:8,fontSize:13,cursor:'pointer',alignItems:'flex-start'}}>
            <input type="checkbox" style={{marginTop:2}}/>
            <span style={{color:BRAND.gray}}>Acepto los <a href="#" style={{color:BRAND.blue,fontWeight:600}}>Términos</a> y la <a href="#" style={{color:BRAND.blue,fontWeight:600}}>Política de Privacidad</a></span>
          </label>

          <button style={{background:BRAND.red,color:'#fff',border:'none',padding:14,borderRadius:8,fontWeight:600,fontSize:15,cursor:'pointer'}}>
            Crear mi cuenta gratis
          </button>

          <div style={{textAlign:'center',fontSize:13,color:BRAND.gray}}>
            ¿Ya tienes cuenta? <a href="/login" style={{color:BRAND.blue,fontWeight:600,textDecoration:'none'}}>Iniciar sesión</a>
          </div>
        </div>
      </div>
    </div>
  );
}
