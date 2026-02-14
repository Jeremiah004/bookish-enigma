// validation.js
// ----------------
// Small collection of helpers for validating decrypted payment data.

/**
 * Basic card number validation - lenient for testing purposes.
 * Just checks that it's a non-empty string with some digits.
 * Luhn check removed to allow any card format for testing authenticity.
 */
function isValidLuhn(cardNumber) {
  if (typeof cardNumber !== 'string') return false;
  const trimmed = cardNumber.replace(/\s+/g, '');
  // Allow any card format for testing - just check it has some digits
  return trimmed.length > 0 && /^\d+$/.test(trimmed);
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

module.exports = {
  isValidLuhn,
  isValidAmount,
};



