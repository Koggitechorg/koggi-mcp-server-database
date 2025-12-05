import { validateRequestToken } from "../middlewares/middleware.js";
import { apiFetch } from "../utils/apiClient.js";

async function request_sql_database(sql_query: string): Promise<any> {
  try {
    return await validateRequestToken(async () => apiFetch(`/api/mcp/run-query-from-rag`, {
      method: "POST",
      body: JSON.stringify({ sql_query }),
    }));
  } catch (err) {
    console.log(err);
    return { error: `Error al ejecutar la query: ${JSON.stringify(err)}` };
  }
}

export {
  request_sql_database,
}