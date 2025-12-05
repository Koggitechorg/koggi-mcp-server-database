import { CONFIG } from "../config/config.js";
import { apiFetch } from "../utils/apiClient.js";
async function validateRequestToken(func) {
    const token = CONFIG.token;
    try {
        const isValid = await validateToken(token);
        if (!isValid) {
            throw new Error("Invalid request token.");
        }
        return await func();
    }
    catch (err) {
        return [{ type: "text", text: `Error al validar token o ejecutando la acción: ${err?.message ?? String(err)}` }];
    }
}
async function validateToken(token) {
    const response = await apiFetch(`/api/mcp/validate`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });
    console.log("Token validation response:", response);
    return response?.success;
}
export { validateRequestToken };
