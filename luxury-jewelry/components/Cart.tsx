'use client';

import { useCartStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Cart() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, getTotal } = useCartStore();
  const total = getTotal();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-surface shadow-2xl z-50 flex flex-col"
          >
            <div className="border-b border-primary/10 p-6 bg-surface-subtle/50">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl text-primary">Your Selection</h2>
                <button
                  onClick={closeCart}
                  className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary"
                  aria-label="Close cart"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
                  <p className="text-primary/60 mb-3">Your cart is empty</p>
                  <button
                    onClick={closeCart}
                    className="text-sm font-medium text-gold hover:text-gold-dark transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={item.sku}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex gap-4 p-4 rounded-xl bg-surface-subtle/60 border border-primary/8"
                  >
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-pearl-100">
                      <Image
                        src={item.images[0]}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-primary/60 font-medium mb-0.5">{item.brand}</p>
                      <h3 className="font-serif text-sm mb-1 truncate text-primary">{item.name}</h3>
                      <p className="text-sm font-semibold text-primary mb-3">
                        ${item.price.toLocaleString()}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 border border-primary/15 rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.sku, item.quantity - 1)}
                            className="p-2 hover:bg-primary/10 transition-colors text-primary"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm w-8 text-center font-medium text-primary">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.sku, item.quantity + 1)}
                            className="p-2 hover:bg-primary/10 transition-colors text-primary"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.sku)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-primary/10 p-6 space-y-4 bg-surface-subtle/30">
                <div className="flex items-center justify-between text-lg">
                  <span className="font-serif text-primary">Subtotal</span>
                  <span className="font-semibold text-primary">${total.toLocaleString()}</span>
                </div>

                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full bg-primary text-white text-center py-4 rounded-lg tracking-[0.12em] text-sm font-medium uppercase hover:bg-primary-light transition-colors duration-300"
                >
                  Proceed to Checkout
                </Link>

                <button
                  onClick={closeCart}
                  className="w-full text-sm text-primary/60 hover:text-primary font-medium transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
