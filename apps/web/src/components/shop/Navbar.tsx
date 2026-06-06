'use client';
import Link from 'next/link';
export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-ink h-14 flex items-center px-5 gap-4 border-b border-white/10">
      <Link href="/" className="font-display font-black text-xl text-white">
        Mercado<span className="text-rd-red">RD</span>
      </Link>
      <div className="flex-1 max-w-md mx-4">
        <div className="flex bg-white rounded overflow-hidden">
          <input type="text" placeholder="Buscar productos..." className="flex-1 px-3 py-2 text-sm outline-none"/>
          <button className="bg-rd-gold px-3 font-bold text-ink">🔍</button>
        </div>
      </div>
      <Link href="/vendor/register" className="ml-auto bg-rd-gold text-ink font-display font-bold text-xs px-3 py-1.5 rounded uppercase">
        Vender en RD
      </Link>
    </nav>
  );
}
