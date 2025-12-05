export async function errorHandler(func: Function) {
  try {
    return await func();
  } catch (err: any) {
    console.error('Error:', err);
    return {
      content: [{ type: "text", text: `Ocurrió un error: ${err?.message ?? String(err)}` }]
    };
  }
}
