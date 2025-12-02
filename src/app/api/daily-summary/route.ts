import { NextRequest, NextResponse } from "next/server";
import { validateGoogleToken, extractBearerToken } from "@/lib/auth";
import {
    fetchTodayEvents,
    formatEventsForPrompt,
    fetchPendingTasks,
    parseNotionDatabaseIds,
    formatTasksForPrompt,
    generateDailySummary,
} from "@/lib/services";
import type { CalendarEvent, NotionTask, DailySummaryResponse, DatabaseGroup } from "@/types";

export async function POST(req: NextRequest) {
    const warnings: string[] = [];

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

        // 2. Fetch Google Calendar Events
        let eventsData: CalendarEvent[] = [];
        try {
            eventsData = await fetchTodayEvents(token);
        } catch (error) {
            console.error("[Calendar] Error:", error);
            warnings.push("No se pudo acceder al calendario");
        }

        // 3. Fetch Notion Tasks
        let taskGroups: DatabaseGroup[] = [];
        let allTasks: NotionTask[] = [];
        
        const notionToken = process.env.NOTION_TOKEN;
        const dbIds = parseNotionDatabaseIds();

        if (notionToken && dbIds.length > 0) {
            try {
                taskGroups = await fetchPendingTasks(notionToken, dbIds);
                allTasks = taskGroups.flatMap(g => g.tasks);
                console.log(`[Notion] Fetched ${allTasks.length} tasks from ${taskGroups.length} databases`);
            } catch (error) {
                console.error("[Notion] Error:", error);
                warnings.push("No se pudo acceder a Notion");
            }
        }

        // 4. Generate Summary with Gemini
        let summary = "No hay datos disponibles para generar el resumen.";

        if (process.env.GEMINI_API_KEY) {
            try {
                const formattedEvents = formatEventsForPrompt(eventsData);
                // formatTasksForPrompt ahora espera DatabaseGroup[]
                const formattedTaskGroups = formatTasksForPrompt(taskGroups);

                summary = await generateDailySummary(
                    user.name || user.email,
                    formattedEvents,
                    formattedTaskGroups
                );
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                console.error("[Gemini] Error:", errorMessage);
                summary = `Error generando resumen: ${errorMessage}`;
            }
        }

        const response: DailySummaryResponse = {
            summary,
            warnings: warnings.length > 0 ? warnings : undefined,
            rawData: {
                events: eventsData,
                tasks: allTasks, // Devolvemos aplanado para compatibilidad
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("[API] Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
