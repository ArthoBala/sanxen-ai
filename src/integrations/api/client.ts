// In production (Vercel), use relative /api path so frontend and backend share the same domain.
// In development, use the local backend URL from .env.
const isProduction = import.meta.env.PROD;
const BASE_URL = isProduction
  ? ""
  : (import.meta.env.VITE_API_BASE_URL || "http://localhost:4002");

const API_PREFIX = isProduction ? "/api" : "";

// Log the API URL on startup for debugging
console.log("[API Client] Mode:", isProduction ? "production" : "development");
console.log("[API Client] Connecting to:", isProduction ? "(same domain)/api" : BASE_URL);

function getToken() {
  return localStorage.getItem("token") || "";
}

type RequestOptions = RequestInit & {
  timeoutMs?: number;
};

async function request(path: string, options: RequestOptions = {}) {
  const { timeoutMs, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const controller = timeoutMs ? new AbortController() : undefined;
  const timeoutId = timeoutMs ? setTimeout(() => controller?.abort(), timeoutMs) : undefined;
  
  const url = `${BASE_URL}${API_PREFIX}${path}`;
  console.log("[API Client] Request:", options.method || "GET", url);
  
  try {
    const res = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller?.signal ?? fetchOptions.signal,
    });
    
    if (!res.ok) {
      const text = await res.text();
      console.error("[API Client] Error response:", res.status, text);
      throw new Error(text || `Request failed: ${res.status}`);
    }
    
    const data = await res.json();
    console.log("[API Client] Success:", path);
    return data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error("[API Client] Request timed out:", path);
      throw new Error("Request timed out");
    }
    console.error("[API Client] Request failed:", path, error);
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export const api = {
  get: (path: string, options?: RequestOptions) => request(path, { method: "GET", ...options }),
  post: (path: string, body: any, options?: RequestOptions) => request(path, { method: "POST", body: JSON.stringify(body), ...options }),
  patch: (path: string, body: any, options?: RequestOptions) => request(path, { method: "PATCH", body: JSON.stringify(body), ...options }),
  delete: (path: string, options?: RequestOptions) => request(path, { method: "DELETE", ...options }),
};
