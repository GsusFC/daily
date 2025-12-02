"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import type { Message, ChatResponse } from "@/types";

interface UseChatReturn {
    messages: Message[];
    loading: boolean;
    error: string | null;
    sendMessage: (text: string) => Promise<void>;
    clearMessages: () => void;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Hook para manejar el chat con Gemini.
 */
export function useChat(): UseChatReturn {
    const { token } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // Auto-scroll al final cuando hay nuevos mensajes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = useCallback(
        async (text: string) => {
            if (!text.trim() || !token) return;

            const userMsg: Message = { role: "user", parts: [{ text }] };
            setMessages((prev) => [...prev, userMsg]);
            setLoading(true);
            setError(null);

            try {
                const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        message: text,
                        history: messages,
                    }),
                });

                const data: ChatResponse = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Error en el chat");
                }

                if (data.response) {
                    const modelMsg: Message = {
                        role: "model",
                        parts: [{ text: data.response }],
                    };
                    setMessages((prev) => [...prev, modelMsg]);
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Error desconocido";
                console.error("[useChat] Error:", errorMessage);
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        },
        [token, messages]
    );

    const clearMessages = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    return {
        messages,
        loading,
        error,
        sendMessage,
        clearMessages,
        messagesEndRef,
    };
}
