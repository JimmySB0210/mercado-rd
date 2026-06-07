export default function ConfirmPage() {
  return (
    <div style={{minHeight:'100vh',fontFamily:'sans-serif',background:'#f5f5f5'}}>
      <div style={{background:'#111',padding:'16px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <a href="/" style={{fontWeight:900,fontSize:20,color:'#fff',textDecoration:'none'}}>
          Mercado<span style={{color:'#E31837'}}>RD</span>
        </a>
        <span style={{color:'#00873D',fontSize:13,fontWeight:700}}>✓ Pedido confirmado</span>
      </div>

      <div style={{maxWidth:680,margin:'0 auto',padding:28}}>

        <div style={{background:'#fff',borderRadius:8,padding:36,textAlign:'center',marginBottom:20,boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
          <div style={{width:72,height:72,borderRadius:'50%',background:'#00873D',color:'#fff',fontSize:32,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}}>
            ✓
          </div>
          <h1 style={{fontSize:28,fontWeight:900,marginBottom:8}}>¡Pedido confirmado!</h1>
          <p style={{color:'#666',marginBottom:16,lineHeight:1.6}}>
            Gracias por comprar en MercadoRD 🇩🇴<br/>
            Recibirás confirmación por WhatsApp en los próximos minutos.
          </p>
          <div style={{background:'#f5f5f5',borderRadius:6,padding:'10px 24px',display:'inline-block',fontFamily:'monospace',fontWeight:800,fontSize:16,letterSpacing:1}}>
            # RD-8824
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
          <div style={{background:'#fff',borderRadius:8,padding:18,boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
            <div style={{fontWeight:800,fontSize:13,marginBottom:12,textTransform:'uppercase',letterSpacing:0.5}}>📍 Entrega</div>
            <div style={{fontSize:13,color:'#444',lineHeight:1.7}}>
              María Rodríguez<br/>
              Calle El Conde #24, Naco<br/>
              Santo Domingo Este<br/>
              📱 809-555-0192
            </div>
          </div>
          <div style={{background:'#fff',borderRadius:8,padding:18,boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
            <div style={{fontWeight:800,fontSize:13,marginBottom:12,textTransform:'uppercase',letterSpacing:0.5}}>🚚 Envío</div>
            <div style={{fontSize:13,color:'#444',lineHeight:1.7}}>
              Express SDQ<br/>
              Hoy antes de las 6:00 PM<br/>
              Tracking: <span style={{fontFamily:'monospace',fontWeight:700,color:'#0038A8'}}>RDX-482-2024</span>
            </div>
          </div>
        </div>

        <div style={{background:'#fff',borderRadius:8,overflow:'hidden',marginBottom:20,boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
          <div style={{padding:'12px 18px',background:'#f5f5f5',fontWeight:800,fontSize:13,textTransform:'uppercase',letterSpacing:0.5}}>
            📦 Productos
          </div>
          {[
            {e:'👟',name:'Tenis Nike Air Premium',meta:'Azul · Talla 40 · x1',vendor:'SportStore Santiago',price:3200},
            {e:'🌿',name:'Especias dominicanas Pack x3',meta:'Cant. 2',vendor:'AgroVerde · La Vega',price:900},
            {e:'👗',name:'Vestido floral verano 2026',meta:'Rosa · Talla M · x1',vendor:'ModaCapital · SDQ',price:1650},
          ].map((p,i) => (
            <div key={i} style={{display:'flex',gap:12,padding:'14px 18px',borderTop:'1px solid #f0f0f0',alignItems:'center'}}>
              <div style={{width:48,height:48,borderRadius:6,background:'#f5f5f5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{p.e}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:13,marginBottom:2}}>{p.name}</div>
                <div style={{fontSize:11,color:'#999'}}>{p.meta} · {p.vendor}</div>
              </div>
              <div style={{fontWeight:800,fontSize:13}}>RD${p.price.toLocaleString()}</div>
            </div>
          ))}
          <div style={{padding:'12px 18px',borderTop:'1px solid #eee',display:'flex',flexDirection:'column',gap:6}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#666'}}><span>Subtotal</span><span>RD$5,750</span></div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#00873D',fontWeight:600}}><span>Descuentos</span><span>−RD$1,300</span></div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#666'}}><span>Envío Express</span><span>RD$350</span></div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'#666'}}><span>ITBIS (18%)</span><span>RD$861</span></div>
            <div style={{display:'flex',justifyContent:'space-between',fontWeight:900,fontSize:16,paddingTop:8,borderTop:'1px solid #eee',marginTop:4}}><span>Total pagado</span><span>RD$5,661</span></div>
          </div>
        </div>

        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:20}}>
          <a href="/" style={{flex:1,minWidth:140,background:'#111',color:'#fff',textDecoration:'none',textAlign:'center',padding:13,borderRadius:6,fontWeight:700,fontSize:13}}>
            Seguir comprando →
          </a>
          <button style={{flex:1,minWidth:140,background:'#fff',border:'1px solid #ddd',padding:13,borderRadius:6,fontWeight:700,fontSize:13,cursor:'pointer'}}>
            📱 Contactar vendedor
          </button>
          <button style={{flex:1,minWidth:140,background:'#fff',border:'1px solid #ddd',padding:13,borderRadius:6,fontWeight:700,fontSize:13,cursor:'pointer'}}>
            📄 Descargar factura
          </button>
        </div>

        <div style={{background:'#F0FDF4',border:'1px solid #86EFAC',borderRadius:8,padding:16,textAlign:'center'}}>
          <div style={{fontWeight:700,color:'#166534',marginBottom:4}}>🛡 Compra protegida por MercadoRD</div>
          <div style={{fontSize:12,color:'#166534'}}>Si el producto no llega o no es como se describe, te devolvemos tu dinero completo.</div>
        </div>

      </div>
    </div>
  );
}
