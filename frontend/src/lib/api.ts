import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./auth";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
  ) {
    super(message);
  }
}

interface ErrorBody {
  error?: {
    message: string;
    details?: { loc?: (string | number)[]; msg?: string }[];
  };
}

const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/refresh",
  "/auth/register-business",
];

let refreshingToken: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { access_token: string };
  setTokens(data.access_token);
  return true;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && !isRetry && !PUBLIC_PATHS.includes(path)) {
    refreshingToken ??= refreshAccessToken().finally(() => {
      refreshingToken = null;
    });
    if (await refreshingToken) return apiFetch<T>(path, options, true);
    clearTokens();
    throw new ApiError(401, "Session expired. Please log in again.");
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as ErrorBody | null;
    const first = body?.error?.details?.[0];
    const message = first
      ? `${String(first.loc?.at(-1) ?? "input")}: ${first.msg}`
      : (body?.error?.message ?? res.statusText);
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}
