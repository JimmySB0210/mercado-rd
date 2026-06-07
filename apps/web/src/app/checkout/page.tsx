export default function CheckoutPage() {
  return (
    <div style={{minHeight:'100vh',fontFamily:'sans-serif',background:'#f5f5f5'}}>
      <div style={{background:'#111',padding:'16px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <a href="/" style={{fontWeight:900,fontSize:20,color:'#fff',textDecoration:'none'}}>
          Mercado<span style={{color:'#E31837'}}>RD</span>
        </a>
        <span style={{color:'#fff',fontSize:13}}>🔒 Pago seguro</span>
      </div>

      <div style={{maxWidth:900,margin:'0 auto',padding:28,display:'grid',gridTemplateColumns:'1fr 320px',gap:24}}>

        <div>
          <div style={{display:'flex',gap:8,marginBottom:28}}>
            {['Carrito','Envío','Pago','Confirmación'].map((s,i) => (
              <div key={i} style={{flex:1,textAlign:'center'}}>
                <div style={{height:3,background:i<=1?'#111':'#ddd',borderRadius:2,marginBottom:6}}></div>
                <div style={{fontSize:11,fontWeight:700,color:i<=1?'#111':'#aaa',textTransform:'uppercase',letterSpacing:0.5}}>{s}</div>
              </div>
            ))}
          </div>

          <div style={{background:'#fff',borderRadius:8,padding:22,marginBottom:16,boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
            <div style={{fontWeight:800,fontSize:15,marginBottom:16,textTransform:'uppercase',letterSpacing:0.5}}>1. Dirección de entrega</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',marginBottom:5}}>Nombre *</div>
                <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'9px 11px',fontSize:13,outline:'none'}} placeholder="Tu nombre"/>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',marginBottom:5}}>Apellido *</div>
                <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'9px 11px',fontSize:13,outline:'none'}} placeholder="Tu apellido"/>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',marginBottom:5}}>Dirección *</div>
                <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'9px 11px',fontSize:13,outline:'none'}} placeholder="Calle, número, sector..."/>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',marginBottom:5}}>Provincia *</div>
                <select style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'9px 11px',fontSize:13,outline:'none',background:'#fff'}}>
                  <option>Seleccionar...</option>
                  <option>Distrito Nacional</option>
                  <option>Santo Domingo</option>
                  <option>Santiago</option>
                  <option>La Vega</option>
                  <option>Puerto Plata</option>
                  <option>San Pedro de Macorís</option>
                  <option>La Romana</option>
                  <option>Barahona</option>
                </select>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',marginBottom:5}}>Teléfono *</div>
                <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'9px 11px',fontSize:13,outline:'none'}} placeholder="809-000-0000"/>
              </div>
            </div>
          </div>

          <div style={{background:'#fff',borderRadius:8,padding:22,marginBottom:16,boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
            <div style={{fontWeight:800,fontSize:15,marginBottom:16,textTransform:'uppercase',letterSpacing:0.5}}>2. Método de envío</div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {[
                {icon:'🚚',name:'Envío estándar',detail:'2-4 días hábiles',price:'RD$180'},
                {icon:'⚡',name:'Express SDQ',detail:'Mismo día · Solo Santo Domingo',price:'RD$350'},
                {icon:'🏪',name:'Recoger en tienda',detail:'Disponible hoy · Gratis',price:'Gratis'},
              ].map((opt,i) => (
                <label key={i} style={{display:'flex',alignItems:'center',gap:12,padding:14,border:⁠ 2px solid ${i===1?'#111':'#eee'} ⁠,borderRadius:8,cursor:'pointer',background:i===1?'#fafafa':'#fff'}}>
                  <input type="radio" name="shipping" defaultChecked={i===1} style={{accentColor:'#111'}}/>
                  <span style={{fontSize:18}}>{opt.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:13}}>{opt.name}</div>
                    <div style={{fontSize:11,color:'#999'}}>{opt.detail}</div>
                  </div>
                  <div style={{fontWeight:800,fontSize:13,color:'#0038A8'}}>{opt.price}</div>
                </label>
              ))}
            </div>
          </div>

          <div style={{background:'#fff',borderRadius:8,padding:22,boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
            <div style={{fontWeight:800,fontSize:15,marginBottom:16,textTransform:'uppercase',letterSpacing:0.5}}>3. Método de pago</div>
            <div style={{display:'flex',gap:8,marginBottom:16}}>
              {['💳 Tarjeta','🏦 Transferencia','💵 Efectivo'].map((m,i) => (
                <button key={i} style={{flex:1,padding:'9px 4px',border:⁠ 2px solid ${i===0?'#111':'#eee'} ⁠,borderRadius:6,background:i===0?'#111':'#fff',color:i===0?'#fff':'#666',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                  {m}
                </button>
              ))}
            </div>
            <div style={{background:'linear-gradient(135deg,#1a1a2e,#16213e)',borderRadius:10,padding:18,color:'#fff',marginBottom:16}}>
              <div style={{fontSize:20,marginBottom:10}}>▪ ▪ ▪</div>
              <div style={{fontFamily:'monospace',fontSize:14,letterSpacing:3,marginBottom:10}}>•••• •••• •••• ••••</div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,opacity:0.7}}>
                <span>Titular</span><span>Vence</span>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div style={{gridColumn:'1/-1'}}>
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',marginBottom:5}}>Número de tarjeta *</div>
                <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'9px 11px',fontSize:13,outline:'none',fontFamily:'monospace'}} placeholder="4111 1111 1111 1111"/>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',marginBottom:5}}>Vencimiento *</div>
                <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'9px 11px',fontSize:13,outline:'none'}} placeholder="MM/AA"/>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',marginBottom:5}}>CVV *</div>
                <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'9px 11px',fontSize:13,outline:'none'}} placeholder="123" type="password"/>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',marginBottom:5}}>Nombre en la tarjeta *</div>
                <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'9px 11px',fontSize:13,outline:'none'}} placeholder="Como aparece en la tarjeta"/>
              </div>
            </div>
          </div>
        </div>

        <div style={{position:'sticky',top:20,height:'fit-content'}}>
          <div style={{background:'#fff',borderRadius:8,padding:20,boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
            <div style={{fontWeight:900,fontSize:15,marginBottom:14}}>Tu pedido</div>
            {[
              {e:'👟',name:'Tenis Nike Air',price:3200},
              {e:'🌿',name:'Especias Pack x3',price:900},
              {e:'👗',name:'Vestido floral',price:1650},
            ].map((p,i) => (
              <div key={i} style={{display:'flex',gap:10,alignItems:'center',marginBottom:10}}>
                <div style={{width:40,height:40,borderRadius:6,background:'#f5f5f5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{p.e}</div>
                <div style={{flex:1,fontSize:12,fontWeight:600}}>{p.name}</div>
                <div style={{fontSize:12,fontWeight:800}}>RD${p.price.toLocaleString()}</div>
              </div>
            ))}
            <div style={{borderTop:'1px solid #eee',marginTop:12,paddingTop:12}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:6}}><span>Subtotal</span><span>RD$5,750</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:6}}><span>Envío Express</span><span>RD$350</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:6}}><span>ITBIS (18%)</span><span>RD$861</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontWeight:900,fontSize:16,marginTop:8,paddingTop:8,borderTop:'1px solid #eee'}}><span>Total</span><span>RD$6,961</span></div>
            </div>
            <a href="/confirm" style={{display:'block',background:'#E31837',color:'#fff',textDecoration:'none',textAlign:'center',padding:14,borderRadius:6,fontWeight:900,fontSize:14,marginTop:16}}>
              🔒 Confirmar y pagar
            </a>
            <div style={{textAlign:'center',fontSize:11,color:'#999',marginTop:8}}>
              Procesado por Azul · SSL 256-bit
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
