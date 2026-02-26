// validation.js
// ----------------
// Small collection of helpers for validating decrypted payment data.

/**
 * Card number validation using the Luhn algorithm.
 * Requires 13–19 digits and a valid checksum.
 */
function isValidLuhn(cardNumber) {
  if (typeof cardNumber !== 'string') return false;
  const digits = cardNumber.replace(/\D+/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = parseInt(digits[i], 10);
    if (Number.isNaN(digit)) {
      return false;
    }

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Very simple sanity check for the payment amount. For a real integration
 * this should be cross-checked against a trusted cart or order total on
 * the server.
 */
function isValidAmount(amount) {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  return Number.isFinite(n) && n > 0;
}

/**
 * Validate expiry in MM/YY format and ensure it is not in the past.
 */
function isValidExpiry(expiry) {
  if (typeof expiry !== 'string') return false;
  const match = expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;

  const month = parseInt(match[1], 10);
  const year = 2000 + parseInt(match[2], 10);

  if (!Number.isFinite(month) || !Number.isFinite(year)) return false;
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return false;
  }

  return true;
}

/**
 * Validate CVV as 3–4 numeric digits.
 */
function isValidCVV(cvv) {
  if (typeof cvv !== 'string') return false;
  return /^\d{3,4}$/.test(cvv.trim());
}

/**
 * Basic email format validation.
 */
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (!trimmed) return false;
  const pattern = /.+@.+\..+/;
  return pattern.test(trimmed);
}

module.exports = {
  isValidLuhn,
  isValidAmount,
  isValidExpiry,
  isValidCVV,
  isValidEmail,
};



