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
