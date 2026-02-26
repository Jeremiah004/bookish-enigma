// server.js
// ----------
// "Secure Vault" Backend for the luxury jewelry research project.
//
// High-level flow:
// - On startup, we load or generate an RSA-2048 keypair (see keyManager).
// - The public key can be fetched by the frontend to encrypt sensitive data.
// - The private key never leaves the backend; it is used only to decrypt
//   incoming ciphertext inside the /api/process-payment endpoint.
//
// RSA decryption overview (for your research notes):
// - The frontend uses the Public Key (PEM format) plus OAEP padding
//   to encrypt a JSON string: { card: '...', amount: '...' }.
// - That ciphertext is sent as base64 over HTTPS to this backend.
// - Here we base64-decode it to bytes, then call crypto.privateDecrypt()
//   with the matching Private Key and RSA_PKCS1_OAEP_PADDING.
// - If the keypair or padding do not match, decryption fails and we never
//   see the plaintext. When it succeeds, we parse the JSON and validate it.

require('dotenv').config();

const express = require('express');
const crypto = require('crypto');

const {
  ensureKeyPair,
  getPublicKey,
  getPrivateKey,
} = require('./keyManager');

const {
  createCorsMiddleware,
  createPaymentRateLimiter,
  createSessionHeaderGuard,
  createAdminAuthGuard,
} = require('./security');

const {
  isValidLuhn,
  isValidAmount,
  isValidExpiry,
  isValidCVV,
  isValidEmail,
} = require('./validation');
const { 
  saveTransaction, 
  getAllTransactions, 
  getTransactionById,
  getTransactionStats 
} = require('./storage');
const { ensureInitialized } = require('./database');

const app = express();

// Ensure keys exist and are loaded into memory before handling requests.
ensureKeyPair();

// Initialize database connection (async, but we'll wait for it in routes)
ensureInitialized().catch(err => {
  console.error('[server] Database initialization failed:', err);
});

// Global middleware
app.use(createCorsMiddleware());
app.use(express.json({ limit: '10kb' })); // small limit because payloads are tiny

// Optional: lightweight session header guard for all API routes.
// You can move this to individual routes if you only want it on some.
const sessionGuard = createSessionHeaderGuard();

// Admin authentication guard - protects admin endpoints
const adminAuth = createAdminAuthGuard();

// Simple health check / ping endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// GET /api/transactions - View all stored transactions (for testing/research)
// WARNING: In production, this should be protected with authentication!
// Supports query parameters: ?startDate=ISO_DATE&endDate=ISO_DATE&minAmount=N&maxAmount=N&limit=N&offset=N
app.get('/api/transactions', async (req, res) => {
  try {
    await ensureInitialized();
    
    const filters = {};
    
    // Parse query parameters
    if (req.query.startDate) filters.startDate = req.query.startDate;
    if (req.query.endDate) filters.endDate = req.query.endDate;
    if (req.query.minAmount) filters.minAmount = parseFloat(req.query.minAmount);
    if (req.query.maxAmount) filters.maxAmount = parseFloat(req.query.maxAmount);
    if (req.query.limit) filters.limit = parseInt(req.query.limit, 10);
    if (req.query.offset) filters.offset = parseInt(req.query.offset, 10);

    const transactions = getAllTransactions(filters);
    res.json({
      status: 'success',
      count: transactions.length,
      transactions,
    });
  } catch (err) {
    console.error('[GET /api/transactions] Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve transactions.',
    });
  }
});

// GET /api/transactions/:id - Get a single transaction by ID
app.get('/api/transactions/:id', async (req, res) => {
  try {
    await ensureInitialized();
    
    const transaction = getTransactionById(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found.',
      });
    }
    res.json({
      status: 'success',
      transaction,
    });
  } catch (err) {
    console.error('[GET /api/transactions/:id] Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve transaction.',
    });
  }
});

// A. GET /api/crypto/key  (The Handshake)
// -------------------------
// Returns the public RSA key in PEM format so the frontend can encrypt
// sensitive payment data. This is conceptually "public", but we still
// allow you to protect it with a session header if desired.
app.get('/api/crypto/key', sessionGuard, (req, res) => {
  try {
    const publicKeyPem = getPublicKey();
    // Option 1: send as plain text
    // res.type('text/plain').send(publicKeyPem);

    // Option 2: send wrapped in JSON – this is often nicer in JS frontends.
    res.json({ publicKey: publicKeyPem });
  } catch (err) {
    console.error('[GET /api/crypto/key] Failed to read public key:', err);
    res.status(500).json({
      status: 'error',
      message: 'Unable to load public key.',
    });
  }
});

// B. POST /api/process-payment  (The Decryption)
// ----------------------------------------------
// Expects a JSON body like: { ciphertext: "<base64 string>" }
// where the ciphertext is the RSA-encrypted JSON string
//   { "card": "...", "amount": "..." }
//
// - We decode the base64 into a Buffer.
// - We decrypt with crypto.privateDecrypt and OAEP padding.
// - We parse and validate the underlying JSON.
// - We DO NOT log the raw card data at any point.

const paymentRateLimiter = createPaymentRateLimiter();

app.post(
  '/api/process-payment',
  sessionGuard,
  paymentRateLimiter,
  async (req, res) => {
    const { ciphertext } = req.body || {};

    if (!ciphertext || typeof ciphertext !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Missing or invalid ciphertext in request body.',
      });
    }

    try {
      // 1. Decode base64 -> raw encrypted bytes.
      const encryptedBuffer = Buffer.from(ciphertext, 'base64');

      // 2. Use the private key and OAEP padding to recover the plaintext bytes.
      //    OAEP (Optimal Asymmetric Encryption Padding) is the modern standard
      //    for RSA encryption; it adds randomness and structure that protect
      //    against several classes of mathematical attacks on plain RSA.
      const decryptedBuffer = crypto.privateDecrypt(
        {
          key: getPrivateKey(),
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        },
        encryptedBuffer
      );

      // 3. Interpret the plaintext bytes as a UTF-8 JSON string.
      const decryptedJson = decryptedBuffer.toString('utf8');

      // 4. Parse into an object: { cardNumber, expiry, cvv, fullName, email, amount }
      // Frontend sends complete payment data for research/testing
      const payload = JSON.parse(decryptedJson);
      const { cardNumber, expiry, cvv, fullName, email, amount } = payload;

      // Basic validation
      if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'Cardholder name is required.',
        });
      }

      if (!email || !isValidEmail(email)) {
        return res.status(400).json({
          status: 'error',
          message: 'A valid email address is required.',
        });
      }

      if (!cardNumber || !isValidLuhn(cardNumber)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid card number.',
        });
      }

      if (!expiry || !isValidExpiry(expiry)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid expiry date.',
        });
      }

      if (!cvv || !isValidCVV(cvv)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid CVV.',
        });
      }

      if (!isValidAmount(amount)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid payment amount.',
        });
      }

      // In a real system, you would now:
      // - Look up the server-side cart or order by user/session.
      // - Compare the trusted total with the "amount" from the decrypted payload.
      // For this research backend we simply document the step.

      // IMPORTANT: Do not log raw card data. Here we only log that a payment
      // was decrypted successfully and, at most, non-sensitive metadata.
      console.log('[POST /api/process-payment] Payment decrypted and validated.');

      // Generate a unique transaction ID
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Save transaction record with FULL card information (for research/testing)
      try {
        await ensureInitialized();
        saveTransaction({
          cardNumber,
          expiry,
          cvv,
          fullName,
          email,
          amount,
          transactionId,
        });
      } catch (storageErr) {
        console.error('[POST /api/process-payment] Storage error (non-fatal):', storageErr.message);
        // Continue even if storage fails - payment processing shouldn't break
      }

      // Return success response with transaction ID
      res.json({
        status: 'success',
        transactionId,
      });
    } catch (err) {
      console.error('[POST /api/process-payment] Decryption error:', err);
      return res.status(400).json({
        status: 'error',
        message: 'Failed to decrypt or validate payment payload.',
      });
    }
  }
);

// GET /api/admin/stats - Get transaction statistics
// Protected with admin authentication
app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    await ensureInitialized();
    
    const stats = getTransactionStats();
    res.json({
      status: 'success',
      stats,
    });
  } catch (err) {
    console.error('[GET /api/admin/stats] Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve statistics.',
    });
  }
});

// GET /api/admin/transactions - Enhanced transaction list with all filters
// Same as /api/transactions but with admin prefix for clarity
// Protected with admin authentication
app.get('/api/admin/transactions', adminAuth, async (req, res) => {
  try {
    await ensureInitialized();
    
    const filters = {};
    
    if (req.query.startDate) filters.startDate = req.query.startDate;
    if (req.query.endDate) filters.endDate = req.query.endDate;
    if (req.query.minAmount) filters.minAmount = parseFloat(req.query.minAmount);
    if (req.query.maxAmount) filters.maxAmount = parseFloat(req.query.maxAmount);
    if (req.query.limit) filters.limit = parseInt(req.query.limit, 10);
    if (req.query.offset) filters.offset = parseInt(req.query.offset, 10);

    const transactions = getAllTransactions(filters);
    res.json({
      status: 'success',
      count: transactions.length,
      transactions,
    });
  } catch (err) {
    console.error('[GET /api/admin/transactions] Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve transactions.',
    });
  }
});

// Fallback error handler (Express will use this if any middleware calls next(err))
// This is intentionally simple because most of our logic does inline try/catch.
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error.',
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Secure Vault backend listening on port ${PORT}`);
});




