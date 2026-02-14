// storage.js
// -----------
// Storage module that uses SQLite database for transaction records.
// This module maintains the same interface as the old file-based storage
// but now uses a proper database backend.

const {
  saveTransaction: dbSaveTransaction,
  getAllTransactions: dbGetAllTransactions,
  getTransactionById: dbGetTransactionById,
  getTransactionStats: dbGetTransactionStats,
} = require('./database');

/**
 * Save a transaction record with FULL card information.
 * WARNING: This stores complete card data for research/testing purposes only.
 * In production, this would violate PCI DSS - use tokenization instead.
 */
function saveTransaction(transactionData) {
  return dbSaveTransaction(transactionData);
}

/**
 * Get all transactions (for testing/debugging)
 * Supports optional filters: { startDate, endDate, minAmount, maxAmount, limit, offset }
 */
function getAllTransactions(filters = {}) {
  return dbGetAllTransactions(filters);
}

/**
 * Get a single transaction by ID
 */
function getTransactionById(transactionId) {
  return dbGetTransactionById(transactionId);
}

/**
 * Get transaction statistics
 */
function getTransactionStats() {
  return dbGetTransactionStats();
}

module.exports = {
  saveTransaction,
  getAllTransactions,
  getTransactionById,
  getTransactionStats,
};

