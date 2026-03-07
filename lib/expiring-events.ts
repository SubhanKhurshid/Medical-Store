/** Custom event fired when expiring-soon data should be refetched (e.g. after discard or exclude). */
export const EXPIRING_INVALIDATED_EVENT = "expiring-invalidated";

export function dispatchExpiringInvalidated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EXPIRING_INVALIDATED_EVENT));
  }
}
