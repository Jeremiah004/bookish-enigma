'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Product } from '@/lib/store';

interface ProductCardProps {
  product: Product;
  index: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={`/product/${product.sku}`} className="group block">
        <div className="relative aspect-square mb-6 overflow-hidden bg-pearl-100">
          <Image
            src={product.images[currentImageIndex]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {product.images.length > 1 && (
            <div
              className="absolute inset-0"
              onMouseEnter={() => setCurrentImageIndex(1)}
              onMouseLeave={() => setCurrentImageIndex(0)}
            />
          )}

          {product.stock < 10 && (
            <div className="absolute top-4 right-4 px-3 py-1 bg-black text-white text-xs tracking-widest">
              LIMITED
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs tracking-[0.2em] uppercase text-black/50">
            {product.brand}
          </p>
          <h3 className="font-serif text-xl text-black group-hover:text-gold transition-colors duration-300">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-lg font-light">
              {product.denomination || `$${product.price.toLocaleString()}`}
            </p>
            {product.stock < 10 && (
              <span className="text-xs tracking-wider text-gold border border-gold/30 px-2 py-1">
                Limited Stock
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
