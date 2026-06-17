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

export default function VendorRegisterPage() {
  return (
    <div style={{minHeight:'100vh',background:BRAND.bg,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div className="auth-card" style={{background:'#fff',borderRadius:12,maxWidth:500,width:'100%',boxShadow:'0 2px 20px rgba(0,0,0,0.08)'}}>
        <div style={{fontWeight:700,fontSize:24,marginBottom:8}}>
          <span style={{color:BRAND.blue}}>Mercado</span><span style={{color:BRAND.red}}>RD</span>
        </div>
        <h1 style={{fontSize:26,fontWeight:700,marginBottom:6,color:BRAND.dark}}>Registra tu negocio</h1>
        <p style={{color:BRAND.gray,marginBottom:28,fontSize:14}}>Únete a miles de vendedores dominicanos</p>

        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <input style={inputStyle} placeholder="Nombre del negocio *"/>
          <input style={inputStyle} placeholder="RNC o Cédula *"/>
          <input style={inputStyle} placeholder="WhatsApp *"/>
          <input style={inputStyle} placeholder="Correo electrónico *" type="email"/>

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

          <select style={{...inputStyle,background:'#fff'}}>
            <option>Selecciona tu categoría...</option>
            <option>Ropa y Moda</option>
            <option>Electrónica</option>
            <option>Alimentos</option>
            <option>Belleza</option>
            <option>Hogar</option>
            <option>Ferretería</option>
            <option>Autos y Repuestos</option>
            <option>Agropecuario</option>
          </select>

          <button style={{background:BRAND.blue,color:'#fff',border:'none',padding:14,borderRadius:8,fontWeight:600,fontSize:15,cursor:'pointer'}}>
            Crear mi tienda gratis
          </button>
        </div>

        <p style={{textAlign:'center',marginTop:18,fontSize:13,color:BRAND.gray}}>
          ¿Ya tienes cuenta? <a href="/login" style={{color:BRAND.blue,fontWeight:600,textDecoration:'none'}}>Iniciar sesión</a>
        </p>
      </div>
    </div>
  );
}
