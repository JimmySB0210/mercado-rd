'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { BRAND } from '@/lib/colors';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div style={{minHeight:'100vh',background:BRAND.bg,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div className="auth-card" style={{background:'#fff',borderRadius:12,maxWidth:420,width:'100%',boxShadow:'0 2px 20px rgba(0,0,0,0.08)'}}>
        <div style={{fontWeight:700,fontSize:24,marginBottom:24}}>
          <span style={{color:BRAND.blue}}>Mercado</span><span style={{color:BRAND.red}}>RD</span>
        </div>
        <h1 style={{fontSize:26,fontWeight:700,marginBottom:6,color:BRAND.dark}}>Iniciar sesión</h1>
        <p style={{color:BRAND.gray,marginBottom:28,fontSize:14}}>Bienvenido de vuelta</p>

        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <div style={{fontSize:13,fontWeight:500,color:BRAND.dark,marginBottom:6}}>Correo electrónico</div>
            <input style={{width:'100%',border:'1px solid #E0E0E0',borderRadius:8,padding:'11px 13px',fontSize:14,outline:'none',boxSizing:'border-box'}} placeholder="tu@correo.com" type="email"/>
          </div>

          <div>
            <div style={{fontSize:13,fontWeight:500,color:BRAND.dark,marginBottom:6}}>Contraseña</div>
            <div style={{position:'relative'}}>
              <input
                style={{width:'100%',border:'1px solid #E0E0E0',borderRadius:8,padding:'11px 42px 11px 13px',fontSize:14,outline:'none',boxSizing:'border-box'}}
                placeholder="Tu contraseña"
                type={showPassword ? 'text' : 'password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{position:'absolute',right:12,top:0,bottom:0,border:'none',background:'none',cursor:'pointer',color:BRAND.gray,display:'flex',alignItems:'center'}}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <a href="#" style={{fontSize:13,color:BRAND.blue,textDecoration:'none'}}>¿Olvidaste tu contraseña?</a>
          </div>

          <button style={{background:BRAND.blue,color:'#fff',border:'none',padding:14,borderRadius:8,fontWeight:600,fontSize:15,cursor:'pointer'}}>
            Entrar
          </button>

          <div style={{textAlign:'center',fontSize:13,color:BRAND.gray}}>
            ¿No tienes cuenta? <a href="/register" style={{color:BRAND.blue,fontWeight:600,textDecoration:'none'}}>Regístrate</a>
          </div>

          <div style={{display:'flex',alignItems:'center',gap:10,margin:'4px 0'}}>
            <div style={{flex:1,height:1,background:'#eee'}}></div>
            <span style={{fontSize:12,color:BRAND.gray}}>o continúa con</span>
            <div style={{flex:1,height:1,background:'#eee'}}></div>
          </div>

          <button style={{background:'#fff',border:'1px solid #E0E0E0',padding:12,borderRadius:8,fontWeight:600,fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,color:BRAND.dark}}>
            <span>🌐</span> Continuar con Google
          </button>
        </div>

        <p style={{textAlign:'center',marginTop:20,fontSize:12,color:'#bbb',lineHeight:1.6}}>
          Al entrar aceptas nuestros <a href="#" style={{color:BRAND.gray}}>Términos de Servicio</a> y <a href="#" style={{color:BRAND.gray}}>Política de Privacidad</a>
        </p>
      </div>
    </div>
  );
}
