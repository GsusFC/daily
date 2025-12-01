"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import ReactMarkdown from "react-markdown";

interface Message {
    role: "user" | "model";
    parts: { text: string }[];
}

export default function ChatInterface() {
    const { token } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || !token) return;

        const userMsg: Message = { role: "user", parts: [{ text: input }] };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    message: input,
                    history: messages, // Send previous history for context
                }),
            });

            const data = await res.json();
            if (data.response) {
                const modelMsg: Message = { role: "model", parts: [{ text: data.response }] };
                setMessages((prev) => [...prev, modelMsg]);
            }
        } catch (error) {
            console.error("Chat error", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-3xl mt-12 bg-white dark:bg-zinc-800 rounded-2xl shadow-lg overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900">
                <h3 className="font-semibold">Ask Gemini (Context Aware)</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-10">
                        Ask about your schedule, tasks, or anything else!
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                            }`}
                    >
                        <div
                            className={`max-w-[80%] p-3 rounded-lg ${msg.role === "user"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 dark:bg-zinc-700"
                                }`}
                        >
                            <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-zinc-700 p-3 rounded-lg animate-pulse">
                            Thinking...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Ex: When is my next meeting?"
                        className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-zinc-600 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
