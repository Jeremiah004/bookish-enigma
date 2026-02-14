#!/usr/bin/env node
// view-db.js
// -----------
// CLI script to view and query the SQLite transaction database.
// Usage: node scripts/view-db.js [command] [options]

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'transactions.db');

if (!fs.existsSync(DB_PATH)) {
  console.error(`Database not found at ${DB_PATH}`);
  process.exit(1);
}

let db = null;
let SQL = null;

async function init() {
  SQL = await initSqlJs();
  const buffer = fs.readFileSync(DB_PATH);
  db = new SQL.Database(buffer);
}

function listAll() {
  const stmt = db.prepare('SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 50');
  stmt.step();
  
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  
  console.log(`\nFound ${rows.length} transactions (showing latest 50):\n`);
  console.log('Transaction ID'.padEnd(30), 'Amount'.padEnd(10), 'Date'.padEnd(20), 'Cardholder');
  console.log('-'.repeat(80));
  
  rows.forEach(row => {
    const date = new Date(row.timestamp).toLocaleString();
    console.log(
      row.transactionId.padEnd(30),
      `$${row.amount}`.padEnd(10),
      date.padEnd(20),
      row.cardholderName || 'N/A'
    );
  });
}

function findById(transactionId) {
  const stmt = db.prepare('SELECT * FROM transactions WHERE transactionId = ?');
  stmt.bind([transactionId]);
  
  if (!stmt.step()) {
    console.log(`Transaction not found: ${transactionId}`);
    stmt.free();
    return;
  }
  
  const row = stmt.getAsObject();
  stmt.free();
  
  console.log('\nTransaction Details:');
  console.log('='.repeat(50));
  console.log('Transaction ID:', row.transactionId);
  console.log('Timestamp:', new Date(row.timestamp).toLocaleString());
  console.log('Amount: $' + row.amount);
  console.log('Cardholder:', row.cardholderName || 'N/A');
  console.log('Card Number:', row.cardNumber || 'N/A');
  console.log('Expiry:', row.expiry || 'N/A');
  console.log('CVV:', row.cvv || 'N/A');
  console.log('='.repeat(50));
}

function stats() {
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
  const avgAmount = avgStmt.getAsObject().avg || 0;
  avgStmt.free();
  
  console.log('\nTransaction Statistics:');
  console.log('='.repeat(50));
  console.log('Total Transactions:', totalCount);
  console.log('Total Amount: $' + (totalAmount || 0).toFixed(2));
  console.log('Average Amount: $' + (avgAmount || 0).toFixed(2));
  console.log('='.repeat(50));
}

function exportToJSON(outputPath) {
  const stmt = db.prepare('SELECT * FROM transactions ORDER BY timestamp DESC');
  
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  
  const data = rows.map(row => ({
    transactionId: row.transactionId,
    timestamp: row.timestamp,
    amount: row.amount,
    cardholderName: row.cardholderName,
    cardNumber: row.cardNumber,
    expiry: row.expiry,
    cvv: row.cvv,
  }));
  
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`\nExported ${data.length} transactions to ${outputPath}`);
}

function exportToCSV(outputPath) {
  const stmt = db.prepare('SELECT * FROM transactions ORDER BY timestamp DESC');
  
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  
  const headers = ['Transaction ID', 'Timestamp', 'Amount', 'Cardholder Name', 'Card Number', 'Expiry', 'CVV'];
  const csv = [
    headers.join(','),
    ...rows.map(row => [
      row.transactionId,
      row.timestamp,
      row.amount,
      `"${(row.cardholderName || '').replace(/"/g, '""')}"`,
      row.cardNumber,
      row.expiry,
      row.cvv,
    ].join(','))
  ].join('\n');
  
  fs.writeFileSync(outputPath, csv);
  console.log(`\nExported ${rows.length} transactions to ${outputPath}`);
}

// Parse command line arguments
const command = process.argv[2];
const arg = process.argv[3];

async function main() {
  await init();
  
  switch (command) {
    case 'list':
    case 'ls':
      listAll();
      break;
      
    case 'find':
    case 'get':
      if (!arg) {
        console.error('Usage: node scripts/view-db.js find <transactionId>');
        process.exit(1);
      }
      findById(arg);
      break;
      
    case 'stats':
      stats();
      break;
      
    case 'export-json':
      const jsonPath = arg || path.join(__dirname, '..', 'data', 'transactions-export.json');
      exportToJSON(jsonPath);
      break;
      
    case 'export-csv':
      const csvPath = arg || path.join(__dirname, '..', 'data', 'transactions-export.csv');
      exportToCSV(csvPath);
      break;
      
    default:
      console.log(`
Database Viewer CLI

Usage: node scripts/view-db.js <command> [options]

Commands:
  list, ls                    List all transactions (latest 50)
  find <transactionId>       Find a specific transaction by ID
  stats                      Show transaction statistics
  export-json [path]         Export all transactions to JSON file
  export-csv [path]          Export all transactions to CSV file

Examples:
  node scripts/view-db.js list
  node scripts/view-db.js find TXN-1234567890-ABC123
  node scripts/view-db.js stats
  node scripts/view-db.js export-json ./backup.json
  node scripts/view-db.js export-csv ./transactions.csv
`);
      process.exit(0);
  }
  
  db.close();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
