import { Navbar } from '@/components/shop/Navbar';
import { CategoryBar } from '@/components/shop/CategoryBar';
import { HeroBanner } from '@/components/shop/HeroBanner';
import { ProductGrid } from '@/components/shop/ProductGrid';

export default function HomePage({
  searchParams,
}: {
  searchParams: { cat?: string; q?: string };
}) {
  return (
    <>
      <Navbar />
      <CategoryBar active={searchParams.cat} />
      <main>
        {!searchParams.cat && !searchParams.q && <HeroBanner />}
        <div style={{padding:'16px 20px 8px'}}>
          <h1 style={{fontFamily:'sans-serif',fontWeight:900,fontSize:24,letterSpacing:-0.5,marginBottom:4}}>
            {searchParams.q
              ? ⁠ Resultados para "${searchParams.q}" ⁠
              : searchParams.cat
              ? searchParams.cat
              : 'Todos los productos'}
          </h1>
          <p style={{fontSize:13,color:'#999'}}>
            Productos de negocios dominicanos
          </p>
        </div>
        <ProductGrid />
      </main>
    </>
  );
}