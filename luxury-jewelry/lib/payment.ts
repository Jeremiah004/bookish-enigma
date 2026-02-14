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
    
    return data.publicKey;
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
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s+/g, '');

  const binaryString = typeof window !== 'undefined' ? window.atob(b64) : Buffer.from(b64, 'base64').toString('binary');
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer;
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

  const keyData = pemToArrayBuffer(publicKeyPem);

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
