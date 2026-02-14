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
    <main className="min-h-screen pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black transition-colors mb-12"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Collection
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Images */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative aspect-square bg-pearl-100"
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
                <div className="absolute top-6 right-6 px-4 py-2 bg-black text-white text-xs tracking-widest">
                  LIMITED STOCK
                </div>
              )}
            </motion.div>

            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square bg-pearl-100 transition-opacity ${
                      selectedImage === index ? 'ring-2 ring-gold' : 'opacity-60 hover:opacity-100'
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

          {/* Product Info */}
          <div className="space-y-8">
            <div>
              <p className="text-sm tracking-[0.2em] uppercase text-black/50 mb-3">
                {product.brand}
              </p>
              <h1 className="font-serif text-5xl mb-4">{product.name}</h1>
              <p className="text-3xl font-light">${product.price.toLocaleString()}</p>
            </div>

            <p className="text-black/70 leading-relaxed">{product.description}</p>

            {/* Gift Card Details */}
            <div className="border-t border-black/10 pt-6">
              <h2 className="font-serif text-2xl mb-4">Gift Card Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-black/5">
                  <span className="text-black/60">Brand</span>
                  <span className="font-medium">{product.brand}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-black/5">
                  <span className="text-black/60">Denomination</span>
                  <span className="font-medium">{product.denomination || `$${product.price}`}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-black/5">
                  <span className="text-black/60">Stock</span>
                  <span className={`font-medium ${product.stock < 10 ? 'text-gold' : ''}`}>
                    {product.stock} {product.stock === 1 ? 'card' : 'cards'} available
                  </span>
                </div>
              </div>
            </div>

            {/* Redemption Information */}
            <div className="border-t border-black/10 pt-6">
              <h2 className="font-serif text-2xl mb-4">How to Redeem</h2>
              <div className="space-y-3 text-sm text-black/70">
                <p>• Digital code will be delivered instantly after purchase</p>
                <p>• Redeem on the {product.brand} store or platform</p>
                <p>• Code never expires</p>
                <p>• Works across all compatible devices</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleBuyNow}
                className="w-full bg-black text-white py-4 tracking-[0.15em] text-sm uppercase hover:bg-gold transition-colors duration-300"
              >
                Buy Now
              </button>
              <button
                onClick={handleAddToCart}
                className="w-full border border-black text-black py-4 tracking-[0.15em] text-sm uppercase hover:bg-black hover:text-white transition-colors duration-300 flex items-center justify-center gap-2"
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

            {/* Additional Info */}
            <div className="text-sm text-black/50 space-y-2">
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
