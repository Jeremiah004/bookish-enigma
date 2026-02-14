// keyManager.js
// ---------------
// This module is responsible for the full lifecycle of the RSA-2048 keypair.
// It will:
// - Read PRIVATE_KEY_PATH and PUBLIC_KEY_PATH from environment variables.
// - Generate a new RSA-2048 key pair if the PEM files do not exist.
// - Keep the private key in memory and never expose it to any API response.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Resolve key locations. In production these should point to a secure folder
// with OS-level permissions locking them down.
const PRIVATE_KEY_PATH =
  process.env.PRIVATE_KEY_PATH ||
  path.join(__dirname, '..', 'keys', 'private.pem');

const PUBLIC_KEY_PATH =
  process.env.PUBLIC_KEY_PATH ||
  path.join(__dirname, '..', 'keys', 'public.pem');

let cachedPrivateKey = null;
let cachedPublicKey = null;

function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Generates a fresh RSA-2048 keypair and persists it as PEM files.
 * The private key is written with restrictive permissions and then
 * immediately re-loaded into memory.
 */
function generateAndPersistKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  ensureDirectoryExists(PRIVATE_KEY_PATH);
  ensureDirectoryExists(PUBLIC_KEY_PATH);

  // On POSIX systems the mode 0o600 prevents other users from reading the file.
  // On Windows the mode is advisory but it's still good hygiene.
  fs.writeFileSync(PRIVATE_KEY_PATH, privateKey, { mode: 0o600 });
  fs.writeFileSync(PUBLIC_KEY_PATH, publicKey, { mode: 0o644 });

  cachedPrivateKey = privateKey;
  cachedPublicKey = publicKey;

  console.log('[keyManager] Generated new RSA-2048 keypair.');
}

/**
 * Loads the keypair from environment variables, disk, or generates a new pair.
 * Priority: Environment variables > File paths > Generate new
 */
function ensureKeyPair() {
  // First, check for environment variables (production deployment)
  if (process.env.PRIVATE_KEY && process.env.PUBLIC_KEY) {
    try {
      // If keys are base64 encoded, decode them
      cachedPrivateKey = process.env.PRIVATE_KEY.startsWith('-----BEGIN')
        ? process.env.PRIVATE_KEY
        : Buffer.from(process.env.PRIVATE_KEY, 'base64').toString('utf8');
      
      cachedPublicKey = process.env.PUBLIC_KEY.startsWith('-----BEGIN')
        ? process.env.PUBLIC_KEY
        : Buffer.from(process.env.PUBLIC_KEY, 'base64').toString('utf8');
      
      console.log('[keyManager] Loaded RSA keypair from environment variables.');
      return;
    } catch (err) {
      console.error('[keyManager] Error loading keys from environment:', err.message);
      // Fall through to file-based or generation
    }
  }

  // Second, try loading from file paths
  const privateExists = fs.existsSync(PRIVATE_KEY_PATH);
  const publicExists = fs.existsSync(PUBLIC_KEY_PATH);

  if (privateExists && publicExists) {
    cachedPrivateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
    cachedPublicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
    console.log('[keyManager] Loaded RSA keypair from disk.');
    return;
  }

  // Finally, generate a new pair if nothing exists
  if (!privateExists || !publicExists) {
    generateAndPersistKeyPair();
    return;
  }
}

function getPrivateKey() {
  if (!cachedPrivateKey) {
    ensureKeyPair();
  }
  return cachedPrivateKey;
}

function getPublicKey() {
  if (!cachedPublicKey) {
    ensureKeyPair();
  }
  return cachedPublicKey;
}

module.exports = {
  ensureKeyPair,
  getPrivateKey,
  getPublicKey,
  PRIVATE_KEY_PATH,
  PUBLIC_KEY_PATH,
};



