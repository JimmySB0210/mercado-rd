'use client';
import { useRouter } from 'next/navigation';
const CATS = [
  {slug:'',name:'Todos'},
  {slug:'calzado',name:'Calzado'},
  {slug:'ropa',name:'Ropa'},
  {slug:'electronica',name:'Electrónica'},
  {slug:'alimentos',name:'Alimentos'},
  {slug:'belleza',name:'Belleza'},
  {slug:'hogar',name:'Hogar'},
  {slug:'ferreteria',name:'Ferretería'},
  {slug:'autos',name:'Autos'},
  {slug:'agro',name:'Agropecuario'},
];
export function CategoryBar({ active }: { active?: string }) {
  const router = useRouter();
  return (
    <div style={{display:'flex',overflowX:'auto',borderBottom:'1px solid #eee',position:'sticky',top:56,zIndex:40,background:'#fff',height:44}}>
      {CATS.map((c) => (
        <button
          key={c.slug}
          onClick={() => router.push(c.slug ? '/?cat='+c.slug : '/')}
          style={{flexShrink:0,padding:'0 16px',height:44,fontSize:14,whiteSpace:'nowrap',border:'none',borderBottom: active===c.slug||((!active)&&c.slug==='')?'2px solid #111':'2px solid transparent',fontWeight:active===c.slug||((!active)&&c.slug==='')?600:400,background:'none',cursor:'pointer'}}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
