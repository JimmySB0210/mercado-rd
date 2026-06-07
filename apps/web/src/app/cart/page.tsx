export default function CartPage() {
  return (
    <div style={{minHeight:'100vh',fontFamily:'sans-serif',background:'#f5f5f5'}}>
      <div style={{background:'#111',padding:'16px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <a href="/" style={{fontWeight:900,fontSize:20,color:'#fff',textDecoration:'none'}}>
          Mercado<span style={{color:'#E31837'}}>RD</span>
        </a>
        <span style={{color:'#fff',fontSize:14}}>🛒 Mi Carrito</span>
      </div>

      <div style={{maxWidth:1000,margin:'0 auto',padding:28,display:'grid',gridTemplateColumns:'1fr 340px',gap:24}}>
        
        <div>
          <h1 style={{fontSize:24,fontWeight:900,marginBottom:20}}>Tu carrito (3 productos)</h1>
          
          {[
            {name:'Tenis Nike Air Premium',variant:'Azul · Talla 40',vendor:'SportStore · Santiago',price:3200,emoji:'👟',bg:'#FFF3E0'},
            {name:'Especias dominicanas Pack x3',variant:'Orégano, Ají, Sazón',vendor:'AgroVerde · La Vega',price:900,emoji:'🌿',bg:'#E8F5E9'},
            {name:'Vestido floral verano 2026',variant:'Rosa · Talla M',vendor:'ModaCapital · SDQ',price:1650,emoji:'👗',bg:'#FCE4EC'},
          ].map((item,i) => (
            <div key={i} style={{background:'#fff',borderRadius:8,padding:16,marginBottom:12,display:'flex',gap:14,alignItems:'center',boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
              <div style={{width:72,height:72,borderRadius:8,background:item.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,flexShrink:0}}>
                {item.emoji}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:2}}>{item.name}</div>
                <div style={{fontSize:12,color:'#999',marginBottom:2}}>{item.variant}</div>
                <div style={{fontSize:12,color:'#0038A8',fontWeight:600}}>{item.vendor}</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8}}>
                <div style={{fontWeight:900,fontSize:16,color:'#E31837'}}>RD${item.price.toLocaleString()}</div>
                <div style={{display:'flex',border:'1px solid #ddd',borderRadius:4,overflow:'hidden'}}>
                  <button style={{width:28,height:28,border:'none',background:'#f5f5f5',cursor:'pointer',fontSize:14}}>−</button>
                  <span style={{width:32,height:28,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700}}>1</span>
                  <button style={{width:28,height:28,border:'none',background:'#f5f5f5',cursor:'pointer',fontSize:14}}>+</button>
                </div>
                <button style={{background:'none',border:'none',color:'#999',cursor:'pointer',fontSize:12}}>🗑 Eliminar</button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div style={{background:'#fff',borderRadius:8,padding:20,boxShadow:'0 1px 8px rgba(0,0,0,0.06)',position:'sticky',top:20}}>
            <div style={{fontWeight:900,fontSize:16,marginBottom:16}}>Resumen del pedido</div>
            
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:8}}>
              <span>Subtotal</span><span>RD$5,750</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:8}}>
              <span>Descuentos</span><span style={{color:'#00873D',fontWeight:600}}>−RD$1,300</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:8}}>
              <span>Envío</span><span>RD$180</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:16}}>
              <span>ITBIS (18%)</span><span>RD$813</span>
            </div>
            
            <div style={{borderTop:'1px solid #eee',paddingTop:14,display:'flex',justifyContent:'space-between',fontWeight:900,fontSize:17,marginBottom:16}}>
              <span>Total</span><span>RD$5,443</span>
            </div>

            <div style={{display:'flex',gap:8,marginBottom:14}}>
              <input placeholder="Código de descuento" style={{flex:1,border:'1px solid #ddd',borderRadius:4,padding:'8px 10px',fontSize:13,outline:'none'}}/>
              <button style={{background:'#111',color:'#fff',border:'none',padding:'8px 14px',borderRadius:4,fontWeight:700,fontSize:12,cursor:'pointer'}}>Aplicar</button>
            </div>

            <a href="/checkout" style={{display:'block',background:'#E31837',color:'#fff',textDecoration:'none',textAlign:'center',padding:14,borderRadius:6,fontWeight:900,fontSize:15,marginBottom:10}}>
              Proceder al pago →
            </a>
            <a href="/" style={{display:'block',textAlign:'center',fontSize:13,color:'#666',textDecoration:'none'}}>
              ← Seguir comprando
            </a>

            <div style={{marginTop:14,padding:12,background:'#F0FDF4',borderRadius:6,border:'1px solid #86EFAC'}}>
              <div style={{fontSize:12,color:'#166534',fontWeight:600,marginBottom:2}}>🛡 Compra protegida</div>
              <div style={{fontSize:11,color:'#166534'}}>Si el producto no llega te devolvemos tu dinero</div>
            </div>

            <div style={{marginTop:12,display:'flex',justifyContent:'center',gap:12,fontSize:11,color:'#999'}}>
              <span>💳 Azul</span>
              <span>🏦 CardNet</span>
              <span>🏧 Transferencia</span>
              <span>💵 Efectivo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
