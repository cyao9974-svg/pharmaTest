import { ScrapedPharmacyResult } from '../types/index.js';

interface CacheEntry {
  timestamp: number;
  results: ScrapedPharmacyResult[];
  query: string;
}

export class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheEntry> = new Map();
  // Cache TTL: 30 minutes
  private ttlMs = 30 * 60 * 1000;

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private makeKey(query: string, city: string): string {
    return `${city.trim().toLowerCase()}_${query.trim().toLowerCase()}`;
  }

  public get(query: string, city: string): { hit: boolean; results?: ScrapedPharmacyResult[]; ageSeconds?: number } {
    const key = this.makeKey(query, city);
    const entry = this.cache.get(key);

    if (!entry) return { hit: false };

    const age = Date.now() - entry.timestamp;
    if (age > this.ttlMs) {
      this.cache.delete(key);
      return { hit: false };
    }

    return {
      hit: true,
      results: entry.results,
      ageSeconds: Math.round(age / 1000),
    };
  }

  public set(query: string, city: string, results: ScrapedPharmacyResult[]): void {
    const key = this.makeKey(query, city);
    this.cache.set(key, {
      timestamp: Date.now(),
      results,
      query,
    });
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const cache = CacheService.getInstance();
