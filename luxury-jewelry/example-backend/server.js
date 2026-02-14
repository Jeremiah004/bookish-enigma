const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middleware
app.use(express.json());
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Generate RSA key pair (in production, load from secure storage)
let publicKey, privateKey;

function generateKeyPair() {
  console.log('Generating RSA key pair...');
  const { publicKey: pubKey, privateKey: privKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  
  publicKey = pubKey;
  privateKey = privKey;
  console.log('RSA keys generated successfully');
  console.log('Public Key (first 100 chars):', publicKey.substring(0, 100) + '...');
}

// Initialize keys on startup
generateKeyPair();

// Endpoint 1: Return public key
app.get('/api/crypto/key', (req, res) => {
  console.log('Public key requested');
  res.json({ publicKey });
});

// Endpoint 2: Process payment
app.post('/api/process-payment', async (req, res) => {
  try {
    const { ciphertext } = req.body;
    
    if (!ciphertext) {
      return res.status(400).json({
        success: false,
        error: 'Missing ciphertext in request body'
      });
    }
    
    console.log('Payment processing initiated');
    console.log('Ciphertext length:', ciphertext.length);
    
    // Decrypt the payment data
    let decrypted;
    try {
      decrypted = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_PADDING
        },
        Buffer.from(ciphertext, 'base64')
      );
    } catch (decryptError) {
      console.error('Decryption failed:', decryptError.message);
      return res.status(400).json({
        success: false,
        error: 'Invalid encrypted data'
      });
    }
    
    // Parse the decrypted payment data
    let paymentData;
    try {
      paymentData = JSON.parse(decrypted.toString());
    } catch (parseError) {
      console.error('JSON parse failed:', parseError.message);
      return res.status(400).json({
        success: false,
        error: 'Invalid payment data format'
      });
    }
    
    // Log transaction (NEVER log card details in production!)
    console.log('Payment data received:');
    console.log('- Amount:', paymentData.amount);
    console.log('- Cardholder:', paymentData.fullName);
    console.log('- Card (masked):', maskCardNumber(paymentData.cardNumber));
    
    // Validate payment data
    if (!paymentData.cardNumber || !paymentData.cvv || !paymentData.expiry || !paymentData.fullName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required payment fields'
      });
    }
    
    // In production, integrate with payment gateway here:
    // - Stripe: stripe.charges.create()
    // - PayPal: paypal.payment.create()
    // - Square: square.payments.create()
    
    // Simulate payment processing
    await simulatePaymentProcessing();
    
    // Generate transaction ID
    const transactionId = 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    console.log('Payment successful:', transactionId);
    
    res.json({
      success: true,
      transactionId
    });
    
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Helper: Mask card number for logging
function maskCardNumber(cardNumber) {
  if (!cardNumber) return 'N/A';
  const cleaned = cardNumber.replace(/\s/g, '');
  if (cleaned.length < 4) return '****';
  return '****' + cleaned.slice(-4);
}

// Helper: Simulate payment processing delay
function simulatePaymentProcessing() {
  return new Promise(resolve => setTimeout(resolve, 1500));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('Maison Luxury Jewelry - Example Backend');
  console.log('='.repeat(50));
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Accepting requests from: ${FRONTEND_URL}`);
  console.log('');
  console.log('⚠️  WARNING: This is a demonstration server only!');
  console.log('   DO NOT use in production without proper security measures.');
  console.log('');
  console.log('Available endpoints:');
  console.log(`  GET  /api/crypto/key        - Returns RSA public key`);
  console.log(`  POST /api/process-payment   - Processes encrypted payment`);
  console.log(`  GET  /health                - Health check`);
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});
