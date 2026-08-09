"use client";

import {
  computeNetPurchaseCost,
  computeNetSellingPrice,
  computeProfitMarginPercent,
} from "@/lib/pricing";

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(n);
}

function parseNum(value: unknown) {
  if (value === "" || value === undefined || value === null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

interface InventoryProfitPreviewProps {
  purchasePrice: unknown;
  sellingPrice: unknown;
  manufacturerDiscount: unknown;
  specialCompanyDiscount: unknown;
  customerDiscount: unknown;
  className?: string;
}

export function InventoryProfitPreview({
  purchasePrice,
  sellingPrice,
  manufacturerDiscount,
  specialCompanyDiscount,
  customerDiscount,
  className = "md:col-span-2",
}: InventoryProfitPreviewProps) {
  const purchase = parseNum(purchasePrice);
  const selling = parseNum(sellingPrice);
  if (purchase <= 0 || selling <= 0) return null;

  const netCost = computeNetPurchaseCost(
    purchase,
    parseNum(manufacturerDiscount),
    parseNum(specialCompanyDiscount),
  );
  const netSelling = computeNetSellingPrice(selling, parseNum(customerDiscount));
  const profit = netSelling - netCost;
  const marginPercent = computeProfitMarginPercent(netSelling, netCost);

  return (
    <div
      className={`rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm ${className}`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-900">
            Estimated profit per item
          </p>
          <p className="text-xs text-emerald-700">
            Uses net purchase and net selling after entered discounts.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-lg bg-white/80 px-3 py-2">
            <p className="text-xs text-gray-500">Net cost</p>
            <p className="font-semibold text-gray-900">{formatMoney(netCost)}</p>
          </div>
          <div className="rounded-lg bg-white/80 px-3 py-2">
            <p className="text-xs text-gray-500">Profit</p>
            <p
              className={
                profit >= 0
                  ? "font-semibold text-emerald-700"
                  : "font-semibold text-red-700"
              }
            >
              {formatMoney(profit)}
            </p>
          </div>
          <div className="rounded-lg bg-white/80 px-3 py-2">
            <p className="text-xs text-gray-500">Profit margin</p>
            <p
              className={
                marginPercent >= 0
                  ? "font-semibold text-emerald-700"
                  : "font-semibold text-red-700"
              }
            >
              {marginPercent}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
