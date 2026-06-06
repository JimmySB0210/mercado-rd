'use client';
import { useState } from 'react';

export default function VendorRegisterPage() {
  const [step, setStep] = useState(0);
  const steps = ['Tu negocio', 'Ubicación', 'Plan', 'Verificación'];

  return (
    <div style={{minHeight:'100vh',fontFamily:'sans-serif',display:'grid',gridTemplateColumns:'280px 1fr'}}>
      <div style={{background:'#111',padding:'40px 24px'}}>
        <div style={{fontWeight:900,fontSize:22,color:'#fff',marginBottom:40}}>
          Mercado<span style={{color:'#E31837'}}>RD</span>
        </div>
        {steps.map((s,i) => (
          <div key={i} style={{paddingLeft:16,borderLeft:⁠ 2px solid ${i===step?'#fff':i<step?'#00873D':'#333'} ⁠,marginBottom:20}}>
            <div style={{fontSize:11,color:i===step?'#F5A200':i<step?'#00873D':'#555',fontWeight:700,marginBottom:2}}>
              {i<step?'✓ Listo':i===step?'En progreso':'Pendiente'}
            </div>
            <div style={{color:i===step?'#fff':'#555',fontWeight:700}}>
              {s}
            </div>
          </div>
        ))}
      </div>

      <div style={{padding:'48px',maxWidth:600}}>
        <div style={{height:3,background:'#eee',marginBottom:32,borderRadius:2}}>
          <div style={{height:'100%',background:'#111',width:⁠ ${((step+1)/4)*100}% ⁠,borderRadius:2,transition:'width 0.3s'}}></div>
        </div>

        <div style={{fontSize:12,color:'#999',fontWeight:700,textTransform:'uppercase',marginBottom:8}}>
          Paso {step+1} de 4
        </div>

        {step===0 && (
          <div>
            <h1 style={{fontSize:32,fontWeight:900,marginBottom:28}}>Cuéntanos sobre tu negocio</h1>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <div style={{fontSize:12,fontWeight:700,textTransform:'uppercase',marginBottom:6}}>Nombre del negocio *</div>
                <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'10px 12px',fontSize:14,outline:'none'}} placeholder="Ej: Colmado Don Rafael..."/>
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:700,textTransform:'uppercase',marginBottom:6}}>RNC / Cédula *</div>
                <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'10px 12px',fontSize:14,outline:'none'}} placeholder="000-0000000-0"/>
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:700,textTransform:'uppercase',marginBottom:6}}>Categoría *</div>
                <select style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'10px 12px',fontSize:14,outline:'none',background:'#fff'}}>
                  <option>Seleccionar...</option>
                  <option>Ropa y Moda</option>
                  <option>Electrónica</option>
                  <option>Alimentos</option>
                  <option>Belleza</option>
                  <option>Hogar</option>
                  <option>Ferretería</option>
                  <option>Autos y Repuestos</option>
                  <option>Agropecuario</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step===1 && (
          <div>
            <h1 style={{fontSize:32,fontWeight:900,marginBottom:28}}>Ubicación y contacto</h1>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <div style={{fontSize:12,fontWeight:700,textTransform:'uppercase',marginBottom:6}}>Provincia *</div>
                <select style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'10px 12px',fontSize:14,outline:'none',background:'#fff'}}>
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
                <div style={{fontSize:12,fontWeight:700,textTransform:'uppercase',marginBottom:6}}>WhatsApp *</div>
                <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'10px 12px',fontSize:14,outline:'none'}} placeholder="809-000-0000"/>
              </div>
              <div>
                <div style={{fontSize:12,fontWeight:700,textTransform:'uppercase',marginBottom:6}}>Correo electrónico *</div>
                <input style={{width:'100%',border:'1px solid #ddd',borderRadius:4,padding:'10px 12px',fontSize:14,outline:'none'}} placeholder="tu@negocio.com"/>
              </div>
            </div>
          </div>
        )}

        {step===2 && (
          <div>
            <h1 style={{fontSize:32,fontWeight:900,marginBottom:28}}>Elige tu plan</h1>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {[
                {id:'free',name:'Básico',price:'Gratis',desc:'20 productos · 8% comisión'},
                {id:'pro',name:'Pro',price:'RD$990/mes',desc:'Ilimitados · 4% comisión · Soporte 24/7'},
                {id:'ent',name:'Empresa',price:'RD$2,490/mes',desc:'Multi-tienda · 2% comisión · Gerente dedicado'},
              ].map(p => (
                <div key={p.id} style={{border:'2px solid #eee',borderRadius:6,padding:16,cursor:'pointer'}}>
                  <div style={{fontWeight:800,fontSize:16}}>{p.name}</div>
                  <div style={{color:'#E31837',fontWeight:700,fontSize:18,margin:'4px 0'}}>{p.price}</div>
                  <div style={{fontSize:13,color:'#888'}}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step===3 && (
          <div>
            <h1 style={{fontSize:32,fontWeight:900,marginBottom:28}}>Verificación</h1>
            <p style={{color:'#666',marginBottom:20}}>Sube tus documentos para verificar tu identidad.</p>
            <div style={{border:'1px dashed #ddd',borderRadius:6,padding:16,marginBottom:12,cursor:'pointer',display:'flex',gap:12,alignItems:'center'}}>
              <span style={{fontSize:24}}>🪪</span>
              <div>
                <div style={{fontWeight:600}}>Cédula o Pasaporte</div>
                <div style={{fontSize:12,color:'#999'}}>JPG, PNG o PDF · Máx 5MB</div>
              </div>
              <div style={{marginLeft:'auto',border:'1px solid #ddd',padding:'6px 14px',borderRadius:3,fontSize:12,fontWeight:700}}>Subir</div>
            </div>
            <label style={{display:'flex',gap:10,marginTop:16,fontSize:13,cursor:'pointer'}}>
              <input type="checkbox"/>
              <span>Acepto los Términos y Condiciones de MercadoRD</span>
            </label>
          </div>
        )}

        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:32,paddingTop:24,borderTop:'1px solid #eee'}}>
          {step>0 && (
            <button onClick={()=>setStep(s=>s-1)} style={{border:'1px solid #ddd',background:'#fff',padding:'0 20px',height:42,borderRadius:3,fontWeight:700,cursor:'pointer'}}>
              ← Atrás
            </button>
          )}
          <button
            onClick={()=>step<3?setStep(s=>s+1):alert('¡Tienda creada! Bienvenido a MercadoRD 🇩🇴')}
            style={{background:'#111',color:'#fff',border:'none',padding:'0 24px',height:42,borderRadius:3,fontWeight:700,cursor:'pointer'}}>
            {step<3?'Continuar →':'✓ Activar mi tienda'}
          </button>
        </div>
      </div>
    </div>
  );
}