'use client';

const P = [
  {id:'1',name:'Tenis Nike Air Premium',price:3200,old:4500,v:'SportStore',l:'Santiago',e:'👟'},
  {id:'2',name:'Vestido floral 2026',price:1650,v:'ModaCapital',l:'SDQ',e:'👗'},
  {id:'3',name:'Samsung Galaxy A54',price:17500,v:'TechEste',l:'San Pedro',e:'📱'},
  {id:'4',name:'Especias dominicanas',price:450,v:'AgroVerde',l:'La Vega',e:'🌿'},
  {id:'5',name:'Crema de karité',price:780,v:'BeautyNord',l:'Pto.Plata',e:'🧴'},
  {id:'6',name:'Botas de trabajo',price:4100,v:'FerrePlata',l:'Pto.Plata',e:'🥾'},
  {id:'7',name:'Sofá 3 plazas',price:22000,v:'MuebleRD',l:'SDQ',e:'🛋️'},
  {id:'8',name:'New Balance 574',price:4400,old:5200,v:'MegaSport',l:'Santiago',e:'👟'},
];

export function ProductGrid({ products }: { products?: any[] }) {
  const items = products?.length ? products : P;
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:1,background:'#e5e7eb',borderTop:'1px solid #e5e7eb'}}>
      {items.map((p: any) => (
        <div key={p.id} style={{background:'#fff',cursor:'pointer'}}>
          <div style={{aspectRatio:'1',background:'#f5f5f5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:56,position:'relative'}}>
            {p.e || '📦'}
            {(p.old || p.compare_rdp) && (
              <span style={{position:'absolute',top:8,left:8,background:'#dc2626',color:'#fff',fontSize:11,fontWeight:700,padding:'2px 6px',borderRadius:2}}>
                -{Math.round((1 - (p.price || p.price_rdp) / (p.old || p.compare_rdp)) * 100)}%
              </span>
            )}
          </div>
          <div style={{padding:12}}>
            <div style={{fontSize:11,color:'#9ca3af',textTransform:'uppercase',letterSpacing:0.5,marginBottom:2}}>
              {p.v || p.vendor?.business_name} · {p.l || p.vendor?.province?.name}
            </div>
            <div style={{fontWeight:600,fontSize:15,lineHeight:1.3,marginBottom:4}}>
              {p.name}
            </div>
            <div style={{display:'flex',alignItems:'baseline',gap:6}}>
              <span style={{fontWeight:700,color:(p.old||p.compare_rdp)?'#dc2626':'#111'}}>
                RD${(p.price || p.price_rdp || 0).toLocaleString()}
              </span>
              {(p.old || p.compare_rdp) && (
                <span style={{fontSize:12,color:'#d1d5db',textDecoration:'line-through'}}>
                  RD${(p.old || p.compare_rdp).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}