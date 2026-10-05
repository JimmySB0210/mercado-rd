export default function ComingSoonPage() {
  return (
    <div style={{minHeight:'100vh',fontFamily:'var(--font-body)',background:'#111',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',padding:24}}>
      <div style={{textAlign:'center',maxWidth:600}}>
        <div style={{fontWeight:700,fontSize:'var(--text-h1)',color:'#fff',marginBottom:8}}>
          Mercado<span style={{color:'#E31837'}}>RD</span>
        </div>
        <div style={{fontSize:'var(--text-small)',color:'#555',textTransform:'uppercase',letterSpacing:2,marginBottom:48}}>
          🇩🇴 El marketplace dominicano
        </div>
        <h1 style={{fontSize:'var(--text-display)',fontWeight:700,color:'#fff',lineHeight:'var(--leading-display)',marginBottom:16}}>
          Algo grande<br/>está llegando
        </h1>
        <p style={{color:'#666',fontSize:'var(--text-body)',lineHeight:1.6,marginBottom:48}}>
          Estamos construyendo el marketplace más completo de República Dominicana. Miles de negocios locales en un solo lugar.
        </p>

        <div style={{display:'flex',gap:16,justifyContent:'center',marginBottom:48}}>
          {[
            {num:'00',label:'Días'},
            {num:'00',label:'Horas'},
            {num:'00',label:'Minutos'},
            {num:'00',label:'Segundos'},
          ].map((t,i) => (
            <div key={i} style={{background:'#1a1a1a',borderRadius:8,padding:'20px 24px',minWidth:80,border:'1px solid #222'}}>
              <div style={{fontWeight:700,fontSize:'var(--text-metric)',lineHeight:'var(--leading-price)',color:'#fff',fontVariantNumeric:'tabular-nums'}}>{t.num}</div>
              <div style={{fontSize:'var(--text-caption)',color:'#555',textTransform:'uppercase',letterSpacing:1,marginTop:4}}>{t.label}</div>
            </div>
          ))}
        </div>

        <div style={{marginBottom:32}}>
          <p style={{color:'#555',fontSize:'var(--text-ui)',marginBottom:12}}>Déjanos tu correo y te avisamos el día del lanzamiento</p>
          <div style={{display:'flex',gap:8,maxWidth:400,margin:'0 auto'}}>
            <input
              style={{flex:1,border:'1px solid #333',borderRadius:4,padding:'12px 14px',fontSize:'var(--text-ui)',outline:'none',background:'#1a1a1a',color:'#fff'}}
              placeholder="tu@correo.com"
              type="email"
            />
            <button style={{background:'#E31837',color:'#fff',border:'none',padding:'12px 20px',borderRadius:4,fontWeight:700,fontSize:'var(--text-ui)',cursor:'pointer',whiteSpace:'nowrap' as const}}>
              Notifícame
            </button>
          </div>
        </div>

        <div style={{display:'flex',gap:24,justifyContent:'center',fontSize:'var(--text-small)',color:'#444'}}>
          <span>✅ Gratis para compradores</span>
          <span>✅ 32 provincias</span>
          <span>✅ Pagos seguros</span>
        </div>

        <div style={{marginTop:48,paddingTop:24,borderTop:'1px solid #1a1a1a',display:'flex',gap:20,justifyContent:'center'}}>
          <a href="/" style={{color:'#555',fontSize:'var(--text-small)',textDecoration:'none'}}>← Volver al inicio</a>
          <a href="/vendor/register" style={{color:'#E31837',fontSize:'var(--text-small)',textDecoration:'none',fontWeight:600}}>Registrar mi negocio →</a>
        </div>
      </div>
    </div>
  );
}
