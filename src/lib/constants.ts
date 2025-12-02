// ============================================
// Constantes centralizadas
// ============================================

// --- Gemini ---
export const GEMINI_MODEL = "gemini-2.0-flash";

// --- Google Calendar ---
export const GOOGLE_PRIMARY_CALENDAR = "primary";
export const CALENDAR_FETCH_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 horas

// --- Notion ---
export const NOTION_STATUS_PROPERTY = "Status";
export const NOTION_DONE_STATUS = "Done";
export const NOTION_PAGE_SIZE = 50;

// --- Cache ---
export const CONTEXT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

// --- Date Formatting ---
export const DATE_LOCALE = "es-ES";
export const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
};
