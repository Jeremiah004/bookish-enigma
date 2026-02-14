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
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="border-b border-black/10 p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl">Your Selection</h2>
                <button
                  onClick={closeCart}
                  className="p-2 hover:bg-pearl-100 rounded-full transition-colors"
                  aria-label="Close cart"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-black/50 mb-2">Your cart is empty</p>
                  <button
                    onClick={closeCart}
                    className="text-sm text-gold hover:text-gold-dark transition-colors"
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
                    className="flex gap-4"
                  >
                    <div className="relative w-24 h-24 flex-shrink-0 bg-pearl-100">
                      <Image
                        src={item.images[0]}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-black/50 mb-1">{item.brand}</p>
                      <h3 className="font-serif text-sm mb-2 truncate">{item.name}</h3>
                      <p className="text-sm font-light mb-3">
                        ${item.price.toLocaleString()}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 border border-black/10 rounded">
                          <button
                            onClick={() => updateQuantity(item.sku, item.quantity - 1)}
                            className="p-2 hover:bg-pearl-100 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.sku, item.quantity + 1)}
                            className="p-2 hover:bg-pearl-100 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.sku)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded transition-colors"
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

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-black/10 p-6 space-y-4">
                <div className="flex items-center justify-between text-lg">
                  <span className="font-serif">Subtotal</span>
                  <span className="font-light">${total.toLocaleString()}</span>
                </div>

                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full bg-black text-white text-center py-4 tracking-[0.15em] text-sm uppercase hover:bg-gold transition-colors duration-300"
                >
                  Proceed to Checkout
                </Link>

                <button
                  onClick={closeCart}
                  className="w-full text-sm text-black/50 hover:text-black transition-colors"
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
