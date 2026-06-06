export function HeroBanner() {
  return (
    <div className="mx-5 my-4 rounded-lg bg-blue-900 p-6 text-white flex justify-between items-center">
      <div>
        <div className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-2">🇩🇴 Marketplace Dominicano</div>
        <h1 className="font-black text-3xl leading-tight mb-3">Compra y vende<br/>en toda la República</h1>
        <p className="text-white/70 text-sm mb-4">Miles de negocios locales · 32 provincias</p>
        <button className="bg-yellow-400 text-black font-bold text-sm px-5 py-2 rounded uppercase">Explorar →</button>
      </div>
      <div className="text-8xl hidden md:block">🛍️</div>
    </div>
  );
}
