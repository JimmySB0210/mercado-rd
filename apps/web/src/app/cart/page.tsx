import { ShoppingCart, Trash2, Minus, Plus, ShieldCheck } from 'lucide-react';
import { BRAND } from '@/lib/colors';

const ITEMS = [
  { name:'Samsung Galaxy S23', variant:'128GB · Negro', vendor:'TechStore RD', price:32500, e:'📱', bg:'#E3EAFB' },
  { name:"Nike Air Force 1 '07", variant:'Blanco · Talla 40', vendor:'SportStore', price:5200, e:'👟', bg:'#FFF3E0' },
  { name:'Audífonos Inalámbricos', variant:'Negro', vendor:'TechStore RD', price:1850, e:'🎧', bg:'#F1F1F1' },
];

export default function CartPage() {
  return (
    <div style={{minHeight:'100vh',background:BRAND.bg}}>
      <div style={{background:'#fff',borderBottom:'1px solid #EAEAEA',padding:'16px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <a href="/" style={{fontWeight:700,fontSize:20,textDecoration:'none'}}>
          <span style={{color:BRAND.blue}}>Mercado</span><span style={{color:BRAND.red}}>RD</span>
        </a>
        <span style={{color:BRAND.dark,fontSize:14,display:'flex',alignItems:'center',gap:6}}>
          <ShoppingCart size={18} /> Mi Carrito
        </span>
      </div>

      <div className="cart-layout" style={{maxWidth:1000,margin:'0 auto',padding:28}}>

        <div>
          <h1 style={{fontSize:22,fontWeight:700,marginBottom:20,color:BRAND.dark}}>Tu carrito (3)</h1>

          {ITEMS.map((item,i) => (
            <div key={i} style={{background:'#fff',borderRadius:10,padding:16,marginBottom:12,display:'flex',gap:14,alignItems:'center',border:'1px solid #EEE'}}>
              <div style={{width:64,height:64,borderRadius:8,background:item.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,flexShrink:0}}>
                {item.e}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:14,marginBottom:2,color:BRAND.dark}}>{item.name}</div>
                <div style={{fontSize:12,color:BRAND.gray,marginBottom:2}}>{item.variant}</div>
                <div style={{fontSize:12,color:BRAND.blue,fontWeight:600}}>{item.vendor}</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8}}>
                <div style={{fontWeight:700,fontSize:15,color:BRAND.dark}}>RD${item.price.toLocaleString()}</div>
                <div style={{display:'flex',border:'1px solid #E0E0E0',borderRadius:6,overflow:'hidden'}}>
                  <button style={{width:26,height:26,border:'none',background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:BRAND.dark}}><Minus size={13}/></button>
                  <span style={{width:30,height:26,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:600}}>1</span>
                  <button style={{width:26,height:26,border:'none',background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:BRAND.dark}}><Plus size={13}/></button>
                </div>
                <button style={{background:'none',border:'none',color:BRAND.gray,cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:12}}>
                  <Trash2 size={13}/> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div style={{background:'#fff',borderRadius:10,padding:20,border:'1px solid #EEE',position:'sticky',top:20}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:16,color:BRAND.dark}}>Resumen del pedido</div>

            <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:8,color:BRAND.dark}}>
              <span>Subtotal</span><span>RD$39,550</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:8,color:BRAND.dark}}>
              <span>Envío</span><span>RD$180</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:16,color:BRAND.dark}}>
              <span>ITBIS (18%)</span><span>RD$7,148</span>
            </div>

            <div style={{borderTop:'1px solid #eee',paddingTop:14,display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:17,marginBottom:16,color:BRAND.dark}}>
              <span>Total</span><span>RD$46,878</span>
            </div>

            <div style={{display:'flex',gap:8,marginBottom:14}}>
              <input placeholder="Código de descuento" style={{flex:1,border:'1px solid #E0E0E0',borderRadius:6,padding:'8px 10px',fontSize:13,outline:'none'}}/>
              <button style={{background:BRAND.dark,color:'#fff',border:'none',padding:'8px 14px',borderRadius:6,fontWeight:600,fontSize:12,cursor:'pointer'}}>Aplicar</button>
            </div>

            <a href="/checkout" style={{display:'block',background:BRAND.red,color:'#fff',textDecoration:'none',textAlign:'center',padding:14,borderRadius:8,fontWeight:700,fontSize:15,marginBottom:10}}>
              Proceder al pago
            </a>
            <a href="/" style={{display:'block',textAlign:'center',fontSize:13,color:BRAND.gray,textDecoration:'none'}}>
              ← Seguir comprando
            </a>

            <div style={{marginTop:14,padding:12,background:'#F0FDF4',borderRadius:8,border:'1px solid #C8E6C9',display:'flex',gap:8,alignItems:'flex-start'}}>
              <ShieldCheck size={16} color={BRAND.green} style={{flexShrink:0,marginTop:1}}/>
              <div>
                <div style={{fontSize:12,color:'#1B5E20',fontWeight:600,marginBottom:2}}>Compra protegida</div>
                <div style={{fontSize:11,color:'#1B5E20'}}>Si el producto no llega te devolvemos tu dinero</div>
              </div>
            </div>

            <div style={{marginTop:12,display:'flex',justifyContent:'center',gap:12,fontSize:11,color:BRAND.gray}}>
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
