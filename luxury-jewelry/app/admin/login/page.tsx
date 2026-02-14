'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, AlertCircle } from 'lucide-react';
import { setAdminApiKey, isAdminAuthenticated, fetchAdminStats } from '@/lib/admin';

export default function AdminLogin() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAdminAuthenticated()) {
      router.push('/admin');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Test the API key by trying to fetch stats
      // Temporarily set it to test
      setAdminApiKey(apiKey);
      
      // Try to fetch stats to validate the key
      await fetchAdminStats();
      
      // If successful, redirect to dashboard
      router.push('/admin');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid API key';
      setError(errorMessage);
      setAdminApiKey(''); // Clear invalid key
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-32 pb-20 bg-pearl-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full mx-6"
      >
        <div className="bg-white p-8 rounded border border-black/10">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-8 h-8 text-gold" />
            <h1 className="font-serif text-3xl">Admin Login</h1>
          </div>
          
          <p className="text-black/60 mb-6">
            Enter your admin API key to access the dashboard. This key should be set in your backend environment variables as <code className="bg-black/5 px-1 rounded">ADMIN_API_KEY</code>.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-2 text-black/70">Admin API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-4 py-3 border border-black/20 focus:border-gold focus:outline-none transition-colors"
                placeholder="Enter your admin API key"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 p-4 rounded flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">{error}</div>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading || !apiKey}
              className="w-full bg-black text-white py-4 tracking-[0.15em] text-sm uppercase hover:bg-gold transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Access Dashboard
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-black/10">
            <p className="text-xs text-black/40">
              <strong>Note:</strong> This is a secure admin area. Only authorized personnel should access this page.
              The API key is stored locally in your browser and is required for all admin API requests.
            </p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}

