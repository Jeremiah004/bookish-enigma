// database.js
// ------------
// SQLite database module for transaction storage using sql.js (pure JavaScript).
// Replaces the JSON file-based storage with a proper database.

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

// Database file path - use environment variable or default to data directory
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'transactions.db');
const OLD_JSON_PATH = path.join(__dirname, '..', 'data', 'transactions.json');

let db = null;
let SQL = null;

/**
 * Initialize the database connection and create tables if they don't exist.
 */
async function initializeDatabase() {
  if (db) {
    return; // Already initialized
  }

  // Initialize sql.js
  if (!SQL) {
    SQL = await initSqlJs();
  }

  // Ensure data directory exists
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Load existing database or create new one
  let buffer;
  if (fs.existsSync(DB_PATH)) {
    buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create transactions table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transactionId TEXT UNIQUE NOT NULL,
      timestamp TEXT NOT NULL,
      amount REAL NOT NULL,
      cardholderName TEXT,
      cardNumber TEXT,
      expiry TEXT,
      cvv TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create index on transactionId for faster lookups
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_transaction_id ON transactions(transactionId)
  `);

  // Create index on timestamp for date-based queries
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_timestamp ON transactions(timestamp)
  `);

  // Save database to file
  saveDatabase();

  console.log(`[database] Initialized SQLite database at ${DB_PATH}`);
}

/**
 * Save the database to disk.
 */
function saveDatabase() {
  if (!db) return;
  
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('[database] Error saving database:', err.message);
  }
}

/**
 * Migrate existing JSON data to database (one-time operation).
 */
async function migrateFromJSON() {
  if (!fs.existsSync(OLD_JSON_PATH)) {
    console.log('[database] No existing JSON file to migrate.');
    return;
  }

  try {
    await initializeDatabase();
    
    const jsonData = fs.readFileSync(OLD_JSON_PATH, 'utf8');
    const transactions = JSON.parse(jsonData);

    if (!Array.isArray(transactions) || transactions.length === 0) {
      console.log('[database] No transactions in JSON file to migrate.');
      return;
    }

    // Check if any transactions already exist
    const checkStmt = db.prepare('SELECT COUNT(*) as count FROM transactions');
    const existing = checkStmt.getAsObject({});
    if (existing.count > 0) {
      console.log('[database] Database already contains transactions, skipping migration.');
      return;
    }

    const insertStmt = db.prepare(`
      INSERT INTO transactions 
      (transactionId, timestamp, amount, cardholderName, cardNumber, expiry, cvv)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const txn of transactions) {
      try {
        insertStmt.run([
          txn.transactionId,
          txn.timestamp,
          txn.amount,
          txn.cardholderName || 'N/A',
          txn.cardNumber || 'N/A',
          txn.expiry || 'N/A',
          txn.cvv || 'N/A',
        ]);
      } catch (err) {
        // Skip duplicates
        if (!err.message.includes('UNIQUE constraint')) {
          console.error(`[database] Error migrating transaction ${txn.transactionId}:`, err.message);
        }
      }
    }

    insertStmt.free();
    saveDatabase();
    
    console.log(`[database] Migrated ${transactions.length} transactions from JSON to database.`);
    
    // Optionally backup the old JSON file
    const backupPath = OLD_JSON_PATH + '.backup';
    fs.copyFileSync(OLD_JSON_PATH, backupPath);
    console.log(`[database] Backed up JSON file to ${backupPath}`);
  } catch (err) {
    console.error('[database] Error migrating from JSON:', err.message);
  }
}

/**
 * Save a transaction to the database.
 */
function saveTransaction(transactionData) {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }

  const {
    cardNumber,
    expiry,
    cvv,
    fullName,
    amount,
    transactionId,
  } = transactionData;

  const finalTransactionId = transactionId || `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const timestamp = new Date().toISOString();

  try {
    const stmt = db.prepare(`
      INSERT INTO transactions 
      (transactionId, timestamp, amount, cardholderName, cardNumber, expiry, cvv)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      finalTransactionId,
      timestamp,
      amount,
      fullName || 'N/A',
      cardNumber || 'N/A',
      expiry || 'N/A',
      cvv || 'N/A',
    ]);

    stmt.free();
    saveDatabase();

    console.log(`[database] Transaction saved: ${finalTransactionId}`);
    
    return {
      transactionId: finalTransactionId,
      timestamp,
      amount,
      cardholderName: fullName || 'N/A',
      cardNumber: cardNumber || 'N/A',
      expiry: expiry || 'N/A',
      cvv: cvv || 'N/A',
    };
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      console.error(`[database] Transaction ID already exists: ${finalTransactionId}`);
      throw new Error('Transaction ID already exists');
    }
    console.error('[database] Error saving transaction:', err.message);
    throw err;
  }
}

/**
 * Get all transactions from the database.
 */
function getAllTransactions(filters = {}) {
  if (!db) {
    return [];
  }

  try {
    let query = 'SELECT * FROM transactions';
    const params = [];
    const conditions = [];

    // Add filters
    if (filters.startDate) {
      conditions.push('timestamp >= ?');
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      conditions.push('timestamp <= ?');
      params.push(filters.endDate);
    }
    if (filters.minAmount !== undefined) {
      conditions.push('amount >= ?');
      params.push(filters.minAmount);
    }
    if (filters.maxAmount !== undefined) {
      conditions.push('amount <= ?');
      params.push(filters.maxAmount);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY timestamp DESC';

    // Add pagination
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    const stmt = db.prepare(query);
    stmt.bind(params);
    
    const rows = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      rows.push({
        transactionId: row.transactionId,
        timestamp: row.timestamp,
        amount: row.amount,
        cardholderName: row.cardholderName,
        cardNumber: row.cardNumber,
        expiry: row.expiry,
        cvv: row.cvv,
      });
    }
    
    stmt.free();
    return rows;
  } catch (err) {
    console.error('[database] Error reading transactions:', err.message);
    return [];
  }
}

/**
 * Get a single transaction by transaction ID.
 */
function getTransactionById(transactionId) {
  if (!db) {
    return null;
  }

  try {
    const stmt = db.prepare('SELECT * FROM transactions WHERE transactionId = ?');
    stmt.bind([transactionId]);
    
    if (!stmt.step()) {
      stmt.free();
      return null;
    }

    const row = stmt.getAsObject();
    stmt.free();

    return {
      transactionId: row.transactionId,
      timestamp: row.timestamp,
      amount: row.amount,
      cardholderName: row.cardholderName,
      cardNumber: row.cardNumber,
      expiry: row.expiry,
      cvv: row.cvv,
    };
  } catch (err) {
    console.error('[database] Error getting transaction:', err.message);
    return null;
  }
}

/**
 * Get transaction statistics.
 */
function getTransactionStats() {
  if (!db) {
    return {
      totalCount: 0,
      totalAmount: 0,
      averageAmount: 0,
    };
  }

  try {
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM transactions');
    countStmt.step();
    const totalCount = countStmt.getAsObject().count;
    countStmt.free();

    const totalStmt = db.prepare('SELECT SUM(amount) as total FROM transactions');
    totalStmt.step();
    const totalAmount = totalStmt.getAsObject().total || 0;
    totalStmt.free();

    const avgStmt = db.prepare('SELECT AVG(amount) as avg FROM transactions');
    avgStmt.step();
    const averageAmount = avgStmt.getAsObject().avg || 0;
    avgStmt.free();

    return {
      totalCount,
      totalAmount,
      averageAmount,
    };
  } catch (err) {
    console.error('[database] Error getting stats:', err.message);
    return {
      totalCount: 0,
      totalAmount: 0,
      averageAmount: 0,
    };
  }
}

// Initialize database on module load (async)
let initPromise = null;
function ensureInitialized() {
  if (!initPromise) {
    initPromise = initializeDatabase().then(() => {
      // Migrate existing JSON data on first run (only if database is empty)
      const countStmt = db.prepare('SELECT COUNT(*) as count FROM transactions');
      countStmt.step();
      const count = countStmt.getAsObject().count;
      countStmt.free();
      
      if (count === 0) {
        migrateFromJSON();
      }
    }).catch(err => {
      console.error('[database] Initialization error:', err);
    });
  }
  return initPromise;
}

// Start initialization immediately
ensureInitialized();

module.exports = {
  initializeDatabase,
  saveTransaction,
  getAllTransactions,
  getTransactionById,
  getTransactionStats,
  migrateFromJSON,
  ensureInitialized,
};
