#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from "zod";
import { errorHandler } from "./error/error.handler.js";
import { consultarRAGEngine } from "./handlers/rag.js";
import { request_sql_database } from "./handlers/sqlRequest.js";

import express from 'express';
import cors from "cors";

// --------------------------------------------------
// 📌 Crear servidor MCP
// --------------------------------------------------
const mcp = new McpServer({
    name: "koggi-mcp-server",
    version: "1.0.15"
});

// --------------------------------------------------
// 🧮 Herramienta: Obtener estructura RAG
// --------------------------------------------------
mcp.registerTool(
    "get_rag_database",
    {
        title: "Obtener estructura RAG",
        description: "Retorna información estructural de tablas y columnas de la base de datos a partir de una pregunta en lenguaje natural utilizando un motor RAG desplegado en Vertex AI. La pregunta que se recibe es preguntando solamente por la o las tablas que existen en la base de datos. No se pregunta por nada mas que sea las tablas como cantidad, cuantos elementos hay en la tabla, etc.",
        inputSchema: {
            question: z.string().describe("Pregunta en lenguaje natural."),
        },
        outputSchema: {
            content: z.array(z.object({
                type: z.string(),
                text: z.string(),
            })),
        },
    },
    async ({ question }) =>
        errorHandler(async () => {
            const ragDbaStructure = await consultarRAGEngine(question);
            return {
                content: [
                    { type: "text", text: JSON.stringify(ragDbaStructure, null, 2) }
                ]
            };
        })
);

// --------------------------------------------------
// 🧮 Tool: Ejecutar consulta SQL
// --------------------------------------------------
mcp.registerTool(
    "get_request_database_sql",
    {
        title: "Ejecutar consulta SQL",
        description: "Ejecuta una query SQL a partir de una pregunta en lenguaje natural utilizando un motor RAG desplegado en Vertex AI ejecutado previamente.",
        inputSchema: {
            sql_query: z.string().describe("Query SQL completa."),
        },
        outputSchema: {
            content: z.array(z.object({
                type: z.string(),
                text: z.string(),
            })),
        },
    },
    async ({ sql_query }) =>
        errorHandler(async () => {
            const result = await request_sql_database(sql_query);
            return {
                content: [
                    { type: "text", text: JSON.stringify(result, null, 2) }
                ]
            };
        })
);

// --------------------------------------------------
// 🌐 Servidor HTTP para ChatGPT
// --------------------------------------------------
const app = express();
app.use(cors());
app.use(express.json());

// Endpoint MCP estándar: "/mcp"
app.post('/mcp', async (req: any, res: any) => {
    // Create a new transport for each request to prevent request ID collisions
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true
    });

    res.on('close', () => {
        transport.close();
    });

    await mcp.connect(transport);
    await transport.handleRequest(req, res, req.body);
});

// --------------------------------------------------
// 🚀 Iniciar servidor HTTP
// --------------------------------------------------
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`🚀 MCP HTTP server running on http://localhost:${PORT}/mcp`);
});
