# Example Backend Implementation

This directory contains a reference implementation of the backend API required for the Maison luxury jewelry frontend.

## Quick Start

```bash
cd example-backend
npm install
npm start
```

The backend will start on `http://localhost:3001`

## API Endpoints

### 1. GET /api/crypto/key
Returns the RSA public key for encrypting payment data.

**Response:**
```json
{
  "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjAN...-----END PUBLIC KEY-----"
}
```

### 2. POST /api/process-payment
Processes encrypted payment data.

**Request:**
```json
{
  "ciphertext": "base64-encoded-encrypted-data"
}
```

**Response (Success):**
```json
{
  "success": true,
  "transactionId": "txn_1234567890"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Payment processing failed"
}
```

## Environment Variables

Create a `.env` file:

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

## Security Notes

⚠️ **This is a demonstration implementation only!**

In production:
- Store RSA keys in secure vault (AWS Secrets Manager, HashiCorp Vault)
- Implement proper payment gateway integration (Stripe, PayPal, etc.)
- Add rate limiting and DDoS protection
- Use HTTPS only (no HTTP in production)
- Implement comprehensive logging and monitoring
- Add request validation and sanitization
- Store transaction records in secure database
- Implement fraud detection

## Testing

Test the encryption flow:

```bash
# Start the backend
npm start

# In another terminal, test the public key endpoint
curl http://localhost:3001/api/crypto/key

# Test payment processing (with example encrypted data)
curl -X POST http://localhost:3001/api/process-payment \
  -H "Content-Type: application/json" \
  -d '{"ciphertext":"example-encrypted-data"}'
```

## Integration with Frontend

1. Update frontend `.env.local`:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
   ```

2. Start both servers:
   ```bash
   # Terminal 1: Backend
   cd example-backend
   npm start

   # Terminal 2: Frontend
   cd ..
   npm run dev
   ```

3. Test the complete flow at `http://localhost:3000`

## Production Deployment

DO NOT use this example implementation in production as-is. Instead:

1. **Key Management:**
   - Generate keys once, store in secure vault
   - Implement key rotation strategy
   - Never commit keys to git

2. **Payment Processing:**
   - Integrate with real payment gateway
   - Implement 3D Secure for card authentication
   - Add fraud detection
   - Store transaction logs securely

3. **Infrastructure:**
   - Deploy behind load balancer
   - Use HTTPS with valid SSL certificate
   - Implement rate limiting
   - Add WAF (Web Application Firewall)
   - Set up monitoring and alerting

4. **Compliance:**
   - Follow PCI DSS guidelines if storing card data
   - Implement data retention policies
   - Add audit logging
   - Regular security assessments

See `DEPLOYMENT_GUIDE.md` for detailed production setup instructions.
