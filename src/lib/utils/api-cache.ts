/**
 * Utilitaire pour gérer le cache des appels API et éviter les requêtes redondantes
 */

import { useCallback, useEffect, useState } from "react";

interface CacheEntry {
  data: any;
  timestamp: number;
  promise?: Promise<any>;
}

class ApiCache {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTtl = 2 * 60 * 1000; // 2 minutes par défaut

  /**
   * Récupère des données depuis le cache ou exécute la fonction si nécessaire
   */
  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.defaultTtl
  ): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);

    // Si on a des données en cache et qu'elles sont encore valides
    if (cached && (now - cached.timestamp) < ttl) {
      // Si une promesse est en cours, l'attendre
      if (cached.promise) {
        return cached.promise;
      }
      return cached.data;
    }

    // Si une requête est déjà en cours pour cette clé
    if (cached?.promise) {
      return cached.promise;
    }

    // Créer une nouvelle promesse et la mettre en cache
    const promise = fetchFn().then(data => {
      // Mettre à jour le cache avec les données
      this.cache.set(key, {
        data,
        timestamp: now,
      });
      return data;
    }).catch(error => {
      // Supprimer l'entrée en cas d'erreur
      this.cache.delete(key);
      throw error;
    });

    // Mettre la promesse en cache temporairement
    this.cache.set(key, {
      data: null,
      timestamp: now,
      promise,
    });

    return promise;
  }

  /**
   * Invalide une entrée du cache
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalide toutes les entrées qui correspondent au pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Nettoie les entrées expirées
   */
  cleanup(ttl: number = this.defaultTtl): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if ((now - entry.timestamp) > ttl && !entry.promise) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Vide complètement le cache
   */
  clear(): void {
    this.cache.clear();
  }
}

// Instance globale du cache
export const apiCache = new ApiCache();

// Hook pour utiliser le cache dans les composants React
export function useCachedApi<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCache.get(key, fetchFn, ttl);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [key, fetchFn, ttl]);

  const refetch = useCallback(async () => {
    apiCache.invalidate(key);
    await fetchData();
  }, [key, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}