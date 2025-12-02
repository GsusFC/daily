import { OAuth2Client } from "google-auth-library";
import type { GoogleTokenPayload } from "@/types";

// Usar GOOGLE_CLIENT_ID del servidor, con fallback a NEXT_PUBLIC_
const getClientId = () =>
    process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/**
 * Valida un token de Google (ID Token o Access Token).
 *
 * @param token - Token recibido del cliente
 * @returns Payload del usuario validado o null si es inválido
 */
export async function validateGoogleToken(
    token: string
): Promise<GoogleTokenPayload | null> {
    const clientId = getClientId();

    if (!clientId) {
        console.error("[Auth] GOOGLE_CLIENT_ID not configured");
        return null;
    }

    const client = new OAuth2Client(clientId);

    try {
        // Intentar validar como ID Token (JWT)
        // Esto fallará si es un Access Token opaco, lo cual es esperado
        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: clientId,
            });
            return mapPayloadToUser(ticket.getPayload()!);
        } catch {
            // Si falla, asumir que es un Access Token y validarlo
            const tokenInfo = await client.getTokenInfo(token);
            
            // Verificar que el token fue emitido para nuestra app
            if (tokenInfo.aud !== clientId) {
                console.error("[Auth] Token audience mismatch");
                return null;
            }

            // Si es válido, obtener info del perfil para llenar el objeto User
            const userInfoRes = await fetch(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            
            if (!userInfoRes.ok) return null;
            
            const userInfo = await userInfoRes.json();
            
            return {
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
                hd: userInfo.hd,
                sub: userInfo.sub,
                iss: "https://accounts.google.com",
                azp: clientId,
                aud: clientId,
                iat: Date.now() / 1000,
                exp: tokenInfo.expiry_date ? tokenInfo.expiry_date / 1000 : 0,
            };
        }
    } catch (error) {
        console.error("[Auth] Token validation failed:", error);
        return null;
    }
}

function mapPayloadToUser(payload: any): GoogleTokenPayload | null {
    if (!payload) return null;

    // Validación de dominio (opcional)
    const allowedDomain = process.env.ALLOWED_DOMAIN;
    if (allowedDomain && payload.hd !== allowedDomain) {
        console.warn(`[Auth] Domain mismatch: expected ${allowedDomain}`);
        return null;
    }

    return {
        email: payload.email ?? "",
        name: payload.name ?? "",
        picture: payload.picture ?? "",
        hd: payload.hd,
        sub: payload.sub,
        iss: payload.iss,
        azp: payload.azp ?? "",
        aud: typeof payload.aud === "string" ? payload.aud : payload.aud[0],
        iat: payload.iat ?? 0,
        exp: payload.exp ?? 0,
    };
}

/**
 * Extrae el token Bearer del header Authorization.
 *
 * @param authHeader - Header Authorization completo
 * @returns Token extraído o null
 */
export function extractBearerToken(authHeader: string | null): string | null {
    if (!authHeader?.startsWith("Bearer ")) {
        return null;
    }
    return authHeader.slice(7);
}
