## Secure Vault Backend (Jewelry Research)

This is a small Node.js / Express backend designed for a **luxury jewelry research** project.
It demonstrates how to treat card data as if it were production-grade, using **RSA-2048** asymmetric
encryption and a "Secure Vault" style architecture.

### Core Concepts

- **Master Key (Private Key)**: Stored only on the backend in PEM format. It never leaves the server
  and is used exclusively for `crypto.privateDecrypt()` operations.
- **Padlock (Public Key)**: Exposed via an API so the frontend can encrypt sensitive JSON
  (e.g. `{ card: '...', amount: '...' }`) using RSA with OAEP padding.
- **Watchtower (Middleware)**: CORS restrictions, rate-limiting, and an optional session header guard
  are used to make this "research SaaS" more realistic.

### Files Overview

- `src/keyManager.js` – Generates and manages the RSA-2048 keypair.
  - On startup, it checks for `private.pem` and `public.pem` (paths configurable via env).
  - If they do not exist, it generates a new keypair using Node's built-in `crypto` module.
  - The private key is loaded into memory and never returned by any route.
- `src/security.js` – CORS, rate limiter, and optional session header guard.
- `src/validation.js` – Basic card validation and amount sanity check.
- `src/storage.js` – File-based transaction storage (for testing/research).
  - Saves transactions to `data/transactions.json`
  - **NEVER stores full card numbers** - only masked (last 4 digits) and hashed
  - In production, replace with a proper database (PostgreSQL, MongoDB, etc.)
- `src/server.js` – Express app with:
  - `GET /api/crypto/key`
  - `POST /api/process-payment`
  - `GET /api/transactions` (for viewing stored transactions - testing only)

### Environment Variables

Create a `.env` file in the project root (`kreditkarte`) with values like:

```bash
PORT=4000

PRIVATE_KEY_PATH=./keys/private.pem
PUBLIC_KEY_PATH=./keys/public.pem

FRONTEND_ORIGIN=https://jewelry-research-app.vercel.app

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=5

REQUIRE_SESSION_HEADER=true
SESSION_HEADER_NAME=x-session-id
```

> For local development you can set `FRONTEND_ORIGIN=http://localhost:3000` or similar.

### APIs

- **GET `/api/crypto/key`**  
  Returns `{ publicKey: "<PEM string>" }`. The frontend uses this PEM to encrypt a JSON string
  with RSA-OAEP.

- **POST `/api/process-payment`**  
  Expects:
  ```json
  {
    "ciphertext": "<base64-encoded RSA ciphertext>"
  }
  ```
  Workflow:
  1. Base64 decoded into a `Buffer`.
  2. Decrypted using `crypto.privateDecrypt` with `RSA_PKCS1_OAEP_PADDING`.
  3. Parsed into JSON: `{ "card": "...", "amount": "..." }`.
  4. Validated via basic card check and amount sanity check.
  5. **Saved to storage** (see `data/transactions.json`) - only masked card + hash, never full card number.
  6. Logs only that a payment was decrypted successfully (never the card data).
  7. Returns:  
     ```json
     { "status": "success", "transactionId": "TXN-1234567890-ABC123" }
     ```

- **GET `/api/transactions`**  
  Returns all stored transaction records (for testing/research purposes).
  ```json
  {
    "status": "success",
    "count": 5,
    "transactions": [
      {
        "transactionId": "TXN-1234567890-ABC123",
        "timestamp": "2024-01-15T10:30:00.000Z",
        "amount": 12500,
        "cardholderName": "N/A",
        "cardMasked": "****1234",
        "cardHash": "abc123..." // SHA-256 hash for duplicate detection
      }
    ]
  }
  ```
  ⚠️ **WARNING**: In production, this endpoint should require authentication!

### Running Locally

1. Install Node.js (LTS) from the official website if you do not already have it.
2. From the `kreditkarte` folder:
   ```bash
   npm install
   npm run dev
   ```
3. The server will start on `http://localhost:4000` (or the `PORT` you configure).

You can now:
- Fetch the public key from `GET /api/crypto/key`.
- Encrypt card data on the frontend with RSA-OAEP.
- Send the base64 ciphertext to `POST /api/process-payment` and receive a transaction ID.
- View stored transactions at `GET /api/transactions` (all transactions saved to `data/transactions.json`).

### Data Storage

**Transaction records are saved to:** `kreditkarte/data/transactions.json`

**What gets stored (FULL card information for research/testing):**
- ✅ Transaction ID (unique)
- ✅ Timestamp
- ✅ Amount
- ✅ Cardholder name
- ✅ **Full card number** (complete, unencrypted)
- ✅ **Expiry date** (MM/YY format)
- ✅ **CVV code** (3-4 digits)

**Example transaction record:**
```json
{
  "transactionId": "TXN-1234567890-ABC123",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "amount": 12500,
  "cardholderName": "John Smith",
  "cardNumber": "4111111111111111",
  "expiry": "12/25",
  "cvv": "123"
}
```

**⚠️ SECURITY WARNING:** This stores complete, unencrypted card data for **research/testing purposes only**. 
- This violates PCI DSS requirements
- Never use this in production
- The `data/` folder is in `.gitignore` - never commit this file
- In production: use tokenization, never store CVV, encrypt at rest, use proper databases




