import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';
import Cart from '@/components/Cart';

export const metadata: Metadata = {
  title: 'Gift Card Store - Digital Gift Cards',
  description: 'Purchase digital gift cards for Apple, Xbox, PlayStation, and more. Instant delivery with secure RSA-2048 encrypted checkout.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        <Cart />
        {children}
      </body>
    </html>
  );
}
