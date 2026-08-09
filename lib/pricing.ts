/** Clamp a percentage to 0–100. */
export function clampPercent(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

export function computeNetPurchaseCost(
  purchasePrice: number,
  manufacturerDiscountPercent: number,
  specialCompanyDiscountPercent: number,
): number {
  const mf = clampPercent(manufacturerDiscountPercent);
  const sp = clampPercent(specialCompanyDiscountPercent);
  return purchasePrice * (1 - mf / 100) * (1 - sp / 100);
}

export function computeNetSellingPrice(
  sellingPrice: number,
  customerDiscountPercent: number,
): number {
  const cd = clampPercent(customerDiscountPercent);
  return sellingPrice * (1 - cd / 100);
}

/** Profit margin % = (net selling − net cost) / net selling × 100, rounded to nearest whole %. */
export function computeProfitMarginPercent(
  netSelling: number,
  netCost: number,
): number {
  if (netSelling <= 0) return 0;
  const profit = netSelling - netCost;
  return Math.round((profit / netSelling) * 100);
}
