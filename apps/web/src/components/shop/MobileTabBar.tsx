'use client';

import { Home, LayoutGrid, User, MessageCircle, ShoppingCart } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { BRAND } from '@/lib/colors';

const TABS = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/#categorias', label: 'Categorías', icon: LayoutGrid },
  { href: '/login', label: 'Cuenta', icon: User },
  { href: '/coming-soon', label: 'Mensajes', icon: MessageCircle },
  { href: '/cart', label: 'Carrito', icon: ShoppingCart, badge: 3 },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="mrd-tabbar" style={{position:'fixed',bottom:0,left:0,right:0,background:'#fff',borderTop:'1px solid #EAEAEA',zIndex:50}}>
      <div style={{display:'flex',justifyContent:'space-around',paddingTop:8,paddingBottom:'calc(8px + env(safe-area-inset-bottom))'}}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href;
          const color = active ? BRAND.blue : BRAND.gray;
          return (
            <a key={tab.label} href={tab.href} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,textDecoration:'none',fontSize:11,fontWeight:active?700:500,color,padding:'0 6px'}}>
              <span style={{position:'relative',display:'flex'}}>
                <Icon size={22} color={color} />
                {tab.badge && (
                  <span style={{position:'absolute',top:-5,right:-7,background:BRAND.red,color:'#fff',borderRadius:'50%',width:15,height:15,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700}}>
                    {tab.badge}
                  </span>
                )}
              </span>
              {tab.label}
            </a>
          );
        })}
      </div>

      <style jsx>{`
        .mrd-tabbar { display: none; }
        @media (max-width: 860px) {
          .mrd-tabbar { display: block; }
        }
      `}</style>
    </nav>
  );
}
