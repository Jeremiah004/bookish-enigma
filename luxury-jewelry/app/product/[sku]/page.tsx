'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronLeft, Check } from 'lucide-react';
import Link from 'next/link';
import products from '@/lib/products.json';
import { useCartStore } from '@/lib/store';
import { Product } from '@/lib/store';

export default function ProductPage({ params }: { params: { sku: string } }) {
  const product = products.find((p) => p.sku === params.sku) as Product | undefined;
  const [selectedImage, setSelectedImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem, openCart } = useCartStore();

  if (!product) {
    notFound();
  }

  const handleAddToCart = () => {
    addItem(product);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    addItem(product);
    openCart();
  };

  return (
    <main className="min-h-screen pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-primary/60 hover:text-primary transition-colors mb-10"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Collection
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="relative aspect-square bg-pearl-100 rounded-xl overflow-hidden shadow-card"
            >
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {product.stock < 10 && (
                <div className="absolute top-4 right-4 px-3 py-1.5 bg-primary text-white text-xs font-medium tracking-widest rounded">
                  LIMITED STOCK
                </div>
              )}
            </motion.div>

            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square bg-pearl-100 rounded-lg overflow-hidden transition-all ${
                      selectedImage === index ? 'ring-2 ring-gold shadow-card' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} view ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="150px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div>
              <p className="text-sm tracking-[0.2em] uppercase text-primary/60 font-medium mb-2">
                {product.brand}
              </p>
              <h1 className="font-serif text-4xl md:text-5xl mb-4 text-primary">{product.name}</h1>
              <p className="text-3xl font-semibold text-primary">
                {product.denomination || `$${product.price.toLocaleString()}`}
              </p>
            </div>

            <p className="text-primary/75 leading-relaxed">{product.description}</p>

            <div className="border-t border-primary/10 pt-6">
              <h2 className="font-serif text-xl mb-4 text-primary">Gift Card Details</h2>
              <div className="space-y-0 bg-surface-subtle rounded-xl border border-primary/8 divide-y divide-primary/8">
                <div className="flex justify-between py-4 px-4">
                  <span className="text-primary/60">Brand</span>
                  <span className="font-medium text-primary">{product.brand}</span>
                </div>
                <div className="flex justify-between py-4 px-4">
                  <span className="text-primary/60">Denomination</span>
                  <span className="font-medium text-primary">{product.denomination || `$${product.price}`}</span>
                </div>
                <div className="flex justify-between py-4 px-4">
                  <span className="text-primary/60">Stock</span>
                  <span className={`font-medium ${product.stock < 10 ? 'text-gold' : 'text-primary'}`}>
                    {product.stock} {product.stock === 1 ? 'card' : 'cards'} available
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-primary/10 pt-6">
              <h2 className="font-serif text-xl mb-4 text-primary">How to Redeem</h2>
              <ul className="space-y-2 text-sm text-primary/75">
                <li>• Digital code delivered instantly after purchase</li>
                <li>• Redeem on the {product.brand} store or platform</li>
                <li>• Code never expires</li>
                <li>• Works across all compatible devices</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleBuyNow}
                className="w-full bg-primary text-white py-4 rounded-lg tracking-[0.12em] text-sm font-medium uppercase hover:bg-primary-light transition-colors duration-300"
              >
                Buy Now
              </button>
              <button
                onClick={handleAddToCart}
                className="w-full border-2 border-primary text-primary py-4 rounded-lg tracking-[0.12em] text-sm font-medium uppercase hover:bg-primary hover:text-white transition-colors duration-300 flex items-center justify-center gap-2"
              >
                {addedToCart ? (
                  <>
                    <Check className="w-4 h-4" />
                    Added to Cart
                  </>
                ) : (
                  'Add to Cart'
                )}
              </button>
            </div>

            <div className="text-sm text-primary/55 space-y-1">
              <p>• Instant digital delivery</p>
              <p>• Secure RSA-2048 encrypted checkout</p>
              <p>• 24/7 customer support</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
