'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AlertCircle, CheckCircle, CreditCard } from 'lucide-react';
import { useCartStore } from '@/lib/store';
import {
  luhnCheck,
  validateExpiryDate,
  validateCVV,
  formatCardNumber,
  formatExpiry,
  fetchPublicKey,
  encryptPaymentData,
  processPayment,
  PaymentData,
} from '@/lib/payment';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, clearCart, publicKey: storePublicKey, setPublicKey: setStorePublicKey } = useCartStore();
  const total = getTotal();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isLoadingKey, setIsLoadingKey] = useState(true);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

  useEffect(() => {
    if (items.length === 0) {
      router.push('/');
    }
  }, [items, router]);

  useEffect(() => {
    if (storePublicKey) {
      setPublicKey(storePublicKey);
      setIsLoadingKey(false);
      return;
    }

    const loadPublicKey = async () => {
      setIsLoadingKey(true);
      setErrorMessage('');
      setPaymentStatus('idle');
      try {
        const key = await fetchPublicKey(backendUrl);
        if (!key) throw new Error('Public key is empty or invalid');
        setPublicKey(key);
        setStorePublicKey(key);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to initialize secure checkout';
        let userMessage = errorMsg;
        if (errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('Failed to fetch')) {
          userMessage = `Cannot connect to backend server. Please check:\n1. Backend URL is correct: ${backendUrl}\n2. Backend is running and accessible\n3. CORS is configured correctly`;
        } else if (errorMsg.includes('404')) {
          userMessage = `Backend endpoint not found. Check if ${backendUrl}/api/crypto/key exists`;
        } else if (errorMsg.includes('CORS')) {
          userMessage = `CORS error: Backend may not allow requests from this origin`;
        }
        setErrorMessage(userMessage);
        setPaymentStatus('error');
      } finally {
        setIsLoadingKey(false);
      }
    };

    loadPublicKey();
  }, [backendUrl, storePublicKey, setStorePublicKey]);

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;

    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiry') {
      formattedValue = formatExpiry(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    setFormData((prev) => ({ ...prev, [field]: formattedValue }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Cardholder name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else {
      const emailPattern = /.+@.+\..+/;
      if (!emailPattern.test(formData.email.trim())) {
        newErrors.email = 'A valid email address is required';
      }
    }

    const cardNumber = formData.cardNumber.replace(/\s/g, '');
    if (!cardNumber) {
      newErrors.cardNumber = 'Card number is required';
    } else if (!luhnCheck(cardNumber)) {
      newErrors.cardNumber = 'Card number is invalid';
    }

    if (!formData.expiry) {
      newErrors.expiry = 'Expiry date is required';
    } else if (!validateExpiryDate(formData.expiry)) {
      newErrors.expiry = 'Expiry date is invalid or expired';
    }

    if (!formData.cvv) {
      newErrors.cvv = 'CVV is required';
    } else if (!validateCVV(formData.cvv)) {
      newErrors.cvv = 'CVV must be 3 or 4 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!publicKey) {
      setErrorMessage('Security initialization failed. Please refresh the page.');
      setPaymentStatus('error');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('idle');
    setErrorMessage('');

    try {
      // Create payment data object
      const paymentData: PaymentData = {
        cardNumber: formData.cardNumber.replace(/\s/g, ''),
        expiry: formData.expiry,
        cvv: formData.cvv,
        fullName: formData.fullName,
        email: formData.email,
        amount: total,
      };

      // Encrypt the payment data
      const ciphertext = await encryptPaymentData(paymentData, publicKey);

      // Immediately clear sensitive data from React state
      setFormData({
        fullName: '',
        email: '',
        cardNumber: '',
        expiry: '',
        cvv: '',
      });

      // Send encrypted data to backend
      const result = await processPayment(ciphertext, backendUrl);

      if (result.success) {
        setPaymentStatus('success');
        clearCart();
        
        // Redirect to success page after 2 seconds
        setTimeout(() => {
          router.push('/success');
        }, 2000);
      } else {
        setPaymentStatus('error');
        setErrorMessage(result.error || 'Payment processing failed');
      }
    } catch (error) {
      setPaymentStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <main className="min-h-screen pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-serif text-4xl md:text-5xl mb-12 text-center text-primary">Secure Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h2 className="font-serif text-2xl mb-6 text-primary">Order Summary</h2>
              
              <div className="bg-surface border border-primary/8 rounded-xl p-6 shadow-card space-y-4">
                {items.map((item) => (
                  <div key={item.sku} className="flex justify-between py-3 border-b border-primary/8 last:border-0">
                    <div>
                      <p className="font-medium text-primary">{item.name}</p>
                      <p className="text-sm text-primary/55">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-primary">${(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}

                <div className="flex justify-between pt-4 text-xl">
                  <span className="font-serif text-primary">Total</span>
                  <span className="font-semibold text-primary">${total.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-gold/10 border border-gold/20 p-4 rounded-xl flex items-start gap-3">
                <Lock className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1 text-primary">End-to-End Encryption</p>
                  <p className="text-primary/70">
                    Your payment information is encrypted using RSA-2048 before transmission.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-serif text-2xl mb-6 text-primary">Payment Details</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm mb-1 text-primary/70 tracking-[0.12em] uppercase font-medium">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border bg-surface ${
                      errors.fullName ? 'border-red-500' : 'border-primary/20'
                    } focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none transition-colors text-primary`}
                    placeholder="John Smith"
                    disabled={isProcessing || paymentStatus === 'success'}
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm mb-1 text-primary/70 tracking-[0.12em] uppercase font-medium">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border bg-surface ${
                      errors.email ? 'border-red-500' : 'border-primary/20'
                    } focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none transition-colors text-primary`}
                    placeholder="you@example.com"
                    disabled={isProcessing || paymentStatus === 'success'}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm mb-1 text-primary/70 tracking-[0.12em] uppercase font-medium">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.cardNumber}
                      onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border bg-surface ${
                        errors.cardNumber ? 'border-red-500' : 'border-primary/20'
                      } focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none transition-colors text-primary`}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      disabled={isProcessing || paymentStatus === 'success'}
                    />
                    <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40" />
                  </div>
                  {errors.cardNumber && (
                    <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm mb-1 text-primary/70 tracking-[0.12em] uppercase font-medium">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={formData.expiry}
                      onChange={(e) => handleInputChange('expiry', e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border bg-surface ${
                        errors.expiry ? 'border-red-500' : 'border-primary/20'
                      } focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none transition-colors text-primary`}
                      placeholder="MM/YY"
                      maxLength={5}
                      disabled={isProcessing || paymentStatus === 'success'}
                    />
                    {errors.expiry && (
                      <p className="text-red-500 text-sm mt-1">{errors.expiry}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm mb-1 text-primary/70 tracking-[0.12em] uppercase font-medium">
                      CVV
                    </label>
                    <input
                      type="text"
                      value={formData.cvv}
                      onChange={(e) => handleInputChange('cvv', e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border bg-surface ${
                        errors.cvv ? 'border-red-500' : 'border-primary/20'
                      } focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none transition-colors text-primary`}
                      placeholder="123"
                      maxLength={4}
                      disabled={isProcessing || paymentStatus === 'success'}
                    />
                    {errors.cvv && (
                      <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
                    )}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {paymentStatus === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-green-50 border border-green-200 p-4 rounded flex items-center gap-3"
                    >
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <p className="text-green-800 text-sm">Payment successful! Redirecting...</p>
                    </motion.div>
                  )}

                  {paymentStatus === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-red-50 border border-red-200 p-4 rounded flex items-start gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm flex-1">
                        <p className="text-red-800 font-medium mb-1">Payment Failed</p>
                        <div className="text-red-700 whitespace-pre-line">{errorMessage}</div>
                        {errorMessage.includes(backendUrl) && (
                          <div className="mt-2 pt-2 border-t border-red-200">
                            <p className="text-xs text-red-600">
                              Backend URL: <code className="bg-red-100 px-1 rounded">{backendUrl}</code>
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between text-xs text-primary/70">
                  {isLoadingKey ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                      <span>Initializing secure connection...</span>
                    </div>
                  ) : publicKey ? (
                    <div className="flex items-center gap-2 text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Secure connection ready</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentStatus('idle');
                        setErrorMessage('');
                        setStorePublicKey(null);
                        setPublicKey(null);
                        setIsLoadingKey(true);
                        fetchPublicKey(backendUrl)
                          .then((key) => {
                            setPublicKey(key);
                            setStorePublicKey(key);
                          })
                          .catch((err) => {
                            setErrorMessage(err instanceof Error ? err.message : 'Failed to load secure connection');
                            setPaymentStatus('error');
                          })
                          .finally(() => setIsLoadingKey(false));
                      }}
                      className="text-gold font-medium underline-offset-2 hover:underline"
                    >
                      Retry secure connection
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || paymentStatus === 'success' || isLoadingKey || !publicKey}
                  className="w-full bg-primary text-white py-4 rounded-lg tracking-[0.12em] text-sm font-medium uppercase hover:bg-primary-light transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Complete Purchase
                    </>
                  )}
                </button>

                <Link
                  href="/"
                  className="block text-center text-sm text-primary/60 hover:text-primary font-medium transition-colors"
                >
                  Continue Shopping
                </Link>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
