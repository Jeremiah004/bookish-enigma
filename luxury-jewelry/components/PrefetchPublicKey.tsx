'use client';

import { useEffect, useRef } from 'react';
import { useCartStore } from '@/lib/store';
import { fetchPublicKey } from '@/lib/payment';

export default function PrefetchPublicKey() {
  const itemCount = useCartStore((s) => s.items.length);
  const publicKey = useCartStore((s) => s.publicKey);
  const setPublicKey = useCartStore((s) => s.setPublicKey);
  const prefetchStarted = useRef(false);

  useEffect(() => {
    if (itemCount === 0 || publicKey || prefetchStarted.current) return;

    prefetchStarted.current = true;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    fetchPublicKey(backendUrl)
      .then((key) => setPublicKey(key))
      .catch(() => {
        // Prefetch failed; checkout will fetch on mount
      })
      .finally(() => {
        prefetchStarted.current = false;
      });
  }, [itemCount, publicKey, setPublicKey]);

  return null;
}
