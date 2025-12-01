import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Client } from "@notionhq/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { jwtDecode } from "jwt-decode";

// Helper to validate user (duplicated for now, could be shared)
function validateUser(token: string) {
    try {
        const decoded: any = jwtDecode(token);
        const allowedDomain = process.env.ALLOWED_DOMAIN;
        if (allowedDomain && decoded.hd !== allowedDomain) {
            return null;
        }
        return decoded;
    } catch (e) {
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const user = validateUser(token);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { message, history } = await req.json();

        // 1. Fetch Context (Calendar & Notion)
        // In a real app, cache this or optimize to not fetch on every message
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: token });
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        let contextData: { events: any[]; tasks: any[] } = { events: [], tasks: [] };

        try {
            const events = await calendar.events.list({
                calendarId: "primary",
                timeMin: new Date().toISOString(),
                timeMax: new Date(Date.now() + 86400000).toISOString(),
                singleEvents: true,
            });
            contextData.events = events.data.items || [];
        } catch (e) {
            console.error("Calendar fetch failed in chat", e);
        }

        const notionToken = process.env.NOTION_TOKEN;
        const dbIdsString = process.env.NOTION_DATABASE_IDS || process.env.NOTION_DATABASE_ID || "";
        const dbIds = dbIdsString.split(',').map(id => id.trim()).filter(id => id.length > 0);

        if (notionToken && dbIds.length > 0) {
            try {
                const notion = new Client({ auth: notionToken });
                const fetchPromises = dbIds.map(async (id) => {
                    try {
                        const response = await (notion.databases as any).query({
                            database_id: id,
                            filter: {
                                property: "Status",
                                status: { does_not_equal: "Done" }
                            }
                        });
                        return response.results;
                    } catch (e) {
                        console.error(`Notion fetch failed for DB ${id}`, e);
                        return [];
                    }
                });
                const results = await Promise.all(fetchPromises);
                contextData.tasks = results.flat();
            } catch (e) {
                console.error("Notion setup failed in chat", e);
            }
        }

        // 2. Initialize Gemini Chat
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const systemContext = `
      Contexto del usuario (${user.name}):
      - Fecha: ${new Date().toLocaleString()}
      - Eventos hoy: ${JSON.stringify(contextData.events)}
      - Tareas pendientes: ${JSON.stringify(contextData.tasks)}
      
      Eres un asistente útil y conciso. Responde preguntas sobre la agenda y tareas.
    `;

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemContext }],
                },
                {
                    role: "model",
                    parts: [{ text: "Entendido. Tengo acceso a tu contexto. ¿En qué puedo ayudarte?" }],
                },
                ...(history || []),
            ],
        });

        const result = await chat.sendMessage(message);
        const response = result.response.text();

        return NextResponse.json({ response });

    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
