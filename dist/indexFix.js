#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import express from "express";
import cors from "cors";
import { errorHandler } from "./error/error.handler.js";
import { consultarRAGEngine } from "./handlers/rag.js";
import { request_sql_database } from "./handlers/sqlRequest.js";
// =====================================================
// 🔧 MODO DE EJECUCIÓN (1 = STDIO, 2 = HTTP)
// =====================================================
let MODE = 1; // <-- 🔥 Cambia este valor entre 1 y 2
// const MODE = 2;
// =====================================================
// 🔧 Crear instancia ÚNICA del MCP Server
// =====================================================
const mcp = new McpServer({
    name: "koggi-mcp-server",
    version: "1.0.20"
});
// =====================================================
// 🧰 Registrar herramientas (solo 1 vez)
// =====================================================
mcp.registerTool("get_rag_database", {
    title: "Obtener estructura RAG",
    description: "Devuelve estructura de tablas y columnas usando un motor RAG.",
    inputSchema: {
        question: z.string().describe("Pregunta natural sobre estructura de BD."),
    },
    outputSchema: {
        content: z.array(z.object({
            type: z.string(),
            text: z.string(),
        }))
    }
}, async ({ question }) => errorHandler(async () => {
    const ragDbaStructure = await consultarRAGEngine(question);
    return {
        content: [
            { type: "text", text: JSON.stringify(ragDbaStructure, null, 2) }
        ]
    };
}));
mcp.registerTool("get_request_database_sql", {
    title: "Ejecutar consulta SQL",
    description: "Ejecuta una SQL generada previamente.",
    inputSchema: {
        sql_query: z.string().describe("SQL completa."),
    },
    outputSchema: {
        content: z.array(z.object({
            type: z.string(),
            text: z.string(),
        }))
    }
}, async ({ sql_query }) => errorHandler(async () => {
    const result = await request_sql_database(sql_query);
    return {
        content: [
            { type: "text", text: JSON.stringify(result, null, 2) }
        ]
    };
}));
// =====================================================
// 🚀 EJECUCIÓN SEGÚN MODO
// =====================================================
console.log(`📌 MCP ejecutándose en modo: ${MODE === 1 ? "STDIO" : "HTTP"}`);
// =====================================================
// 🔌 MODO 1 — STDIO
// =====================================================
if (MODE === 1) {
    console.log("🔌 Ejecutando MCP vía STDIO...");
    const transport = new StdioServerTransport();
    await mcp.connect(transport);
}
// =====================================================
// 🌐 MODO 2 — HTTP
// =====================================================
if (MODE === 2) {
    console.log("🌐 Ejecutando MCP vía HTTP...");
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.post("/mcp", async (req, res) => {
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
            enableJsonResponse: true
        });
        res.on("close", () => transport.close());
        await mcp.connect(transport);
        await transport.handleRequest(req, res, req.body);
    });
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => console.log(`🚀 MCP HTTP disponible en http://localhost:${PORT}/mcp`));
}
