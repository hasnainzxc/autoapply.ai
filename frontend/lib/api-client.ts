/**
 * Shared API client for ApplyMate frontend.
 * Env-aware base URL, consistent error handling, auth headers.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(`${API_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });
  }
  return url.toString();
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Accept": "application/json",
  };
  // Clerk token if available (SSR-safe: only in browser)
  if (typeof window !== "undefined") {
    try {
      const mod: any = await import("@clerk/nextjs");
      const token = await mod.Clerk?.session?.getToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    } catch {
      // Clerk not available in this context, skip auth header
    }
  }
  return headers;
}

export async function handleApiError(response: Response): Promise<never> {
  let detail = `HTTP ${response.status}`;
  try {
    const body = await response.json();
    detail = body.detail || body.message || JSON.stringify(body);
  } catch {
    // non-JSON error body
  }
  throw new ApiError(response.status, detail);
}

export async function apiGet<T = unknown>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(buildUrl(path, params), { headers });
  if (!res.ok) await handleApiError(res);
  return res.json();
}

export async function apiPostForm<T = unknown>(
  path: string,
  formData: FormData
): Promise<T> {
  const headers = await getAuthHeaders();
  // Do NOT set Content-Type for multipart — browser sets it with boundary
  const res = await fetch(buildUrl(path), {
    method: "POST",
    headers,
    body: formData,
  });
  if (!res.ok) await handleApiError(res);
  return res.json();
}

export async function apiPostJson<T = unknown>(
  path: string,
  data: Record<string, unknown>
): Promise<T> {
  const headers = await getAuthHeaders();
  headers["Content-Type"] = "application/json";
  const res = await fetch(buildUrl(path), {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) await handleApiError(res);
  return res.json();
}
