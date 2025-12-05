# koggi-mcp-server

Una herramienta (MCP server) ligera para exponer un comando/tool llamado `generate_simulator` usado para generar un simulador financiero basándose en el número de documento (id de lead) de un usuario. El servidor implementa el protocolo Model Context Protocol (MCP) y está pensado para integrarse con agentes o sistemas que hablen MCP por stdin/stdout.

## Contenido

- `src/index.ts` - Entrada principal que registra la tool `generate_simulator` y arranca el servidor MCP usando `StdioServerTransport`.
- `src/handlers/simulator.ts` - Handlers/implementación auxiliar del handler `generate_simulator` (versiones JS/TS).
- `src/utils/apiClient.ts` - Cliente HTTP usado para llamar al endpoint interno/external que calcula el simulador.
- `src/config/config.ts` - Carga de variables de entorno (usa `dotenv`).

## Características

 * ## Características
 
  - Tool MCP: `get_info_calculators`
    - Propósito: Obtener la información de los calculadores asignados a una lista de identificaciones.
   - Schema (Zod): `identifications` (array de números), `entityKey` (string) — ambos obligatorios.
 
  - Tool MCP: `assign_and_get_last_calculator`
    - Propósito: Asignar y obtener el último calculador asociado a un número de identificación específico.
    - Schema (Zod): `identification` (number), `entityKey` (string) — ambos obligatorios.
 
  - Tool MCP: `generate_simulator`
    - Propósito: Generar un simulador financiero para un usuario dado.
    - Schema (Zod): `id_lead`, `builder`, `email_requester`,
      `income_updated`, `observations` (todos son obligatorios — definidos en `index.ts`).
 
  - Comunicación: stdin/stdout (StdioServerTransport) siguiendo el SDK `@modelcontextprotocol/sdk`.
  - Cliente HTTP: usa `node-fetch` y la variable de entorno `EXTERNAL_URL` como base para las peticiones.
 
## Requisitos

- Node.js 18+ (o compatible con ESM y fetch nativo).
- npm


## Configuración y ejecución (ejemplos de integración)

En lugar de instrucciones de instalación local, aquí hay ejemplos prácticos para integrar el servidor en un flujo MCP o en ADK.

Ejemplo `mcp.json` (útil para ejecutar con orquestadores que esperan ese formato):

```json
{
	"servers": {
		"koggi-mcp-server": {
			"command": "npx",
			"args": [
				"-y", "@koggitechorg/koggi-mcp-server"
			],
			"env": {
				"EXTERNAL_URL": "https://external-qa-502142473966.us-central1.run.app",
				"API_TOKEN": "23slKk2..."
			}
		}
	},
	"inputs": []
}
```

Ejemplo de integración en ADK (snippet Python) usando parámetros de Stdio:

```py
tools = [
		MCPToolsetConParseo(
				connection_params=StdioServerParameters(
						command="npx",
						args=["-y", "@koggitechorg/koggi-mcp-server"],
						env={"EXTERNAL_URL": EXTERNAL_URL, "API_TOKEN": "..."},
				)
		),
]
```

Estos ejemplos muestran cómo arrancar el servidor desde `npx` (instalación bajo demanda) y pasar `EXTERNAL_URL` como variable de entorno. `EXTERNAL_URL` se concatena con las rutas internas definidas en el cliente HTTP (`src/utils/apiClient.ts`).

## Licencia

Licencia no especificada en el repo. Añade un `LICENSE` si quieres publicar bajo una licencia permissiva (MIT, Apache-2.0, etc.).

## Contacto

Si necesitas ayuda para adaptar el servidor (p. ej. cambiar transporte, añadir nuevas tools o endpoints), abre un issue o contacta al equipo de Koggitech.
