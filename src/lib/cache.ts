import type { ContextData } from "@/types";
import { CONTEXT_CACHE_TTL_MS } from "./constants";

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

/**
 * Caché en memoria para contexto de usuario.
 * En producción, considerar Redis o similar para persistencia entre instancias.
 */
class ContextCache {
    private cache = new Map<string, CacheEntry<ContextData>>();
    private ttl: number;

    constructor(ttlMs: number = CONTEXT_CACHE_TTL_MS) {
        this.ttl = ttlMs;
    }

    /**
     * Obtiene datos del caché si existen y no han expirado.
     */
    get(userId: string): ContextData | null {
        const entry = this.cache.get(userId);

        if (!entry) {
            return null;
        }

        const isExpired = Date.now() - entry.timestamp > this.ttl;

        if (isExpired) {
            this.cache.delete(userId);
            return null;
        }

        return entry.data;
    }

    /**
     * Almacena datos en el caché.
     */
    set(userId: string, data: ContextData): void {
        this.cache.set(userId, {
            data,
            timestamp: Date.now(),
        });
    }

    /**
     * Invalida el caché para un usuario específico.
     */
    invalidate(userId: string): void {
        this.cache.delete(userId);
    }

    /**
     * Limpia todo el caché.
     */
    clear(): void {
        this.cache.clear();
    }
}

// Singleton para uso global
export const contextCache = new ContextCache();
