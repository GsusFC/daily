import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Client } from "@notionhq/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { jwtDecode } from "jwt-decode";

// Helper to validate user
function validateUser(token: string) {
    try {
        const decoded: any = jwtDecode(token);
        // In a real app, verify the signature with Google's public keys
        // For now, we check the domain claim if required
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

        // 1. Fetch Google Calendar Events
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: token });

        const calendar = google.calendar({ version: "v3", auth: oauth2Client });

        const timeMin = new Date();
        timeMin.setHours(0, 0, 0, 0);

        const timeMax = new Date();
        timeMax.setHours(23, 59, 59, 999);

        let eventsData = [];
        try {
            const events = await calendar.events.list({
                calendarId: "primary",
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                singleEvents: true,
                orderBy: "startTime",
            });
            eventsData = events.data.items || [];
        } catch (error) {
            console.error("Error fetching calendar:", error);
            // Continue without calendar data if it fails (e.g. scope issues)
        }

        // 2. Fetch Notion Tasks
        let notionTasks = [];
        if (process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID) {
            try {
                const notion = new Client({ auth: process.env.NOTION_TOKEN });
                const response = await (notion.databases as any).query({
                    database_id: process.env.NOTION_DATABASE_ID,
                    filter: {
                        property: "Status", // Assuming a Status property exists
                        status: {
                            does_not_equal: "Done",
                        },
                    },
                });
                notionTasks = response.results;
            } catch (error) {
                console.error("Error fetching Notion:", error);
            }
        }

        // 3. Generate Summary with Gemini
        let summary = "No data available to generate summary.";
        if (process.env.GEMINI_API_KEY) {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

            const prompt = `
        Eres el asistente ejecutivo de ${user.name || user.email}.
        Fecha: ${new Date().toLocaleDateString()}
        
        EVENTOS DE HOY (Google Calendar):
        ${JSON.stringify(eventsData, null, 2)}
        
        TAREAS PENDIENTES (Notion):
        ${JSON.stringify(notionTasks, null, 2)}
        
        Genera un resumen ejecutivo del día en español que incluya:
        1. Resumen general del día (2-3 frases).
        2. Top 3 prioridades basadas en los eventos y tareas.
        3. Alertas de conflictos o agenda muy apretada.
        4. Estimación de carga de trabajo.
        
        Usa un tono profesional pero cercano. Formato Markdown.
      `;

            const result = await model.generateContent(prompt);
            summary = result.response.text();
        }

        return NextResponse.json({
            summary,
            rawData: {
                events: eventsData,
                tasks: notionTasks,
            },
        });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
