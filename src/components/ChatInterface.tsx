"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useChat } from "@/hooks";
import { useAuth } from "@/context/AuthContext";

// Iconos SVG inline para diseño limpio
const BotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-blue-600"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-500"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
);

const SUGGESTIONS = [
    "¿Qué eventos tengo hoy?",
    "Resumen de mis tareas pendientes",
    "¿Tengo hueco a las 3pm?",
    "Prioridades del día"
];

export default function ChatInterface() {
    const { messages, loading, sendMessage, messagesEndRef } = useChat();
    const { user } = useAuth();
    const [input, setInput] = useState("");

    const handleSend = (text: string = input) => {
        if (!text.trim()) return;
        sendMessage(text);
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <section className="w-full flex flex-col h-[500px] lg:h-full max-h-[600px] bg-white dark:bg-[#1C1C1E] rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100/50 dark:border-white/5 overflow-hidden transition-all">
            {/* Header */}
            <header className="px-5 py-3 border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-md flex items-center gap-2.5 sticky top-0 z-10">
                <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                    <BotIcon />
                </div>
                <div>
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 tracking-tight">Asistente</h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Contexto activo</p>
                </div>
            </header>

            {/* Chat Area */}
            <div 
                className="flex-1 overflow-y-auto p-5 space-y-5 scroll-smooth bg-white dark:bg-[#1C1C1E]"
                role="log" 
                aria-live="polite"
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 text-center px-4">
                        <div className="w-12 h-12 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                            <BotIcon />
                        </div>
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1.5 tracking-tight">¿En qué te ayudo?</h4>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs text-xs leading-relaxed">
                            Analizo tu calendario y tareas para organizarte.
                        </p>
                        
                        <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
                            {SUGGESTIONS.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(suggestion)}
                                    className="text-xs text-left px-3 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-500/10 transition-all text-gray-600 dark:text-gray-300 font-medium active:scale-[0.98]"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} group animate-in slide-in-from-bottom-2 duration-300`}
                        >
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center shadow-sm mt-0.5 ${
                                msg.role === "user" ? "bg-gray-100 dark:bg-white/10" : "bg-blue-50 dark:bg-blue-500/10"
                            }`}>
                                {msg.role === "user" ? (
                                    user?.picture ? <img src={user.picture} alt="User" className="w-6 h-6 rounded-full" /> : <UserIcon />
                                ) : (
                                    <BotIcon />
                                )}
                            </div>
                            
                            <div
                                className={`max-w-[85%] px-4 py-2.5 rounded-xl text-sm leading-relaxed shadow-sm ${
                                    msg.role === "user"
                                        ? "bg-black dark:bg-white text-white dark:text-black rounded-tr-sm"
                                        : "bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-200 rounded-tl-sm"
                                }`}
                            >
                                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:my-0 prose-pre:my-2 prose-pre:bg-black/5 dark:prose-pre:bg-white/5 prose-pre:rounded-lg">
                                    <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {loading && (
                    <div className="flex gap-3 animate-in fade-in duration-300">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mt-0.5">
                            <BotIcon />
                        </div>
                        <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 px-3 py-3 rounded-xl rounded-tl-sm flex items-center gap-1 h-[38px]">
                            <span className="w-1 h-1 bg-gray-400 rounded-full animate-[bounce_1s_infinite_0ms]"></span>
                            <span className="w-1 h-1 bg-gray-400 rounded-full animate-[bounce_1s_infinite_200ms]"></span>
                            <span className="w-1 h-1 bg-gray-400 rounded-full animate-[bounce_1s_infinite_400ms]"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <footer className="p-3 bg-white dark:bg-[#1C1C1E] border-t border-gray-100 dark:border-white/5">
                <div className="relative flex items-center gap-2 max-w-full">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribe..."
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-black focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 transition-all text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 shadow-sm"
                        disabled={loading}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={loading || !input.trim()}
                        className="absolute right-1.5 p-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-md"
                        aria-label="Enviar"
                    >
                        <SendIcon />
                    </button>
                </div>
            </footer>
        </section>
    );
}
