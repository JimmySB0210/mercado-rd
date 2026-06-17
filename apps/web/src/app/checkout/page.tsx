export default function CheckoutPage() {
  return (
    <div style={{padding:40,fontFamily:'sans-serif'}}>
      <a href="/" style={{fontWeight:900,fontSize:20,color:'#111',textDecoration:'none'}}>
        Mercado<span style={{color:'#E31837'}}>RD</span>
      </a>
      <h1 style={{fontSize:28,fontWeight:900,margin:'24px 0 8px'}}>Checkout</h1>
      <p style={{color:'#666',marginBottom:32}}>Completa tu compra</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:24}}>
        <div>
          <div style={{background:'#fff',borderRadius:8,padding:20,marginBottom:16,border:'1px solid #eee'}}>
            <h2 style={{fontSize:16,fontWeight:800,marginBottom:16}}>Dirección de entrega</h2>
            <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:10,marginBottom:10,fontSize:14,boxSizing:'border-box' as const}} placeholder="Nombre completo"/>
            <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:10,marginBottom:10,fontSize:14,boxSizing:'border-box' as const}} placeholder="Dirección"/>
            <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:10,fontSize:14,boxSizing:'border-box' as const}} placeholder="Teléfono"/>
          </div>
          <div style={{background:'#fff',borderRadius:8,padding:20,border:'1px solid #eee'}}>
            <h2 style={{fontSize:16,fontWeight:800,marginBottom:16}}>Pago</h2>
            <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:10,marginBottom:10,fontSize:14,fontFamily:'monospace',boxSizing:'border-box' as const}} placeholder="Número de tarjeta"/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <input style={{border:'1px solid #ddd',borderRadius:4,padding:10,fontSize:14}} placeholder="MM/AA"/>
              <input style={{border:'1px solid #ddd',borderRadius:4,padding:10,fontSize:14}} placeholder="CVV" type="password"/>
            </div>
          </div>
        </div>
        <div style={{background:'#fff',borderRadius:8,padding:20,border:'1px solid #eee',height:'fit-content'}}>
          <h2 style={{fontSize:16,fontWeight:800,marginBottom:16}}>Tu pedido</h2>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:14}}><span>Subtotal</span><span>RD$5,750</span></div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:14,color:'#00873D',fontWeight:600}}><span>Descuentos</span><span>−RD$1,300</span></div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:14}}><span>Envío Express</span><span>RD$350</span></div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:14}}><span>ITBIS (18%)</span><span>RD$861</span></div>
          <div style={{display:'flex',justifyContent:'space-between',fontWeight:900,fontSize:16,borderTop:'1px solid #eee',paddingTop:12,marginTop:8}}><span>Total</span><span>RD$5,661</span></div>
          <a href="/confirm" style={{display:'block',background:'#E31837',color:'#fff',textDecoration:'none',textAlign:'center',padding:14,borderRadius:6,fontWeight:900,marginTop:16}}>
            Confirmar y pagar
          </a>
        </div>
      </div>
    </div>
  );
}