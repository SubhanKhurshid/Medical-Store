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

export interface PaginatedListMeta {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

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

function paginatedMeta(json: unknown): PaginatedListMeta | null {
  if (json && typeof json === "object" && "meta" in json) {
    const meta = (json as { meta?: PaginatedListMeta }).meta;
    return meta ?? null;
  }
  return null;
}

function listUrlWithPage(baseUrl: string, page: number, limit: number) {
  const [path, query = ""] = baseUrl.split("?");
  const params = new URLSearchParams(query);
  params.set("page", String(page));
  params.set("limit", String(limit));
  const q = params.toString();
  return q ? `${path}?${q}` : path;
}

/**
 * Fetch every page from a paginated list endpoint (for dropdowns).
 * Does not change main table APIs — call with same URL, loops until meta.totalPages.
 */
export async function fetchAllPaginatedList<T>(
  baseUrl: string,
  init?: RequestInit & { pageLimit?: number },
): Promise<T[]> {
  const limit = init?.pageLimit ?? API_LIST_MAX_LIMIT;
  const all: T[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const url = listUrlWithPage(baseUrl, page, limit);
    const res = await fetch(url, init);
    if (!res.ok) {
      throw new Error(`List fetch failed (${res.status})`);
    }
    const json = await res.json();
    if (Array.isArray(json)) {
      return json as T[];
    }
    const chunk = parseApiList<T>(json);
    all.push(...chunk);
    const meta = paginatedMeta(json);
    totalPages = meta?.totalPages ?? 1;
    if (!meta && chunk.length < limit) break;
    page += 1;
  } while (page <= totalPages);

  return all;
}

/** Axios variant for dropdowns (e.g. purchase order vendor select). */
export async function fetchAllPaginatedListAxios<T>(
  baseUrl: string,
  config?: { headers?: Record<string, string>; pageLimit?: number },
): Promise<T[]> {
  const axios = (await import("axios")).default;
  const limit = config?.pageLimit ?? API_LIST_MAX_LIMIT;
  const all: T[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const url = listUrlWithPage(baseUrl, page, limit);
    const res = await axios.get(url, { headers: config?.headers });
    const json = res.data;
    if (Array.isArray(json)) {
      return json as T[];
    }
    const chunk = parseApiList<T>(json);
    all.push(...chunk);
    const meta = paginatedMeta(json);
    totalPages = meta?.totalPages ?? 1;
    if (!meta && chunk.length < limit) break;
    page += 1;
  } while (page <= totalPages);

  return all;
}
