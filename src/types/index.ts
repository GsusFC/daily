// ============================================
// Tipos centralizados para Daily Summary App
// ============================================

// --- Auth & User ---
export interface User {
    email: string;
    name: string;
    picture: string;
    hd?: string; // Hosted Domain (Google Workspace)
    sub?: string; // Google User ID
}

export interface GoogleTokenPayload extends User {
    iss: string;
    azp: string;
    aud: string;
    iat: number;
    exp: number;
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
}

// --- Chat ---
export interface Message {
    role: "user" | "model";
    parts: { text: string }[];
}

export interface ChatRequest {
    message: string;
    history: Message[];
}

export interface ChatResponse {
    response: string;
    error?: string;
}

// --- Calendar ---
export interface CalendarEvent {
    id: string;
    summary: string;
    description?: string;
    start: {
        dateTime?: string;
        date?: string;
        timeZone?: string;
    };
    end: {
        dateTime?: string;
        date?: string;
        timeZone?: string;
    };
    location?: string;
    attendees?: Array<{
        email: string;
        displayName?: string;
        responseStatus?: string;
    }>;
}

export interface FormattedEvent {
    title: string;
    start: string;
    end: string;
    location?: string;
}

// --- Notion ---
export interface NotionTask {
    id: string;
    properties: {
        Name?: {
            title: Array<{ plain_text: string }>;
        };
        Status?: {
            status: { name: string };
        };
        Priority?: {
            select: { name: string } | null;
        };
        "Due Date"?: {
            date: { start: string; end?: string } | null;
        };
        // Propiedades dinámicas para buscar responsables
        [key: string]: any;
    };
}

export interface DatabaseGroup {
    id: string;
    title: string;
    tasks: NotionTask[];
}

export interface FormattedTask {
    title: string;
    status: string;
    priority?: string;
    dueDate?: string;
    assignees?: string[];
    project?: string;
}

export interface FormattedTaskGroup {
    dbTitle: string;
    tasks: FormattedTask[];
}

// --- API Responses ---
export interface ContextData {
    events: CalendarEvent[];
    taskGroups: DatabaseGroup[];
}

export interface DailySummaryResponse {
    summary: string;
    warnings?: string[];
    rawData: {
        events: CalendarEvent[];
        tasks: NotionTask[]; // Mantenemos aplanado en rawData por compatibilidad frontend
    };
}

export interface ApiError {
    error: string;
    code?: string;
}
