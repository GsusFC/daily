import { NextRequest, NextResponse } from "next/server";
import { validateGoogleToken, extractBearerToken } from "@/lib/auth";
import { contextCache } from "@/lib/cache";
import {
    fetchUpcomingEvents,
    formatEventsForPrompt,
    fetchPendingTasks,
    parseNotionDatabaseIds,
    formatTasksForPrompt,
    sendChatMessage,
} from "@/lib/services";
import type { ChatRequest, ChatResponse, ContextData } from "@/types";

export async function POST(req: NextRequest) {
    try {
        // 1. Autenticación
        const token = extractBearerToken(req.headers.get("Authorization"));
        if (!token) {
            return NextResponse.json(
                { error: "Missing Authorization header" },
                { status: 401 }
            );
        }

        const user = await validateGoogleToken(token);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { message, history }: ChatRequest = await req.json();

        // 2. Obtener contexto (con caché)
        const userId = user.sub ?? user.email;
        let contextData: ContextData | null = contextCache.get(userId);

        if (!contextData) {
            contextData = { events: [], tasks: [] };

            // Fetch Calendar
            try {
                contextData.events = await fetchUpcomingEvents(token);
            } catch (error) {
                console.error("[Chat/Calendar] Error:", error);
            }

            // Fetch Notion
            const notionToken = process.env.NOTION_TOKEN;
            const dbIds = parseNotionDatabaseIds();

            if (notionToken && dbIds.length > 0) {
                try {
                    contextData.tasks = await fetchPendingTasks(notionToken, dbIds);
                } catch (error) {
                    console.error("[Chat/Notion] Error:", error);
                }
            }

            // Guardar en caché
            contextCache.set(userId, contextData);
        }

        // 3. Enviar mensaje a Gemini
        const formattedEvents = formatEventsForPrompt(contextData.events);
        const formattedTasks = formatTasksForPrompt(contextData.tasks);

        const response = await sendChatMessage(
            user.name || user.email,
            formattedEvents,
            formattedTasks,
            history || [],
            message
        );

        const chatResponse: ChatResponse = { response };
        return NextResponse.json(chatResponse);
    } catch (error) {
        console.error("[Chat API] Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
