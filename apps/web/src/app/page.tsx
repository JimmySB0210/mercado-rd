import { Navbar } from '../components/shop/Navbar';
import { HeroBanner } from '../components/shop/HeroBanner';
import { ProductGrid } from '../components/shop/ProductGrid';

export default function HomePage() {
  return (
    <div>
      <Navbar />
      <HeroBanner />
      <ProductGrid />
    </div>
  );
}