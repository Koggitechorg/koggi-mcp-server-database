export async function errorHandler(func) {
    try {
        return await func();
    }
    catch (err) {
        console.error('Error:', err);
        return {
            content: [{ type: "text", text: `Ocurrió un error: ${err?.message ?? String(err)}` }]
        };
    }
}
