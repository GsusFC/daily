"use client";

import Login from "@/components/Login";
import { useAuth } from "@/context/AuthContext";
import ReactMarkdown from "react-markdown";
import ChatInterface from "@/components/ChatInterface";
import { useDailySummary } from "@/hooks";

export default function Home() {
    const { user, login, logout } = useAuth();
    const { summary, warnings, loading, error, fetchSummary } = useDailySummary();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Buenos días";
        if (hour < 18) return "Buenas tardes";
        return "Buenas noches";
    };

    return (
        <main className="flex min-h-screen flex-col items-center bg-[#F5F5F7] dark:bg-black text-[#1D1D1F] dark:text-[#F5F5F7] font-sans transition-colors duration-300">
            {/* Sticky Glassmorphism Header */}
            <header className="sticky top-0 z-50 w-full border-b border-white/50 dark:border-white/10 bg-white/70 dark:bg-black/70 backdrop-blur-xl transition-all">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between relative">
                    {/* Logo Area */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                            <span className="text-white dark:text-black font-bold text-lg">D</span>
                        </div>
                        <span className="font-semibold tracking-tight text-sm md:text-base opacity-90 hidden sm:block">
                            Daily Summary
                        </span>
                    </div>
                    
                    {/* Center Action Button (Desktop) */}
                    {user && (
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                            <button
                                onClick={fetchSummary}
                                disabled={loading}
                                className="group flex items-center gap-2 px-4 py-1.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-black dark:text-white rounded-full text-xs font-medium transition-all border border-transparent hover:border-black/5 dark:hover:border-white/5 backdrop-blur-md"
                            >
                                {loading ? (
                                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                )}
                                {loading ? "Generando..." : "Actualizar"}
                            </button>
                        </div>
                    )}
                    
                    {/* User Nav */}
                    <nav className="flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-3 pl-4">
                                <div className="text-right hidden lg:block">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{getGreeting()},</p>
                                    <p className="text-sm font-semibold text-black dark:text-white leading-none">{user.name}</p>
                                </div>
                                <img
                                    src={user.picture}
                                    alt="Profile"
                                    className="w-9 h-9 rounded-full ring-2 ring-white dark:ring-white/10 shadow-sm"
                                />
                                <button
                                    onClick={logout}
                                    className="text-xs font-medium text-gray-500 hover:text-red-500 dark:text-gray-400 transition-colors ml-1"
                                >
                                    Salir
                                </button>
                            </div>
                        ) : (
                            <span className="text-sm font-medium text-gray-500">Invitado</span>
                        )}
                    </nav>
                </div>
            </header>

            {!user ? (
                <section className="flex flex-col items-center justify-center flex-1 w-full max-w-md px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="text-center mb-8 space-y-3">
                        <h1 className="text-4xl font-bold tracking-tighter text-black dark:text-white">
                            Tu día, <br/> simplificado.
                        </h1>
                        <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
                            Conecta tu calendario y tareas para obtener un briefing ejecutivo impulsado por IA.
                        </p>
                    </div>
                    
                    <div className="w-full p-6 bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-zinc-800">
                        <Login onLoginSuccess={login} />
                    </div>
                </section>
            ) : (
                <section className="w-full max-w-7xl px-4 py-6 animate-in fade-in duration-500 relative flex-1 flex flex-col overflow-hidden">
                    
                    {/* Global Toasts (Fixed Bottom Right) */}
                    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
                        {warnings.length > 0 && (
                            <div className="pointer-events-auto p-4 bg-amber-50/90 dark:bg-amber-900/90 border border-amber-200/50 dark:border-amber-800/30 text-amber-800 dark:text-amber-200 rounded-2xl text-sm backdrop-blur-md shadow-lg max-w-sm animate-in slide-in-from-right-4 duration-300" role="alert">
                                <div className="flex items-start gap-2">
                                    <svg className="w-5 h-5 flex-shrink-0 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                    <ul className="list-disc list-inside space-y-0.5">
                                        {warnings.map((w, i) => (
                                            <li key={i}>{w}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="pointer-events-auto p-4 bg-red-50/90 dark:bg-red-900/90 border border-red-200/50 dark:border-red-800/30 text-red-700 dark:text-red-200 rounded-2xl text-sm backdrop-blur-md shadow-lg max-w-sm animate-in slide-in-from-right-4 duration-300" role="alert">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 flex-shrink-0 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    <span>{error}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dashboard Content (Full Height Grid) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                        {/* Columna Izquierda: Resumen */}
                        <div className="h-full min-h-0">
                            <div className={`h-full transition-all duration-500 ease-out ${summary ? 'opacity-100 translate-y-0' : 'opacity-100'}`}>
                                {summary ? (
                                    <article className="bg-white dark:bg-[#1C1C1E] p-6 md:p-8 rounded-[32px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100/50 dark:border-white/5 h-full overflow-y-auto custom-scrollbar">
                                        <div className="prose prose-sm prose-slate dark:prose-invert max-w-none 
                                            prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-black dark:prose-headings:text-white prose-headings:mb-3 prose-headings:mt-6 first:prose-headings:mt-0
                                            prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-3
                                            prose-li:text-gray-600 dark:prose-li:text-gray-300 prose-li:my-1
                                            prose-strong:text-gray-900 dark:prose-strong:text-gray-100">
                                            <ReactMarkdown>{summary}</ReactMarkdown>
                                        </div>
                                    </article>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full bg-white/50 dark:bg-white/5 rounded-[32px] border border-dashed border-gray-300 dark:border-white/10 text-center min-h-[400px]">
                                        <div className="w-14 h-14 bg-gray-100 dark:bg-white/10 rounded-2xl flex items-center justify-center mb-4 text-gray-400 transform rotate-3">
                                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tu Resumen Diario</h3>
                                        <p className="text-gray-500 text-sm max-w-xs mt-2 leading-relaxed">
                                            Haz clic en el botón de la barra superior para generar tu briefing ejecutivo.
                                        </p>
                                        <button 
                                            onClick={fetchSummary} 
                                            className="md:hidden mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-blue-600/20"
                                        >
                                            Generar ahora
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Columna Derecha: Chat */}
                        <div className="h-full min-h-[500px]">
                            <ChatInterface />
                        </div>
                    </div>
                </section>
            )}
        </main>
    );
}
