"use client";

import Login from "@/components/Login";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import ChatInterface from "@/components/ChatInterface";

export default function Home() {
    const { user, token, login } = useAuth();
    const [summary, setSummary] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchSummary = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch("/api/daily-summary", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (data.summary) {
                setSummary(data.summary);
            } else {
                console.error("No summary returned", data);
            }
        } catch (error) {
            console.error("Error fetching summary", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center p-8 md:p-24 bg-gray-50 dark:bg-zinc-900">
            <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex mb-12">
                <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
                    Daily Summary App
                </p>
                <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <img
                                src={user.picture}
                                alt={user.name}
                                className="w-10 h-10 rounded-full"
                            />
                            <span className="hidden md:block">{user.name}</span>
                        </div>
                    ) : (
                        <span>Not logged in</span>
                    )}
                </div>
            </div>

            {!user ? (
                <div className="flex flex-col items-center justify-center flex-1">
                    <h1 className="text-4xl font-bold mb-8 text-center">
                        Welcome to your Daily Executive Summary
                    </h1>
                    <Login onLoginSuccess={login} />
                </div>
            ) : (
                <div className="w-full max-w-3xl">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-bold">Good Morning, {user.name.split(" ")[0]}</h2>
                        <button
                            onClick={fetchSummary}
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? "Generating..." : "Refresh Summary"}
                        </button>
                    </div>

                    {summary ? (
                        <div className="bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-lg prose dark:prose-invert max-w-none">
                            <ReactMarkdown>{summary}</ReactMarkdown>
                        </div>
                    ) : (
                        <div className="text-center py-20 text-gray-500">
                            <p>Click "Refresh Summary" to generate your daily briefing.</p>
                        </div>
                    )}

                    <ChatInterface />
                </div>
            )}
        </main>
    );
}
