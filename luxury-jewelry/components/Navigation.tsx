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
      className="fixed top-0 left-0 right-0 z-50 bg-primary shadow-nav"
    >
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="font-serif text-2xl md:text-3xl tracking-tight text-white hover:text-gold-light transition-colors duration-300"
          >
            Gift Cards
          </Link>

          <div className="flex items-center gap-8 md:gap-12">
            <Link
              href="/"
              className="text-sm tracking-[0.12em] uppercase text-white/80 hover:text-gold-light transition-colors duration-300"
            >
              Shop
            </Link>
            <Link
              href="/story"
              className="text-sm tracking-[0.12em] uppercase text-white/80 hover:text-gold-light transition-colors duration-300"
            >
              Our Story
            </Link>

            <button
              onClick={openCart}
              className="relative group p-1.5 -m-1.5 rounded-md hover:bg-white/10 transition-colors duration-200"
              aria-label="Shopping cart"
            >
              <ShoppingBag className="w-5 h-5 text-white/90 group-hover:text-gold-light transition-colors duration-300" />
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 bg-gold text-primary text-xs font-semibold flex items-center justify-center rounded-full"
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
