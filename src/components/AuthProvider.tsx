"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { ReactNode } from "react";
import { AuthContextProvider } from "@/context/AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
        console.warn("Google Client ID is missing in environment variables.");
        // In a real app, you might want to render an error or fallback here
        // For now, we'll proceed but the Google Login button won't work correctly
    }

    return (
        <GoogleOAuthProvider clientId={clientId || ""}>
            <AuthContextProvider>{children}</AuthContextProvider>
        </GoogleOAuthProvider>
    );
}
