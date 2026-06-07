export default function VendorRegisterPage() {
  return (
    <div style={{minHeight:'100vh',fontFamily:'sans-serif',background:'#f5f5f5',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',borderRadius:8,padding:48,maxWidth:500,width:'100%',boxShadow:'0 2px 20px rgba(0,0,0,0.1)'}}>
        <div style={{fontWeight:900,fontSize:24,marginBottom:8}}>
          Mercado<span style={{color:'#E31837'}}>RD</span>
        </div>
        <h1 style={{fontSize:28,fontWeight:900,marginBottom:8}}>Registra tu negocio</h1>
        <p style={{color:'#666',marginBottom:28}}>Únete a miles de vendedores dominicanos</p>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <input style={{border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none'}} placeholder="Nombre del negocio *"/>
          <input style={{border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none'}} placeholder="RNC o Cédula *"/>
          <input style={{border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none'}} placeholder="WhatsApp *"/>
          <input style={{border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none'}} placeholder="Correo electrónico *"/>
          <select style={{border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none',background:'#fff'}}>
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
          <select style={{border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none',background:'#fff'}}>
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
          <button style={{background:'#111',color:'#fff',border:'none',padding:14,borderRadius:4,fontWeight:700,fontSize:15,cursor:'pointer'}}>
            Crear mi tienda gratis →
          </button>
        </div>
        <p style={{textAlign:'center',marginTop:16,fontSize:13,color:'#999'}}>
          ¿Ya tienes cuenta? <a href="/" style={{color:'#111',fontWeight:600}}>Iniciar sesión</a>
        </p>
      </div>
    </div>
  );
}
