const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique invoice number: GHZ-YYYYMMDD-XXXX
 */
function generateInvoiceNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `GHZ-${date}-${rand}`;
}

/**
 * Generate UUID
 */
function generateId() {
  return uuidv4();
}

/**
 * Calculate profit margin percentage
 */
function calculateMargin(purchasePrice, sellingPrice) {
  if (!purchasePrice || purchasePrice === 0) return 0;
  return (((sellingPrice - purchasePrice) / purchasePrice) * 100).toFixed(2);
}

/**
 * Calculate profit for a sale item
 */
function calculateProfit(purchasePrice, sellingPrice, quantity, discount = 0) {
  const revenue = (sellingPrice * quantity) - discount;
  const cost = purchasePrice * quantity;
  return revenue - cost;
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date = new Date()) {
  return new Date(date).toISOString().slice(0, 10);
}

/**
 * Get start of today (UTC midnight string)
 */
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Get start of this week (Monday)
 */
function startOfWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Get start of this month
 */
function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Get start of this year
 */
function startOfYear() {
  const d = new Date();
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Paginate helper
 */
function paginate(page = 1, limit = 20) {
  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  return { offset: (p - 1) * l, limit: l, page: p };
}

module.exports = {
  generateInvoiceNumber,
  generateId,
  calculateMargin,
  calculateProfit,
  formatDate,
  startOfToday,
  startOfWeek,
  startOfMonth,
  startOfYear,
  paginate,
};
