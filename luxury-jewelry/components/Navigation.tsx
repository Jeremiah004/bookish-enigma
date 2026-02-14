'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { motion } from 'framer-motion';

export default function Navigation() {
  const { openCart, getItemCount } = useCartStore();
  const itemCount = getItemCount();

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-black/5"
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="font-serif text-3xl tracking-tight text-black">
            Gift Cards
          </Link>

          <div className="flex items-center gap-12">
            <Link
              href="/"
              className="text-sm tracking-[0.15em] uppercase text-black/70 hover:text-black transition-colors duration-300"
            >
              Shop
            </Link>
            <Link
              href="/story"
              className="text-sm tracking-[0.15em] uppercase text-black/70 hover:text-black transition-colors duration-300"
            >
              Our Story
            </Link>

            <button
              onClick={openCart}
              className="relative group"
              aria-label="Shopping cart"
            >
              <ShoppingBag className="w-5 h-5 text-black/70 group-hover:text-black transition-colors duration-300" />
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-gold text-white text-xs flex items-center justify-center rounded-full font-sans"
                >
                  {itemCount}
                </motion.span>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
