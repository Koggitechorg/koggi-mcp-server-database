#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { errorHandler } from "./error/error.handler.js";
import { consultarRAGEngine } from "./handlers/rag.js";
import { request_sql_database } from "./handlers/sqlRequest.js";
// Crear el servidor MCP
const server = new McpServer({
    name: "koggi-mcp-server",
    version: "1.0.15"
});
// ===============================
// 🧮 Herramienta: Obtener estructura de tabla y columnas
// ===============================
server.tool("get_rag_database", `
        Retorna información estructural de tablas y columnas de la base de datos a partir de una pregunta en lenguaje natural utilizando un motor RAG desplegado en Vertex AI.
        La pregunta que se recibe es preguntando solamente por la o las tablas que existen en la base de datos.
        No se pregunta por nada mas que sea las tablas como cantidad, cuantos elementos hay en la tabla, etc.

        Args:
        question (string): Pregunta o instrucción en lenguaje natural que describe la información a consultar. El motor RAG devuelve una estructura intermedia que representa la consulta SQL antes de ser generada completamente.
    `, {
    question: z.string(),
}, async ({ question }) => {
    return errorHandler(async () => {
        const ragDbaStructure = await consultarRAGEngine(question);
        return {
            content: [
                { type: "text", text: JSON.stringify(ragDbaStructure, null, 2) },
            ],
        };
    });
});
// Crea una nueva tool basada en la existente que ejecuta una consulta al backend
server.tool("get_request_database_sql", `
        Ejecuta una query SQL a partir de una pregunta en lenguaje natural utilizando un motor RAG desplegado en Vertex AI ejecutado previamente.

        Args:
        sql_query (string): Query completa en SQL para ejecutar en base de datos.
    `, {
    sql_query: z.string(),
}, async ({ sql_query }) => {
    return errorHandler(async () => {
        const ragDbaStructure = await request_sql_database(sql_query);
        return {
            content: [
                { type: "text", text: JSON.stringify(ragDbaStructure, null, 2) },
            ],
        };
    });
});
// ===============================
// 🚀 Iniciar servidor MCP
// ===============================
const transport = new StdioServerTransport();
await server.connect(transport);
