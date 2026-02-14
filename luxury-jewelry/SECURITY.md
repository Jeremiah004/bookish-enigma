# Security Architecture - Maison Luxury Jewelry

## Overview
This document outlines the security architecture and implementation details of the custom payment encryption system.

---

## Threat Model

### Protected Assets
1. **Customer Payment Information**
   - Credit card numbers
   - CVV codes
   - Expiry dates
   - Cardholder names

2. **Transaction Data**
   - Purchase amounts
   - Order details
   - Customer identity

### Threat Actors
- **External Attackers:** Network sniffing, man-in-the-middle attacks
- **Malicious Insiders:** Backend compromise
- **Client-Side Attacks:** XSS, script injection

### Attack Vectors
- Network interception (TLS bypass)
- Client-side memory dumps
- Backend database breach
- Browser developer tools inspection
- Replay attacks

---

## Security Architecture

### 1. Asymmetric Encryption (RSA-2048)

**Why RSA?**
- Public key can be safely distributed
- Only backend with private key can decrypt
- Industry-standard for payment data encryption

**Key Generation:**
```javascript
// Backend generates once at startup
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,  // Minimum recommended by NIST
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});
```

**Key Distribution:**
- Public key fetched from backend at checkout initialization
- Transmitted over HTTPS (TLS 1.2+)
- No caching to prevent stale keys

**Encryption Process:**
```typescript
// Frontend (lib/payment.ts)
const encrypt = new JSEncrypt();
encrypt.setPublicKey(publicKey);
const ciphertext = encrypt.encrypt(JSON.stringify(paymentData));
```

**Decryption Process:**
```javascript
// Backend only
const decrypted = crypto.privateDecrypt(
  { key: privateKey, padding: crypto.constants.RSA_PKCS1_PADDING },
  Buffer.from(ciphertext, 'base64')
);
```

---

### 2. Frontend Validation

**Purpose:** Prevent unnecessary encrypted requests with invalid data

**Card Number Validation (Luhn Algorithm):**
```typescript
export const luhnCheck = (cardNumber: string): boolean => {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};
```

**Expiry Date Validation:**
- Format: MM/YY
- Month: 1-12
- Year: Current or future
- Prevents expired card submissions

**CVV Validation:**
- Format: 3-4 digits
- No special characters
- Appropriate length for card type

---

### 3. Memory Management

**Critical Security Requirement:** Sensitive data must never persist in browser memory

**Implementation:**
```typescript
// After successful encryption
const ciphertext = encryptPaymentData(paymentData, publicKey);

// IMMEDIATELY clear form state
setFormData({
  fullName: '',
  cardNumber: '',
  expiry: '',
  cvv: '',
});

// Original payment data object goes out of scope and is garbage collected
```

**Why This Matters:**
- Prevents memory dumps from revealing payment data
- Reduces window of exposure for XSS attacks
- Follows PCI DSS guideline: "Don't store what you don't need"

---

### 4. Transport Security

**HTTPS Requirements:**
- TLS 1.2 minimum (1.3 recommended)
- Valid SSL certificate on both frontend and backend
- HSTS headers enabled
- No mixed content (all resources over HTTPS)

**CORS Configuration:**
```javascript
// Backend
app.use(cors({
  origin: 'https://your-production-domain.com',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));
```

**Environment-Based Enforcement:**
```typescript
// Frontend checks
if (typeof window !== 'undefined' && 
    window.location.protocol !== 'https:' && 
    process.env.NODE_ENV === 'production') {
  console.error('HTTPS required in production');
}
```

---

### 5. Data Flow Diagram

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │
         │ 1. GET /api/crypto/key (HTTPS)
         ▼
┌─────────────────┐
│   Backend API   │
└────────┬────────┘
         │
         │ 2. Returns RSA Public Key
         ▼
┌─────────────────┐
│   User Browser  │
│  (Client-Side)  │
│                 │
│ 3. User enters  │
│    card details │
│                 │
│ 4. Frontend     │
│    validation   │
│    (Luhn, etc.) │
│                 │
│ 5. Encrypt with │
│    public key   │
│                 │
│ 6. Clear memory │
└────────┬────────┘
         │
         │ 7. POST /api/process-payment (HTTPS)
         │    Body: { ciphertext: "..." }
         ▼
┌─────────────────┐
│   Backend API   │
│                 │
│ 8. Decrypt with │
│    private key  │
│                 │
│ 9. Process      │
│    payment      │
│                 │
│ 10. Return      │
│     result      │
└─────────────────┘
```

---

## Security Best Practices

### DO ✅

1. **Always use HTTPS**
   - Development: Use ngrok or localhost with self-signed cert
   - Production: Valid SSL certificate from CA

2. **Validate input before encryption**
   - Saves server resources
   - Provides immediate user feedback
   - Prevents malformed data from being encrypted

3. **Clear sensitive data immediately**
   - After encryption, clear form state
   - Don't store in localStorage/sessionStorage
   - Let JavaScript garbage collection handle cleanup

4. **Rotate RSA keys regularly**
   - Generate new key pair monthly (recommended)
   - Store old private keys for 90 days (for refunds/disputes)
   - Update public key endpoint atomically

5. **Monitor and log securely**
   - Log transaction IDs, amounts, timestamps
   - NEVER log card numbers, CVV, or decrypted data
   - Use structured logging for easy searching

6. **Implement rate limiting**
   ```javascript
   // Backend
   const rateLimit = require('express-rate-limit');
   
   const paymentLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 5, // 5 requests per window
     message: 'Too many payment attempts'
   });
   
   app.post('/api/process-payment', paymentLimiter, handlePayment);
   ```

### DON'T ❌

1. **Never log sensitive data**
   ```javascript
   // BAD ❌
   console.log('Payment data:', paymentData);
   
   // GOOD ✅
   console.log('Payment attempt:', { amount: paymentData.amount });
   ```

2. **Never store private keys in code**
   ```javascript
   // BAD ❌
   const privateKey = "-----BEGIN RSA PRIVATE KEY-----\nMIIE...";
   
   // GOOD ✅
   const privateKey = process.env.RSA_PRIVATE_KEY;
   ```

3. **Never skip HTTPS in production**
   ```typescript
   // BAD ❌
   const backendUrl = 'http://api.example.com';
   
   // GOOD ✅
   const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
   // And enforce HTTPS in env var
   ```

4. **Never trust client-side validation alone**
   - Always validate on backend after decryption
   - Frontend validation is for UX, not security

5. **Never reuse initialization vectors**
   - RSA with PKCS1 padding handles this automatically
   - If switching to AES, ensure unique IV per transaction

---

## Compliance Considerations

### PCI DSS Relevance

While this implementation doesn't require full PCI DSS compliance (card data never touches your servers in plaintext), following these principles helps:

- **Requirement 3:** Protect stored cardholder data
  - ✅ Data encrypted in transit
  - ✅ No storage of card data on frontend

- **Requirement 4:** Encrypt transmission of cardholder data
  - ✅ RSA-2048 encryption
  - ✅ HTTPS/TLS for all communications

- **Requirement 6:** Develop secure systems
  - ✅ Input validation
  - ✅ No sensitive data in logs

**Note:** If you process, store, or transmit cardholder data, consult with a QSA (Qualified Security Assessor) for full PCI DSS compliance.

---

## Incident Response

### If Private Key is Compromised

1. **Immediate Actions:**
   - Generate new RSA key pair
   - Update backend to use new private key
   - Public key endpoint automatically serves new key
   - Rotate within minutes, not hours

2. **Investigation:**
   - Review server access logs
   - Check for unauthorized API calls
   - Analyze recent transactions for fraud

3. **Notification:**
   - Inform payment processor
   - Contact affected customers (if data exposure confirmed)
   - Document incident for compliance

### If Backend is Breached

1. **Isolate:**
   - Take backend offline immediately
   - Preserve logs and memory dumps

2. **Assess:**
   - Determine what data was accessed
   - Review decrypted payment data exposure

3. **Recover:**
   - Restore from clean backup
   - Regenerate all keys
   - Update all credentials

4. **Prevent:**
   - Implement additional monitoring
   - Add WAF rules
   - Review access controls

---

## Testing Security

### Manual Testing

1. **Network Interception Test:**
   ```bash
   # Use Wireshark or mitmproxy to verify encryption
   # Should see base64 ciphertext, not plaintext card data
   ```

2. **Browser DevTools Inspection:**
   - Open Network tab
   - Submit payment
   - Verify payload contains only ciphertext
   - Check that no plaintext card data appears

3. **Memory Inspection:**
   - Open browser console after payment
   - Run: `window.performance.memory`
   - Verify form state is cleared

### Automated Testing

```typescript
// Example test (using Jest)
import { luhnCheck, encryptPaymentData } from '@/lib/payment';

describe('Payment Security', () => {
  test('luhnCheck rejects invalid cards', () => {
    expect(luhnCheck('1234567890123456')).toBe(false);
  });
  
  test('luhnCheck accepts valid cards', () => {
    expect(luhnCheck('4532015112830366')).toBe(true); // Valid test card
  });
  
  test('encryption produces different output for same input', () => {
    const data = { cardNumber: '1234', cvv: '123', ... };
    const cipher1 = encryptPaymentData(data, publicKey);
    const cipher2 = encryptPaymentData(data, publicKey);
    // RSA PKCS1 padding includes randomness
    expect(cipher1).not.toBe(cipher2);
  });
});
```

---

## Security Checklist

Before going to production:

- [ ] HTTPS enabled on frontend (valid SSL cert)
- [ ] HTTPS enabled on backend (valid SSL cert)
- [ ] CORS restricted to frontend domain only
- [ ] RSA keys generated securely (2048+ bits)
- [ ] Private key stored in environment variable, not code
- [ ] Frontend validation implemented (Luhn, expiry, CVV)
- [ ] Memory cleared after encryption
- [ ] No payment data in logs
- [ ] Rate limiting on payment endpoint
- [ ] Error messages don't leak sensitive info
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
- [ ] Dependency audit clean (`npm audit`)
- [ ] Penetration testing completed
- [ ] Incident response plan documented

---

## References

- [NIST SP 800-57: Key Management](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PCI DSS v4.0](https://www.pcisecuritystandards.org/)
- [RSA Cryptography Standard (PKCS #1)](https://datatracker.ietf.org/doc/html/rfc8017)

---

**Last Updated:** February 2026  
**Review Schedule:** Quarterly
