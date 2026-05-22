/** True when quantity is at or below the configured minimum (min must be > 0). */
export function isLowStock(quantity: number, minimumStock: number): boolean {
  return minimumStock > 0 && quantity <= minimumStock;
}
