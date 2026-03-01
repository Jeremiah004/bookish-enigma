import ProductCard from '@/components/ProductCard';
import products from '@/lib/products.json';
import { Product } from '@/lib/store';

export default function Home() {
  return (
    <main className="min-h-screen pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <section className="mb-16 md:mb-24 text-center">
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl mb-5 tracking-tight text-primary">
            Digital Gift Cards
          </h1>
          <p className="text-lg text-primary/70 max-w-2xl mx-auto font-light leading-relaxed">
            Instant delivery of premium gift cards for Apple, Xbox, PlayStation, and more.
            Secure checkout with RSA-2048 encryption for your peace of mind.
          </p>
        </section>

        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            {products.map((product, index) => (
              <ProductCard
                key={product.sku}
                product={product as Product}
                index={index}
              />
            ))}
          </div>
        </section>

        <div className="mt-24 text-center">
          <p className="text-sm text-primary/50 tracking-[0.2em] uppercase">
            Gift Card Store © 2026
          </p>
        </div>
      </div>
    </main>
  );
}
