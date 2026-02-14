import ProductCard from '@/components/ProductCard';
import products from '@/lib/products.json';
import { Product } from '@/lib/store';

export default function Home() {
  return (
    <main className="min-h-screen pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Hero Section */}
        <section className="mb-20 text-center">
          <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl mb-6 tracking-tight">
            Digital Gift Cards
          </h1>
          <p className="text-lg text-black/60 max-w-2xl mx-auto font-light leading-relaxed">
            Instant delivery of premium gift cards for Apple, Xbox, PlayStation, and more.
            Secure checkout with RSA-2048 encryption for your peace of mind.
          </p>
        </section>

        {/* Product Grid */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
            {products.map((product, index) => (
              <ProductCard
                key={product.sku}
                product={product as Product}
                index={index}
              />
            ))}
          </div>
        </section>

        {/* Bottom Spacer */}
        <div className="mt-32 text-center">
          <p className="text-sm text-black/40 tracking-[0.2em] uppercase">
            Gift Card Store © 2026
          </p>
        </div>
      </div>
    </main>
  );
}
