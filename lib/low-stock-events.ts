/** Custom event fired when low-stock data should be refetched (e.g. after PO completed or created). */
export const LOW_STOCK_INVALIDATED_EVENT = "low-stock-invalidated";

export function dispatchLowStockInvalidated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LOW_STOCK_INVALIDATED_EVENT));
  }
}
