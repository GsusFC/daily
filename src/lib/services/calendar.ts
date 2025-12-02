import { google } from "googleapis";
import type { CalendarEvent, FormattedEvent } from "@/types";
import { GOOGLE_PRIMARY_CALENDAR } from "@/lib/constants";

/**
 * Obtiene los eventos del calendario para el día actual.
 *
 * NOTA: Actualmente usa el ID Token como Access Token, lo cual es incorrecto.
 * TODO: Implementar OAuth 2.0 completo con scopes de Calendar.
 *
 * @param accessToken - Access Token de Google (no ID Token)
 * @returns Lista de eventos del día
 */
export async function fetchTodayEvents(
    accessToken: string
): Promise<CalendarEvent[]> {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const timeMin = new Date();
    timeMin.setHours(0, 0, 0, 0);

    const timeMax = new Date();
    timeMax.setHours(23, 59, 59, 999);

    console.log(`[Calendar] Fetching events from ${timeMin.toISOString()} to ${timeMax.toISOString()}`);

    const response = await calendar.events.list({
        calendarId: GOOGLE_PRIMARY_CALENDAR,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Forzar zona horaria local
    });

    return (response.data.items as CalendarEvent[]) || [];
}

/**
 * Obtiene eventos para las próximas 24 horas (usado en chat).
 */
export async function fetchUpcomingEvents(
    accessToken: string
): Promise<CalendarEvent[]> {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const response = await calendar.events.list({
        calendarId: GOOGLE_PRIMARY_CALENDAR,
        timeMin: new Date().toISOString(),
        timeMax: new Date(Date.now() + 86400000).toISOString(),
        singleEvents: true,
        orderBy: "startTime",
    });

    return (response.data.items as CalendarEvent[]) || [];
}

/**
 * Formatea eventos para reducir tokens en prompts de Gemini.
 */
export function formatEventsForPrompt(events: CalendarEvent[]): FormattedEvent[] {
    return events.map((event) => ({
        title: event.summary || "Sin título",
        start: event.start.dateTime || event.start.date || "",
        end: event.end.dateTime || event.end.date || "",
        location: event.location,
    }));
}
