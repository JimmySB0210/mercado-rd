'use client';
import { useState } from 'react';

const STEPS = ['Tu negocio','Ubicación','Plan','Verificación'];

const PROVINCIAS = ['Distrito Nacional','Santo Domingo','Santiago','La Vega','San Pedro de Macorís','Puerto Plata','La Romana','Barahona','Higüey','Moca','San Francisco de Macorís','Azua'];

export default function VendorRegisterPage() {
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState('pro');

  return (
    <div style={{display:'grid',gridTemplateColumns:'300px 1fr',minHeight:'100vh',fontFamily:'sans-serif'}}>
      
      {/* Sidebar */}
      <div style={{background:'#111',padding:'40px 24px',display:'flex',flexDirection:'column'}}>
        <div style={{fontWeight:900,fontSize:22,color:'#fff',marginBottom:48}}>
          Mercado<span style={{color:'#E31837'}}>RD</span>
        </div>
        {STEPS.map((s,i) => (
          <div key={i} style={{display:'flex',gap:14,paddingLeft:20,borderLeft:⁠ 2px solid ${i===step?'#555':i<step?'#00873D':'#222'} ⁠,paddingBottom:24,paddingTop:4}}>
            <div style={{display:'flex',flexDirection:'column'}}>
              <span style={{fontSize:11,color:i===step?'#F5A200':i<step?'#00873D':'#444',fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>
                {i<step?'✓ Listo':i===step?'En progreso':'Pendiente'}
              </span>
              <span style={{color:i===step?'#fff':i<step?'#888':'#444',fontWeight:700,fontSize:15}}>
                {s}
              </span>
            </div>
          </div>
        ))}
        <div style={{marginTop:'auto',fontSize:12,color:'#444',lineHeight:1.6}}>
          ¿Necesitas ayuda?<br/>
          <span style={{color:'#666',textDecoration:'underline',cursor:'pointer'}}>vendedores@mercadord.com.do</span>
        </div>
      </div>

      {/* Main */}
      <div style={{padding:'48px',maxWidth:640}}>
        
        {/* Progress bar */}
        <div style={{height:3,background:'#eee',borderRadius:2,marginBottom:40}}>
          <div style={{height:'100%',background:'#111',borderRadius:2,width:⁠ ${((step+1)/4)*100}% ⁠,transition:'width 0.4s'}}></div>
        </div>

        <div style={{fontSize:12,color:'#999',fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>
          Paso {step+1} de 4
        </div>

        {/* STEP 0 */}
        {step===0 && (
          <div>
            <h1 style={{fontSize:32,fontWeight:900,letterSpacing:-1,marginBottom:32}}>Cuéntanos sobre<br/>tu negocio</h1>
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div><label style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:6}}>Nombre del negocio *</label>
              <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none'}} placeholder="Ej: Colmado Don Rafael, Boutique Marisol..."/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div><label style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:6}}>RNC / Cédula *</label>
                <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none'}} placeholder="000-0000000-0"/></div>
                <div><label style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:6}}>Tipo de negocio *</label>
                <select style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none',background:'#fff'}}>
                  <option>Seleccionar...</option>
                  <option>Persona física</option>
                  <option>Empresa / SRL</option>
                  <option>SA / Corporación</option>
                </select></div>
              </div>
              <div><label style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:6}}>Categoría principal *</label>
              <select style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none',background:'#fff'}}>
                <option>Seleccionar...</option>
                <option>👗 Ropa & Moda</option><option>📱 Electrónica</option>
                <option>🥑 Alimentos & Bebidas</option><option>💄 Belleza</option>
                <option>🛋️ Hogar</option><option>🔧 Ferretería</option>
                <option>🚗 Autos & Repuestos</option><option>🌿 Agropecuario</option>
              </select></div>
              <div><label style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:6}}>Descripción de tu negocio</label>
              <textarea style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none',minHeight:80,resize:'vertical'}} placeholder="¿Qué vendes y qué te hace diferente?"/></div>
            </div>
          </div>
        )}

        {/* STEP 1 */}
        {step===1 && (
          <div>
            <h1 style={{fontSize:32,fontWeight:900,letterSpacing:-1,marginBottom:32}}>¿Dónde estás<br/>ubicado?</h1>
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div><label style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:6}}>Provincia *</label>
                <select style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none',background:'#fff'}}>
                  <option>Seleccionar...</option>
                  {PROVINCIAS.map(p=><option key={p}>{p}</option>)}
                </select></div>
                <div><label style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:6}}>Municipio *</label>
                <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none'}} placeholder="Ej: Santiago de los Caballeros"/></div>
              </div>
              <div><label style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:6}}>Nombre del responsable *</label>
              <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none'}} placeholder="Tu nombre completo"/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div><label style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:6}}>WhatsApp *</label>
                <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none'}} placeholder="809-000-0000"/></div>
                <div><label style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:6}}>Correo electrónico *</label>
                <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none'}} placeholder="tu@negocio.com"/></div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step===2 && (
          <div>
            <h1 style={{fontSize:32,fontWeight:900,letterSpacing:-1,marginBottom:32}}>Elige tu plan</h1>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:28}}>
              {[
                {id:'free',name:'Básico',price:'Gratis',features:['20 productos','8% comisión','Soporte email']},
                {id:'pro',name:'Pro',price:'RD$990/mes',features:['Ilimitados','4% comisión','Soporte 24/7','Analytics']},
                {id:'ent',name:'Empresa',price:'RD$2,490/mes',features:['Multi-tienda','2% comisión','Gerente dedicado','API']},
              ].map(p=>(
                <div key={p.id} onClick={()=>setPlan(p.id)}
                  style={{border:⁠ 2px solid ${plan===p.id?'#111':'#eee'} ⁠,borderRadius:6,padding:16,cursor:'pointer',background:plan===p.id?'#111':'#fff',color:plan===p.id?'#fff':'#111',transition:'all .15s'}}>
                  <div style={{fontWeight:800,fontSize:16,marginBottom:4}}>{p.name}</div>
                  <div style={{fontWeight:700,fontSize:20,marginBottom:12,color:plan===p.id?'#F5A200':'#E31837'}}>{p.price}</div>
                  {p.features.map(f=><div key={f} style={{fontSize:12,marginBottom:4,color:plan===p.id?'#aaa':'#666'}}>— {f}</div>)}
                </div>
              ))}
            </div>
            <div><label style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:6}}>Banco *</label>
            <select style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none',background:'#fff',marginBottom:14}}>
              <option>Seleccionar banco...</option>
              <option>Banco Popular Dominicano</option><option>Banco BHD León</option>
              <option>Banco Reservas</option><option>Scotiabank RD</option>
            </select></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div><label style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:6}}>Número de cuenta *</label>
              <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none'}} placeholder="00000000000000000000"/></div>
              <div><label style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:.5,display:'block',marginBottom:6}}>Titular *</label>
              <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'11px 13px',fontSize:14,outline:'none'}} placeholder="Nombre en el banco"/></div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step===3 && (
          <div>
            <h1 style={{fontSize:32,fontWeight:900,letterSpacing:-1,marginBottom:32}}>Verificación<br/>de identidad</h1>
            <p style={{color:'#666',fontSize:14,lineHeight:1.6,marginBottom:24}}>Para proteger a los compradores necesitamos verificar tu identidad. Tus documentos son confidenciales.</p>
            {[
              {icon:'🪪',title:'Cédula / Pasaporte',sub:'Frente y reverso · JPG, PNG o PDF · Máx 5MB'},
              {icon:'🏢',title:'Registro mercantil / RNC',sub:'Para negocios formales · Opcional'},
            ].map((d,i)=>(
              <div key={i} style={{border:'1px dashed #ddd',borderRadius:6,padding:'16px 20px',display:'flex',gap:14,alignItems:'center',marginBottom:12,cursor:'pointer'}}>
                <div style={{fontSize:24}}>{d.icon}</div>
                <div><div style={{fontWeight:600,fontSize:14,marginBottom:2}}>{d.title}</div><div style={{fontSize:12,color:'#999'}}>{d.sub}</div></div>
                <div style={{marginLeft:'auto',border:'1px solid #ddd',borderRadius:3,padding:'6px 14px',fontSize:12,fontWeight:700}}>Subir</div>
              </div>
            ))}
            <label style={{display:'flex',gap:10,alignItems:'flex-start',cursor:'pointer',fontSize:13,marginTop:20}}>
              <input type="checkbox" style={{marginTop:2}}/>
              <span>Acepto los <span style={{textDecoration:'underline'}}>Términos y Condiciones</span> y la <span style={{textDecoration:'underline'}}>Política de Privacidad</span> de MercadoRD</span>
            </label>
          </div>
        )}

        {/* Navigation */}
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:32,paddingTop:24,borderTop:'1px solid #eee'}}>
          {step>0 && (
            <button onClick={()=>setStep(s=>s-1)}
              style={{border:'1px solid #ddd',background:'#fff',padding:'0 24px',height:44,borderRadius:3,fontWeight:700,fontSize:13,cursor:'pointer',textTransform:'uppercase',letterSpacing:.5}}>
              ← Atrás
            </button>
          )}
          <button onClick={()=>step<3?setStep(s=>s+1):alert('🎉 ¡Tienda creada! Bienvenido a MercadoRD')}
            style={{background:'#111',color:'#fff',border:'none',padding:'0 28px',height:44,borderRadius:3,fontWeight:700,fontSize:13,cursor:'pointer',textTransform:'uppercase',letterSpacing:.5}}>
            {step<3?'Continuar →':'✓ Activar mi tienda'}
          </button>
        </div>

      </div>
    </div>
  );
}
