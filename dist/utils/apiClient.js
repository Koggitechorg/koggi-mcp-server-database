import { CONFIG } from "../config/config.js";
export async function apiFetch(path, options = {}) {
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
