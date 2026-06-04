/**
 * API base URL for backend requests.
 * In Next.js, NEXT_PUBLIC_* vars are inlined at BUILD time.
 * - Locally: set in .env.local
 * - Vercel: set in Project → Settings → Environment Variables, then REDEPLOY
 *   (if you set the var after the first deploy, you must trigger a new deployment)
 */
export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url || url === "undefined") {
    if (typeof window !== "undefined") {
      console.error(
        "NEXT_PUBLIC_API_BASE_URL is not set. Set it in .env.local and in Vercel → Settings → Environment Variables, then redeploy."
      );
    }
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not set. Add it to .env.local and to Vercel Environment Variables, then redeploy the frontend."
    );
  }
  return url.replace(/\/$/, ""); // strip trailing slash
}

/** Max page size allowed by pharmacist list endpoints (vendor, manufacturer, inventory, etc.). */
export const API_LIST_MAX_LIMIT = 100;

/** Unwrap list from API body: either `T[]` or paginated `{ data: T[] }`. */
export function parseApiList<T>(json: unknown): T[] {
  if (Array.isArray(json)) return json as T[];
  if (
    json &&
    typeof json === "object" &&
    Array.isArray((json as { data?: unknown }).data)
  ) {
    return (json as { data: T[] }).data;
  }
  return [];
}
