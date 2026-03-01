'use client';

import { motion } from 'framer-motion';
import { Award, Heart, Shield } from 'lucide-react';

export default function StoryPage() {
  return (
    <main className="min-h-screen pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-serif text-5xl md:text-6xl mb-6 text-center text-primary">Our Story</h1>
          <p className="text-center text-primary/70 mb-16 text-lg">
            Secure, instant digital gift cards for the modern world
          </p>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <p className="text-primary/80 leading-relaxed text-lg">
                We are dedicated to providing instant, secure digital gift cards for the world's
                most popular platforms. Our mission is to make gifting digital content as simple,
                secure, and reliable as possible, using enterprise-grade RSA-2048 encryption
                to protect every transaction.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <p className="text-primary/80 leading-relaxed text-lg">
                Every gift card in our collection is verified and ready for instant delivery.
                From Apple to Xbox to PlayStation, we partner with trusted platforms to ensure
                your codes are authentic and redeemable immediately. Your security and satisfaction
                are our top priorities.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-center p-8 bg-surface border border-primary/8 rounded-xl shadow-card"
              >
                <div className="w-12 h-12 bg-gold/15 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-6 h-6 text-gold" />
                </div>
                <h3 className="font-serif text-xl mb-3 text-primary">Authenticity</h3>
                <p className="text-sm text-primary/70">
                  Every gift card is verified and authentic, ensuring your codes work
                  immediately upon redemption.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="text-center p-8 bg-surface border border-primary/8 rounded-xl shadow-card"
              >
                <div className="w-12 h-12 bg-gold/15 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-gold" />
                </div>
                <h3 className="font-serif text-xl mb-3 text-primary">Instant Delivery</h3>
                <p className="text-sm text-primary/70">
                  Digital codes delivered immediately after purchase, so you can start
                  using them right away.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="text-center p-8 bg-surface border border-primary/8 rounded-xl shadow-card"
              >
                <div className="w-12 h-12 bg-gold/15 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-gold" />
                </div>
                <h3 className="font-serif text-xl mb-3 text-primary">Security</h3>
                <p className="text-sm text-primary/70">
                  RSA-2048 encryption protects every transaction. Your payment information
                  is never stored in plain text.
                </p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.6 }}
            >
              <p className="text-primary/80 leading-relaxed text-lg">
                We invite you to browse our selection of premium digital gift cards. Whether
                you're treating yourself or gifting to someone special, we ensure every purchase
                is secure, instant, and reliable. Experience the convenience of digital gifting
                with enterprise-grade security.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="text-center mt-16"
          >
            <p className="text-sm text-primary/50 tracking-[0.2em] uppercase">
              Gift Card Store © 2026
            </p>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
