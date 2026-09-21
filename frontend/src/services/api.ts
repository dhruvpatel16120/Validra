/**
 * Core API client for Validra frontend application.
 * Centralizes base URL configuration, request formatting, and error normalization.
 * Supports JSON requests and multipart file uploads with auth token management.
 */

// Retrieve base URL from environment; fallback to default FastAPI dev server port
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:8000";

/**
 * Standard categorized authentication error codes.
 */
export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "VALIDATION_ERROR"
  | "EMAIL_ALREADY_REGISTERED"
  | "INVALID_OR_EXPIRED_TOKEN"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

/**
 * Normalized API error class containing HTTP status, classified code, and optional details.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: AuthErrorCode;
  readonly details?: unknown;

  constructor(
    message: string,
    status: number,
    code: AuthErrorCode = "UNKNOWN_ERROR",
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * FastAPI reports validation failures as `detail: [{loc, msg, type}, ...]`.
 * Turn that into something a human can read instead of dumping the array.
 */
function extractDetailMessage(detail: unknown): string | null {
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const messages = detail
      .map((entry) => {
        if (typeof entry === "string") return entry;
        if (entry && typeof entry === "object" && "msg" in entry) {
          const msg = String((entry as { msg: unknown }).msg);
          const loc = (entry as { loc?: unknown[] }).loc;
          const field = Array.isArray(loc) ? loc[loc.length - 1] : undefined;
          return field ? `${String(field)}: ${msg}` : msg;
        }
        return null;
      })
      .filter(Boolean);
    if (messages.length) return messages.join("; ");
  }

  return null;
}

/**
 * Map raw HTTP response and status into structured AuthErrorCode and clean user message.
 */
function parseApiError(status: number, data: unknown): ApiError {
  let message = "An unexpected error occurred. Please try again.";
  let code: AuthErrorCode = "UNKNOWN_ERROR";
  let details: unknown = undefined;

  if (typeof data === "object" && data !== null) {
    const errorObj = data as Record<string, unknown>;
    details = errorObj.detail ?? errorObj.message ?? errorObj.error;

    const extracted =
      extractDetailMessage(errorObj.detail) ||
      (typeof errorObj.message === "string" ? errorObj.message : null);
    if (extracted) message = extracted;
  }

  if (status === 400) {
    const lower = message.toLowerCase();
    if (lower.includes("token") || lower.includes("expired") || lower.includes("invalid link")) {
      code = "INVALID_OR_EXPIRED_TOKEN";
    } else {
      code = "VALIDATION_ERROR";
    }
  } else if (status === 401) {
    code = "UNAUTHORIZED";
  } else if (status === 403) {
    code = "FORBIDDEN";
  } else if (status === 404) {
    code = "NOT_FOUND";
  } else if (status === 409) {
    code = "EMAIL_ALREADY_REGISTERED";
  } else if (status === 422) {
    code = "VALIDATION_ERROR";
  } else if (status === 429) {
    code = "RATE_LIMITED";
    message = "Too many requests. Please wait a moment before trying again.";
  } else if (status >= 500) {
    code = "SERVER_ERROR";
  }

  return new ApiError(message, status, code, details);
}

/**
 * Convert any unknown error into a friendly, human-readable string.
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      return "Unable to connect to the server. Please check your connection.";
    }
    return error.message;
  }
  return "An unexpected error occurred. Please try again.";
}

// In-memory token storage (with sessionStorage persistence for seamless page reload)
let inMemoryToken: string | null = null;

export function setAuthToken(token: string | null): void {
  inMemoryToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      sessionStorage.setItem("validra_jwt_token", token);
    } else {
      sessionStorage.removeItem("validra_jwt_token");
    }
  }
}

export function getAuthToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  if (typeof window !== "undefined") {
    const cached = sessionStorage.getItem("validra_jwt_token");
    if (cached) {
      inMemoryToken = cached;
      return cached;
    }
  }
  return null;
}

let tokenFetchPromise: Promise<string | null> | null = null;

/**
 * Attempt to retrieve a valid JWT token from the Next.js session route
 * if not already present in memory or session storage.
 */
async function resolveAuthToken(): Promise<string | null> {
  const current = getAuthToken();
  if (current) return current;

  if (typeof window === "undefined") return null;

  if (tokenFetchPromise) return tokenFetchPromise;

  tokenFetchPromise = (async () => {
    try {
      const res = await fetch("/api/auth/token", { credentials: "same-origin" });
      if (res.ok) {
        const data = await res.json();
        if (data?.accessToken) {
          setAuthToken(data.accessToken);
          return data.accessToken;
        }
      }
    } catch {
      // Ignore background fetch error
    } finally {
      tokenFetchPromise = null;
    }
    return null;
  })();

  return tokenFetchPromise;
}

/** Auth headers for a request, or just the extras when signed out. */
export function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getAuthToken();
  return {
    ...(extra || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  token?: string;
}

/**
 * Generic JSON request runner.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, token, headers = {}, credentials, ...customConfig } = options;

  // Ensure leading slash for endpoint
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string>),
  };

  if (body !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
  }

  let effectiveToken = token || getAuthToken();
  if (!effectiveToken && typeof window !== "undefined" && !cleanEndpoint.includes("/auth/login")) {
    effectiveToken = await resolveAuthToken();
  }

  if (effectiveToken) {
    requestHeaders.Authorization = `Bearer ${effectiveToken}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...customConfig,
      credentials: credentials || "include",
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new ApiError(
      "Network connection error. Could not reach the server.",
      0,
      "NETWORK_ERROR",
      error
    );
  }

  return handleResponse<T>(response);
}

/**
 * Multipart upload runner (used for the 1-4 label photos on POST /api/scans).
 *
 * Content-Type is deliberately not set: the browser must add the multipart
 * boundary itself.
 */
export async function apiUpload<T>(
  endpoint: string,
  formData: FormData,
  options: Omit<RequestOptions, "body"> = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      method: (options.method as string) || "POST",
      credentials: "include",
      headers: authHeaders({ Accept: "application/json" }),
      body: formData,
    });
  } catch (error) {
    throw new ApiError(
      "Unable to connect to the server. Please check your connection.",
      0,
      "NETWORK_ERROR",
      error
    );
  }

  return handleResponse<T>(response);
}

async function handleResponse<T>(response: Response): Promise<T> {
  let responseData: unknown = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else {
    try {
      responseData = await response.text();
    } catch {
      responseData = null;
    }
  }

  if (!response.ok) {
    throw parseApiError(response.status, responseData);
  }

  return responseData as T;
}

/**
 * REST HTTP helper methods.
 */
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "POST", body }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "PUT", body }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "PATCH", body }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
};
