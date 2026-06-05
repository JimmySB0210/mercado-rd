import { Navbar }       from '@/components/shop/Navbar';
import { CategoryBar }  from '@/components/shop/CategoryBar';
import { HeroBanner }   from '@/components/shop/HeroBanner';
import { ProductGrid }  from '@/components/shop/ProductGrid';
import { getProducts }  from '@/lib/supabase/products';

export default async function HomePage({
  searchParams,
}: {
  searchParams: { cat?: string; q?: string };
}) {
  const products = await getProducts({
    category: searchParams.cat,
    search:   searchParams.q,
    limit:    24,
  });

  return (
    <>
      <Navbar />
      <CategoryBar active={searchParams.cat} />
      <main>
        {!searchParams.cat && !searchParams.q && <HeroBanner />}
        <div className="px-5 py-4">
          <h1 className="font-display font-black text-2xl tracking-tight mb-1">
            {searchParams.q
              ? `Resultados para "${searchParams.q}"`
              : searchParams.cat
              ? searchParams.cat
              : 'Todos los productos'}
          </h1>
          <p className="text-sm text-ink-2 mb-4">
            {products.length.toLocaleString()} productos disponibles
          </p>
        </div>
        <ProductGrid products={products} />
      </main>
    </>
  );
}
