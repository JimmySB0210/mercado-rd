export default function DashboardPage() {
  return (
    <div style={{minHeight:'100vh',fontFamily:'sans-serif',display:'grid',gridTemplateColumns:'220px 1fr'}}>
      <div style={{background:'#111',padding:'24px 0',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'0 20px 24px',borderBottom:'1px solid #222',marginBottom:16}}>
          <div style={{fontWeight:900,fontSize:18,color:'#fff',marginBottom:4}}>
            Mercado<span style={{color:'#E31837'}}>RD</span>
          </div>
          <div style={{fontSize:12,color:'#555'}}>Panel del vendedor</div>
        </div>
        {[
          {icon:'📊',label:'Resumen',active:true},
          {icon:'📦',label:'Mis Productos'},
          {icon:'🛒',label:'Pedidos'},
          {icon:'💰',label:'Ingresos'},
          {icon:'⭐',label:'Reseñas'},
          {icon:'📣',label:'Marketing'},
          {icon:'🚚',label:'Envíos'},
          {icon:'⚙️',label:'Configuración'},
        ].map((item,i) => (
          <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 20px',cursor:'pointer',background:item.active?'rgba(255,255,255,0.08)':'transparent',borderLeft:item.active?'2px solid #fff':'2px solid transparent',color:item.active?'#fff':'#666',fontSize:14,fontWeight:item.active?600:400}}>
            <span>{item.icon}</span>{item.label}
          </div>
        ))}
      </div>

      <div style={{padding:28,background:'#f5f5f5'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
          <div>
            <h1 style={{fontSize:24,fontWeight:900,marginBottom:4}}>¡Buen día, Jimmy! 👋</h1>
            <p style={{color:'#666',fontSize:14}}>Aquí está el resumen de tu negocio</p>
          </div>
          <button style={{background:'#111',color:'#fff',border:'none',padding:'10px 20px',borderRadius:4,fontWeight:700,cursor:'pointer'}}>
            + Nuevo producto
          </button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
          {[
            {label:'Ingresos — Jun',val:'RD$148,320',delta:'▲ 18.4%',color:'#00873D'},
            {label:'Pedidos — Jun',val:'284',delta:'▲ 32 esta semana',color:'#0038A8'},
            {label:'Ticket promedio',val:'RD$521',delta:'▲ RD$32',color:'#F5A200'},
            {label:'Calificación',val:'4.9 ⭐',delta:'Top 5%',color:'#E31837'},
          ].map((s,i) => (
            <div key={i} style={{background:'#fff',borderRadius:8,padding:18,boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
              <div style={{fontSize:11,color:'#999',textTransform:'uppercase',letterSpacing:0.5,marginBottom:8}}>{s.label}</div>
              <div style={{fontWeight:900,fontSize:22,marginBottom:6}}>{s.val}</div>
              <div style={{fontSize:12,fontWeight:600,color:s.color}}>{s.delta}</div>
            </div>
          ))}
        </div>

        <div style={{background:'#fff',borderRadius:8,overflow:'hidden',boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
          <div style={{padding:'14px 18px',borderBottom:'1px solid #f0f0f0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontWeight:800,fontSize:15}}>Pedidos recientes</div>
            <a href="#" style={{fontSize:13,color:'#0038A8',textDecoration:'none'}}>Ver todos →</a>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'#f8f8f8'}}>
                {['Pedido','Cliente','Producto','Provincia','Monto','Estado'].map(h => (
                  <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:11,color:'#999',textTransform:'uppercase',letterSpacing:0.5,fontWeight:600,borderBottom:'1px solid #f0f0f0'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                {id:'#RD-8824',cliente:'María R.',prod:'Nike Air x1',prov:'Sto. Domingo',monto:'RD$3,200',status:'🚚 En camino',sc:'#DBEAFE',tc:'#1e3a8a'},
                {id:'#RD-8823',cliente:'Carlos M.',prod:'Adidas UB x2',prov:'Santiago',monto:'RD$11,600',status:'✓ Entregado',sc:'#DCFCE7',tc:'#166534'},
                {id:'#RD-8822',cliente:'Ana P.',prod:'Pack tenis x3',prov:'La Vega',monto:'RD$9,600',status:'✓ Entregado',sc:'#DCFCE7',tc:'#166534'},
                {id:'#RD-8821',cliente:'Juan F.',prod:'Botas trabajo',prov:'Puerto Plata',monto:'RD$4,100',status:'⏳ Pendiente',sc:'#FEF9C3',tc:'#713f12'},
                {id:'#RD-8820',cliente:'Rosa G.',prod:'Tenis mujer',prov:'Barahona',monto:'RD$2,400',status:'✗ Cancelado',sc:'#FEE2E2',tc:'#991B1B'},
              ].map((o,i) => (
                <tr key={i} style={{borderBottom:'1px solid #f8f8f8'}}>
                  <td style={{padding:'12px 14px',color:'#0038A8',fontWeight:700,fontSize:13}}>{o.id}</td>
                  <td style={{padding:'12px 14px',fontSize:13}}>{o.cliente}</td>
                  <td style={{padding:'12px 14px',fontSize:13}}>{o.prod}</td>
                  <td style={{padding:'12px 14px',fontSize:13}}>{o.prov}</td>
                  <td style={{padding:'12px 14px',fontSize:13,fontWeight:700}}>{o.monto}</td>
                  <td style={{padding:'12px 14px'}}>
                    <span style={{background:o.sc,color:o.tc,padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700}}>{o.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
