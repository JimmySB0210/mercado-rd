import { Navbar } from '../components/shop/Navbar';
import { CategoryBar } from '../components/shop/CategoryBar';
import { HeroBanner } from '../components/shop/HeroBanner';
import { ProductGrid } from '../components/shop/ProductGrid';

export default function HomePage() {
  return (
    <div>
      <Navbar />
      <CategoryBar />
      <HeroBanner />
      <ProductGrid />
    </div>
  );
}
