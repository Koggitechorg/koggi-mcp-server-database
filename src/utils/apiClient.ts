import { CONFIG } from "../config/config.js";

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function apiFetch(path: string, options: FetchOptions = {}): Promise<any> {
  const res = await fetch(`${CONFIG.apiUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-authorization": "n8n amarilo",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json();
}
