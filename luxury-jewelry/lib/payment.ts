export interface PaymentData {
  cardNumber: string;
  expiry: string;
  cvv: string;
  fullName: string;
  amount: number;
}

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

export const validateExpiryDate = (expiry: string): boolean => {
  const match = expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;

  const month = parseInt(match[1], 10);
  const year = parseInt(match[2], 10) + 2000;

  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return false;
  }

  return true;
};

export const validateCVV = (cvv: string): boolean => {
  return /^\d{3,4}$/.test(cvv);
};

export const formatCardNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  const groups = digits.match(/.{1,4}/g);
  return groups ? groups.join(' ') : digits;
};

export const formatExpiry = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length >= 2) {
    return digits.slice(0, 2) + '/' + digits.slice(2, 4);
  }
  return digits;
};

const SESSION_HEADER_NAME = 'x-session-id';
const SESSION_HEADER_VALUE = 'research-session';

export const fetchPublicKey = async (backendUrl: string): Promise<string> => {
  try {
    const url = `${backendUrl}/api/crypto/key`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        [SESSION_HEADER_NAME]: SESSION_HEADER_VALUE,
      },
    });

    if (!response.ok) {
      const statusText = response.statusText || `HTTP ${response.status}`;
      let errorMessage = `Failed to fetch public key: ${statusText}`;
      
      if (response.status === 404) {
        errorMessage = `Backend endpoint not found (404). Check if ${url} exists.`;
      } else if (response.status === 0 || response.status >= 500) {
        errorMessage = `Backend server error (${response.status}). The server may be down or unreachable.`;
      } else if (response.status === 403 || response.status === 401) {
        errorMessage = `Access denied (${response.status}). Check CORS and authentication settings.`;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data || !data.publicKey) {
      throw new Error('Invalid response: public key not found in response');
    }
    
    // Sanitize the public key: ensure it's a string and remove any potential encoding issues
    let publicKey = String(data.publicKey).trim();
    
    // Normalize line endings (handle \r\n, \n, \r)
    publicKey = publicKey.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Remove any zero-width or invisible Unicode characters that might cause issues
    // This includes zero-width spaces, non-breaking spaces, etc.
    publicKey = publicKey.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '');
    
    // Ensure proper PEM format with newlines
    // If the key doesn't have newlines but should (between header and content), add them
    if (publicKey.includes('BEGIN PUBLIC KEY-----') && !publicKey.includes('BEGIN PUBLIC KEY-----\n')) {
      publicKey = publicKey.replace('BEGIN PUBLIC KEY-----', 'BEGIN PUBLIC KEY-----\n');
    }
    if (publicKey.includes('-----END PUBLIC KEY') && !publicKey.includes('\n-----END PUBLIC KEY')) {
      publicKey = publicKey.replace('-----END PUBLIC KEY', '\n-----END PUBLIC KEY');
    }
    
    // Validate it looks like a PEM key
    if (!publicKey.includes('BEGIN') || !publicKey.includes('END')) {
      console.warn('Public key may not be in PEM format, but continuing...');
    }
    
    // Log a sample for debugging (first 100 chars only)
    console.log('Received public key (first 100 chars):', publicKey.substring(0, 100));
    
    return publicKey;
  } catch (error) {
    // Provide more specific error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Network error: Cannot connect to backend at ${backendUrl}. Check if the backend is running and the URL is correct.`);
    }
    
    if (error instanceof Error) {
      throw error; // Re-throw with the improved message from above
    }
    
    throw new Error(`Key fetch error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper: convert a PEM-formatted SPKI public key into an ArrayBuffer (DER)
const pemToArrayBuffer = (pem: string): ArrayBuffer => {
  if (!pem || typeof pem !== 'string') {
    throw new Error('Invalid PEM string: must be a non-empty string');
  }

  // Clean the PEM string more thoroughly
  let b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/gi, '')
    .replace(/-----END PUBLIC KEY-----/gi, '')
    .replace(/-----BEGIN RSA PUBLIC KEY-----/gi, '')
    .replace(/-----END RSA PUBLIC KEY-----/gi, '')
    // Remove all whitespace (spaces, tabs, newlines, carriage returns, etc.)
    .replace(/\s+/g, '')
    // Remove any non-base64 characters (just in case) - be more permissive
    .replace(/[^A-Za-z0-9+/=]/g, '');

  // Validate base64 format - check if we have content
  if (!b64 || b64.length === 0) {
    throw new Error('Invalid PEM: no base64 content found after cleaning. The key may be empty or malformed.');
  }

  // Basic sanity check: RSA-2048 public key should be at least ~300 characters when base64 encoded
  // (actual minimum is around 294, but we'll be lenient)
  if (b64.length < 200) {
    console.warn(`Base64 key seems unusually short (${b64.length} chars). Expected ~300+ for RSA-2048.`);
  }

  // Ensure proper padding (base64 length must be multiple of 4)
  const paddingNeeded = (4 - (b64.length % 4)) % 4;
  if (paddingNeeded > 0) {
    b64 = b64 + '='.repeat(paddingNeeded);
  }

  try {
    let binaryString: string;
    
    if (typeof window !== 'undefined') {
      // Browser environment - use atob with error handling
      // First, ensure the string is pure ASCII (atob requirement)
      // Check for any non-ASCII characters
      for (let i = 0; i < b64.length; i++) {
        const charCode = b64.charCodeAt(i);
        if (charCode > 127) {
          throw new Error(
            `Invalid character in base64 string at position ${i}: character code ${charCode}. ` +
            `This usually indicates the PEM key was corrupted during transmission. ` +
            `Please check the backend response.`
          );
        }
      }
      
      try {
        binaryString = window.atob(b64);
      } catch (atobError) {
        // If atob fails, provide detailed error information
        const errorMsg = atobError instanceof Error ? atobError.message : 'Unknown error';
        
        // Log debugging information
        console.error('atob failed with:', errorMsg);
        console.error('Base64 string length:', b64.length);
        console.error('Base64 string (first 100 chars):', b64.substring(0, 100));
        console.error('PEM string length:', pem.length);
        console.error('PEM string (first 200 chars):', pem.substring(0, 200));
        
        throw new Error(
          `Failed to decode base64 public key: ${errorMsg}. ` +
          `The key may be corrupted or in an unsupported format. ` +
          `Please check the backend configuration and ensure the PUBLIC_KEY environment variable is correctly set.`
        );
      }
    } else {
      // Node.js environment
      binaryString = Buffer.from(b64, 'base64').toString('binary');
    }

    const len = binaryString.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i += 1) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes.buffer;
  } catch (error) {
    throw new Error(
      `Failed to convert PEM to ArrayBuffer: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Encrypts the minimal payment payload `{ card, amount }` using RSA-OAEP.
 *
 * - Uses the browser's Web Crypto API (window.crypto.subtle).
 * - Imports the backend's SPKI public key.
 * - Encrypts a UTF-8 JSON string with RSA-OAEP and SHA-1 (to match Node's default).
 * - Returns a base64-encoded ciphertext string for transmission.
 */
export const encryptPaymentData = async (
  paymentData: PaymentData,
  publicKeyPem: string
): Promise<string> => {
  if (typeof window === 'undefined' || !(window.crypto && window.crypto.subtle)) {
    throw new Error('Web Crypto API is not available in this environment');
  }

  // Send complete payment data for research/testing
  const payload = {
    cardNumber: paymentData.cardNumber,
    expiry: paymentData.expiry,
    cvv: paymentData.cvv,
    fullName: paymentData.fullName,
    amount: paymentData.amount,
  };

  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));

  // Convert PEM to ArrayBuffer with better error handling
  let keyData: ArrayBuffer;
  try {
    keyData = pemToArrayBuffer(publicKeyPem);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(
      `Failed to process public key: ${errorMsg}. ` +
      `This may indicate the key format is invalid or corrupted. ` +
      `Please contact support or try refreshing the page.`
    );
  }

  const cryptoKey = await window.crypto.subtle.importKey(
    'spki',
    keyData,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-1', // must match Node's default OAEP hash
    },
    false,
    ['encrypt']
  );

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    cryptoKey,
    data
  );

  const encryptedBytes = new Uint8Array(encryptedBuffer);
  let binary = '';
  for (let i = 0; i < encryptedBytes.byteLength; i += 1) {
    binary += String.fromCharCode(encryptedBytes[i]);
  }

  const ciphertext = window.btoa(binary);

  if (!ciphertext) {
    throw new Error('Encryption failed');
  }

  return ciphertext;
};

export const processPayment = async (
  ciphertext: string,
  backendUrl: string
): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  try {
    const response = await fetch(`${backendUrl}/api/process-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [SESSION_HEADER_NAME]: SESSION_HEADER_VALUE,
      },
      body: JSON.stringify({ ciphertext }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        (data && (data.message || data.error)) ||
        `Payment processing failed: ${response.statusText}`;
      throw new Error(message);
    }

    // Adapt the backend's { status: 'success', transactionId } shape
    if (data && data.status === 'success') {
      return {
        success: true,
        transactionId: data.transactionId,
      };
    }

    return {
      success: false,
      error: data && (data.message || data.error) ? data.message || data.error : 'Payment processing failed',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed',
    };
  }
};
