"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import type { DailySummaryResponse } from "@/types";

interface UseDailySummaryReturn {
    summary: string | null;
    warnings: string[];
    loading: boolean;
    error: string | null;
    fetchSummary: () => Promise<void>;
}

/**
 * Hook para obtener el resumen ejecutivo diario.
 */
export function useDailySummary(): UseDailySummaryReturn {
    const { token } = useAuth();
    const [summary, setSummary] = useState<string | null>(null);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSummary = useCallback(async () => {
        if (!token) {
            setError("No hay sesión activa");
            return;
        }

        setLoading(true);
        setError(null);
        setWarnings([]);

        try {
            const res = await fetch("/api/daily-summary", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data: DailySummaryResponse = await res.json();

            if (!res.ok) {
                const errorMsg = (data as unknown as { error: string }).error || "Error desconocido";
                
                // Traducir errores comunes a mensajes amigables
                if (res.status === 401 || errorMsg.includes("Unauthorized")) {
                    throw new Error("Tu sesión ha expirado o no es válida. Por favor, cierra sesión y vuelve a entrar.");
                }
                if (res.status === 500) {
                    throw new Error("Error interno del servidor. Revisa la configuración de claves API.");
                }
                
                throw new Error(errorMsg);
            }

            setSummary(data.summary);
            setWarnings(data.warnings ?? []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Error desconocido";
            console.error("[useDailySummary] Error:", errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [token]);

    return { summary, warnings, loading, error, fetchSummary };
}
