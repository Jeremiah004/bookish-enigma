'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Package, Mail } from 'lucide-react';
import Link from 'next/link';

export default function SuccessPage() {
  return (
    <main className="min-h-screen pt-32 pb-20 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto px-6 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <CheckCircle className="w-12 h-12 text-green-600" />
        </motion.div>

        <h1 className="font-serif text-5xl mb-4">Thank You</h1>
        <p className="text-xl text-black/60 mb-12">
          Your gift card purchase has been confirmed
        </p>

        <div className="bg-pearl-50 p-8 rounded mb-8 space-y-6">
          <div className="flex items-start gap-4 text-left">
            <Package className="w-6 h-6 text-gold flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-serif text-lg mb-2">What happens next?</h3>
              <p className="text-black/60 text-sm leading-relaxed">
                Your digital gift card code will be delivered instantly. You can redeem it
                immediately on the respective platform's store.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 text-left">
            <Mail className="w-6 h-6 text-gold flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-serif text-lg mb-2">Order Confirmation</h3>
              <p className="text-black/60 text-sm leading-relaxed">
                A confirmation email with your gift card code and redemption instructions
                has been sent to your registered email address.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-black text-white py-4 tracking-[0.15em] text-sm uppercase hover:bg-gold transition-colors duration-300"
          >
            Continue Shopping
          </Link>
          
          <p className="text-xs text-black/40 tracking-[0.2em] uppercase">
            Gift Card Store © 2026
          </p>
        </div>
      </motion.div>
    </main>
  );
}
