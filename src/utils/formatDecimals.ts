/**
 * Smart decimal formatting for pizzeria ingredient costs and quantities.
 * Shows up to maxDecimals but trims trailing zeros.
 * Examples:
 *   formatCost(0.00005) → "0.00005"
 *   formatCost(1.50)    → "1.50"
 *   formatCost(10)      → "10.00"
 */
export function formatCost(value: number, maxDecimals = 5): string {
  if (value === 0) return '0.00';
  
  // Use enough decimals to show the significant digits
  const formatted = value.toFixed(maxDecimals);
  
  // Remove trailing zeros but keep at least 2 decimal places
  const parts = formatted.split('.');
  if (parts.length === 1) return formatted + '.00';
  
  let decimals = parts[1];
  // Trim trailing zeros
  while (decimals.length > 2 && decimals.endsWith('0')) {
    decimals = decimals.slice(0, -1);
  }
  
  return parts[0] + '.' + decimals;
}

/**
 * Format quantity with smart decimals (for grams, ml, etc.)
 * Shows up to 3 decimals by default, trimming trailing zeros.
 */
export function formatQuantity(value: number, maxDecimals = 3): string {
  if (value === 0) return '0';
  
  const formatted = value.toFixed(maxDecimals);
  const parts = formatted.split('.');
  if (parts.length === 1) return formatted;
  
  let decimals = parts[1];
  while (decimals.endsWith('0')) {
    decimals = decimals.slice(0, -1);
  }
  
  return decimals.length > 0 ? parts[0] + '.' + decimals : parts[0];
}

/**
 * Format total cost (quantity × unit_cost) with smart precision
 */
export function formatTotal(value: number): string {
  // For totals, show at least 2 decimals, up to 4 for precision
  return formatCost(value, 4);
}
