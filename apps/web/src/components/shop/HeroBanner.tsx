export function HeroBanner() {
  const tabs = ['Todos los productos', 'Tiendas verificadas', 'Ofertas del día'];

  return (
    <div style={{background:'#f0f4ff',borderBottom:'1px solid #dde8ff',padding:'40px 24px 36px'}}>
      <div style={{maxWidth:1400,margin:'0 auto'}}>

        {/* Tabs — like Alibaba's mode tabs */}
        <div style={{display:'flex',justifyContent:'center',marginBottom:28}}>
          <div style={{display:'flex',background:'#fff',borderRadius:6,border:'1px solid #dde8ff',overflow:'hidden',boxShadow:'0 2px 8px rgba(0,56,168,0.08)'}}>
            {tabs.map((tab,i) => (
              <button key={i} style={{
                padding:'11px 28px',
                border:'none',
                borderRight: i < tabs.length - 1 ? '1px solid #dde8ff' : 'none',
                background: i === 0 ? '#0038A8' : '#fff',
                color: i === 0 ? '#fff' : '#555',
                fontWeight: i === 0 ? 700 : 400,
                fontSize:14,
                cursor:'pointer',
              }}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Hero text */}
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontSize:12,fontWeight:700,color:'#0038A8',textTransform:'uppercase',letterSpacing:2,marginBottom:10}}>
            🇩🇴 El marketplace dominicano
          </div>
          <h1 style={{fontSize:38,fontWeight:900,color:'#111',lineHeight:1.15,margin:'0 0 12px'}}>
            Compra y vende en toda la República
          </h1>
          <p style={{color:'#666',fontSize:15,margin:0}}>
            Miles de negocios locales · 32 provincias · Pagos seguros
          </p>
        </div>

        {/* Value badges */}
        <div style={{display:'flex',justifyContent:'center',gap:36}}>
          {[
            'Miles de tiendas locales',
            '32 provincias cubiertas',
            'Compra 100% protegida',
          ].map((label,i) => (
            <div key={i} style={{display:'flex',alignItems:'center',gap:7,fontSize:13,color:'#444'}}>
              <span style={{color:'#0038A8',fontWeight:900,fontSize:16}}>✓</span>
              {label}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
