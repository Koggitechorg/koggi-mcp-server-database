import { VertexAI } from "@google-cloud/vertexai";
import path from "path";
import { fileURLToPath } from "url";
// Obtener __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fullFilePath = path.join(__dirname, "sa.json");
console.log(`fullFilePath: ${fullFilePath}`);
// Construir ruta absoluta al sa.json
const keyPath = fullFilePath;
// 1. ESTRUCTURA DE RESPUESTA JSON (Se mantiene para ser inyectada en el prompt)
const responseSchema = {
    type: 'array',
    description: 'Arreglo de tablas intervinientes y sus columnas basado en la pregunta del usuario y la información RAG.',
    items: {
        type: 'object',
        properties: {
            tableName: { type: 'string', description: 'Nombre de la tabla de la base de datos.' },
            tableDescription: { type: 'string', description: 'Descripción del propósito de la tabla.' },
            columns: { type: 'array', description: 'Arreglo de columnas.', items: { type: 'object', properties: { columnName: { type: 'string', description: 'El nombre técnico de la columna.' }, description: { type: 'string', description: 'Una breve descripción de la columna.' } }, required: ['columnName', 'description'] } }
        },
        required: ['tableName', 'tableDescription', 'columns']
    }
};
// 2. INSTRUCCIÓN DE SISTEMA ANTI-ALUCINACIÓN (Se mantiene estricta)
const systemInstruction = `Eres un motor de mapeo de esquemas de base de datos. Utiliza EXCLUSIVAMENTE la información del contexto RAG. Si la información necesaria no está contenida en el contexto RAG, devuelve ÚNICAMENTE UN ARREGLO JSON VACÍO: []. No inventes datos.`;
// 3. INICIALIZACIÓN (Vertex AI SDK)
//const ai2 = new VertexAI({
//    project: 'davinci-onegroup-sqa', 
//    location: 'us-central1'
//});
const ai = new VertexAI({
    project: 'davinci-onegroup-sqa', // <-- obligatorio
    location: 'us-central1',
    googleAuthOptions: {
        keyFilename: keyPath
    }
});
const modelName = 'gemini-2.5-flash-lite';
const ragCorpusId = 'projects/davinci-onegroup-sqa/locations/us-east1/ragCorpora/6917529027641081856';
const model = ai.preview.getGenerativeModel({
    model: modelName,
    generationConfig: {
        // Máxima estrictez en la generación
        temperature: 0,
        maxOutputTokens: 2000,
        topP: 1,
        topK: 1,
        // Eliminamos responseMimeType y responseSchema para reducir la presión estructural
    },
    systemInstruction: systemInstruction,
});
async function consultarRAGEngine(preguntaUsuario) {
    // 4. PROMPT FINAL: Le pide que genere la respuesta EN formato JSON y ENCAPSULADA.
    const prompt = `Utilizando únicamente la información recuperada de la herramienta RAG, identifica las tablas y sus columnas necesarias para responder a la pregunta: "${preguntaUsuario}".
    
    Tu respuesta DEBE ser un arreglo JSON que contenga los nombres de las tablas y sus columnas, siguiendo este esquema: ${JSON.stringify(responseSchema)}.
    
    **IMPORTANTE:** Encierra tu respuesta JSON entre bloques de código triple-backtick (por ejemplo, \`\`\`json[{"tabla":"x"}]\`\`\`).
    
    Si la información RAG es **nula o insuficiente**, la única respuesta permitida es: [].`;
    try {
        const result = await model.generateContent({
            contents: [{
                    role: 'user',
                    parts: [{ text: prompt }]
                }],
            tools: [
                {
                    retrieval: {
                        vertexRagStore: {
                            ragResources: [
                                {
                                    ragCorpus: ragCorpusId,
                                }
                            ],
                            // Se mantiene estricto para forzar solo coincidencias de alta fidelidad
                            vectorDistanceThreshold: 3,
                            similarityTopK: 3,
                        }
                    }
                }
            ],
        });
        let outputText = result.response.candidates[0].content.parts[0].text;
        console.log(`Salida MCP: ${outputText}`);
        // 5. MANEJO AVANZADO: Extracción de JSON del bloque de código
        // 5a. Si la respuesta es el array vacío, lo devolvemos directamente
        if (outputText.trim() === '[]') {
            return [];
        }
        // 5b. Si hay un bloque de código, extraemos el contenido.
        const jsonMatch = outputText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            // Usamos el contenido dentro del bloque de código
            console.log(jsonMatch[1].trim());
            return JSON.parse(jsonMatch[1].trim());
        }
        // 5c. Si no hay bloque de código pero la respuesta es directamente un JSON (caso de falla)
        if (outputText.trim().startsWith('[') && outputText.trim().endsWith(']')) {
            return JSON.parse(outputText.trim());
        }
        // Si no es JSON ni el array vacío, el modelo alucinó texto o falló
        console.error('La salida del modelo no pudo ser parseada o contenía alucinaciones de texto:', outputText);
        return [];
    }
    catch (error) {
        console.error('Error al consultar RAG Engine (Fallo de parsing JSON final):', error);
        // Devolvemos [] en caso de que el modelo haya fallado la estructura o alucinado texto que no es JSON
        return [];
    }
}
consultarRAGEngine("¿Qué información existe sobre la tabla tbl_sq_score_validity? ¿Cuáles son sus columnas y estructura?");
export { consultarRAGEngine };
