import { GoogleGenerativeAI } from "@google/generative-ai";
import type { FormattedEvent, FormattedTaskGroup, Message } from "@/types";
import { GEMINI_MODEL, DATE_LOCALE, DATE_OPTIONS } from "@/lib/constants";

/**
 * Genera el resumen ejecutivo diario usando Gemini.
 */
export async function generateDailySummary(
    userName: string,
    events: FormattedEvent[],
    taskGroups: FormattedTaskGroup[]
): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY no configurada");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const now = new Date();
    const today = now.toLocaleDateString("es-ES", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const currentTime = now.toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' });

    const prompt = `
Eres el asistente ejecutivo de ${userName}.
Fecha y hora actual: ${today}, ${currentTime}

EVENTOS DE HOY (Google Calendar):
${JSON.stringify(events, null, 2)}

TAREAS Y PROYECTOS ACTIVOS (Notion, agrupados por base de datos):
${JSON.stringify(taskGroups, null, 2)}

Genera un resumen ejecutivo del día en español que incluya:
1. Resumen general del día (2-3 frases).
2. Top 3 prioridades **personales**. Separa claramente entre "Eventos de Agenda" y "Entregas de Proyectos".
3. Alertas de conflictos o agenda apretada.
4. Estimación de carga de trabajo restante.

Nota: El campo "assignees" indica los responsables. Si tu nombre ("${userName}") aparece, es tu responsabilidad directa. Si no, es del equipo.
Usa un tono profesional pero cercano.
Identifica claramente de qué Base de Datos proviene cada tarea en tu resumen (ej. "En el proyecto X...").
`;

    const result = await model.generateContent(prompt);
    return result.response.text();
}

/**
 * Inicia una sesión de chat con contexto del usuario.
 */
export async function createChatSession(
    userName: string,
    events: FormattedEvent[],
    taskGroups: FormattedTaskGroup[],
    history: Message[]
) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY no configurada");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const systemContext = `
Contexto del usuario (${userName}):
- Fecha: ${new Date().toLocaleString(DATE_LOCALE)}
- Eventos hoy: ${JSON.stringify(events)}
- Tareas y Proyectos (agrupados por DB): ${JSON.stringify(taskGroups)}

Eres un asistente útil y conciso. Responde preguntas sobre la agenda y tareas.
Si preguntan por un proyecto específico, busca en el grupo correspondiente.
`;

    return model.startChat({
        history: [
            {
                role: "user",
                parts: [{ text: systemContext }],
            },
            {
                role: "model",
                parts: [{ text: "Entendido. Tengo acceso a tu contexto. ¿En qué puedo ayudarte?" }],
            },
            ...history,
        ],
    });
}

/**
 * Envía un mensaje al chat y obtiene la respuesta.
 */
export async function sendChatMessage(
    userName: string,
    events: FormattedEvent[],
    taskGroups: FormattedTaskGroup[],
    history: Message[],
    message: string
): Promise<string> {
    const chat = await createChatSession(userName, events, taskGroups, history);
    const result = await chat.sendMessage(message);
    return result.response.text();
}
