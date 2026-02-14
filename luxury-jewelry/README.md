# Maison - Luxury Jewelry SaaS Frontend

A high-end, responsive luxury jewelry e-commerce application built with Next.js 14, TypeScript, Tailwind CSS, and Framer Motion. Features a custom RSA encryption-based payment system for maximum security.

## 🎨 Design Philosophy

**Ultra-Luxe Aesthetic:**
- Minimalist with generous whitespace
- Playfair Display serif for headings
- Inter sans-serif for body text
- Glassmorphism navigation
- Gold (#D4AF37) accents on pure white background
- Subtle Framer Motion animations

## ✨ Features

### Product Catalog
- Dynamic product grid (2x4 responsive layout)
- Image hover effects (swaps to second image if available)
- Individual product detail pages at `/product/[sku]`
- Technical specifications table with carat, clarity, dimensions
- "Limited Stock" indicator for items with < 10 units

### Shopping Cart
- Slide-out drawer with Zustand state management
- Real-time cart counter in navigation
- Add/remove items, update quantities
- Automatic subtotal calculation
- Persistent across page navigation

### Secure Checkout
- **Custom RSA Encryption Flow** (No Stripe/PayPal SDK)
- Fetches RSA public key from backend on load
- Client-side encryption using the browser Web Crypto API (RSA-OAEP)
- Frontend validation with Luhn algorithm for card numbers
- Expiry date and CVV validation
- Immediate memory cleanup after encryption
- Sends only ciphertext to backend

### Security Features
- RSA-2048 encryption for payment data
- Frontend validation prevents invalid encrypted requests
- HTTPS enforcement
- CORS error handling
- Mixed content protection
- Zero raw payment data transmission

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API with RSA encryption endpoints (see Backend Requirements)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd luxury-jewelry
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

4. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔐 Backend Requirements

Your backend must provide two endpoints:

### 1. Public Key Endpoint
```
GET /api/crypto/key
```

Response:
```json
{
  "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----"
}
```

### 2. Payment Processing Endpoint
```
POST /api/process-payment
```

Request:
```json
{
  "ciphertext": "encrypted-payment-data-string"
}
```

Response (Success) – example shape from the reference backend:
```json
{
  "success": true,
  "transactionId": "txn_123456789"
}
```

Response (Error) – example shape from the reference backend:
```json
{
  "success": false,
  "error": "Payment declined: insufficient funds"
}
```

**Backend Implementation Notes (for the Secure Vault backend in `kreditkarte`):**
- Uses RSA-2048 keypair managed on startup
- Public key is exposed via `GET /api/crypto/key`
- Frontend encrypts a minimal JSON payload `{ card, amount }` with RSA-OAEP
- Backend decrypts with the private key and `RSA_PKCS1_OAEP_PADDING`
- Decrypted data is validated (Luhn + amount) and a mock transaction ID is returned

## 📦 Deployment

### Vercel (Recommended)

1. Push code to GitHub/GitLab

2. Import project in Vercel

3. Add environment variables:
   - `NEXT_PUBLIC_BACKEND_URL`

4. Deploy

### Other Platforms

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🎯 Project Structure

```
luxury-jewelry/
├── app/
│   ├── checkout/
│   │   └── page.tsx          # Secure checkout with RSA encryption
│   ├── product/
│   │   └── [sku]/
│   │       └── page.tsx      # Dynamic product details
│   ├── story/
│   │   └── page.tsx          # About page
│   ├── success/
│   │   └── page.tsx          # Post-payment confirmation
│   ├── globals.css           # Global styles + custom fonts
│   ├── layout.tsx            # Root layout with Navigation + Cart
│   └── page.tsx              # Home page with product grid
├── components/
│   ├── Cart.tsx              # Slide-out cart drawer
│   ├── Navigation.tsx        # Glassmorphism navbar
│   └── ProductCard.tsx       # Product grid item
├── lib/
│   ├── payment.ts            # RSA encryption + validation utilities
│   ├── products.json         # Product catalog data
│   └── store.ts              # Zustand cart state management
├── public/
│   └── images/               # Static assets
├── .env.local.example        # Environment variables template
├── next.config.mjs           # Next.js configuration
├── package.json              # Dependencies
├── tailwind.config.ts        # Tailwind theme customization
└── tsconfig.json             # TypeScript configuration
```

## 🔒 Security Best Practices

### Frontend Security
✅ Luhn validation prevents invalid card submissions  
✅ Expiry date validation (month 1-12, future dates only)  
✅ CVV format validation (3-4 digits)  
✅ Immediate state cleanup after encryption  
✅ No raw payment data stored in localStorage/sessionStorage  
✅ HTTPS enforcement via environment checks  

### Production Checklist
- [ ] Enable HTTPS on both frontend and backend
- [ ] Configure CORS to allow only your frontend domain
- [ ] Use environment variables for all sensitive config
- [ ] Test RSA encryption/decryption flow end-to-end
- [ ] Monitor for "Mixed Content" browser warnings
- [ ] Implement rate limiting on payment endpoint
- [ ] Add request logging for security audits
- [ ] Set up error monitoring (Sentry, etc.)

## 🎨 Customization

### Theme Colors
Edit `tailwind.config.ts`:
```typescript
colors: {
  pearl: { 50: '#FAFAFA', ... },
  gold: { DEFAULT: '#D4AF37', ... },
}
```

### Product Data
Edit `lib/products.json` to add/modify products:
```json
{
  "sku": "UNIQUE-SKU",
  "brand": "Brand Name",
  "name": "Product Name",
  "price": 12500,
  "material": "Platinum",
  "carat": 1.5,
  "clarity": "VVS1",
  "dimensions": "6mm x 6mm",
  "stock": 8,
  "images": ["url1", "url2"],
  "description": "..."
}
```

## 🐛 Troubleshooting

### CORS Errors
**Problem:** Browser blocks requests to backend  
**Solution:** Configure backend CORS headers:
```javascript
Access-Control-Allow-Origin: https://your-frontend.com
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Headers: Content-Type
```

### Mixed Content Warnings
**Problem:** HTTPS frontend calling HTTP backend  
**Solution:** Use HTTPS for backend or proxy through frontend

### Encryption Fails
**Problem:** `encrypt.encrypt()` returns `false`  
**Solution:** Verify public key format (must include BEGIN/END markers)

### Cart Not Persisting
**Problem:** Cart clears on refresh  
**Solution:** This is by design (no persistence). Add localStorage if needed.

## 📄 License

Private research application for restricted group use only.

## 🤝 Support

For issues or questions, please contact the development team.

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS
