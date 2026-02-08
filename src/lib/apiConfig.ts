// frontend/src/lib/apiConfig.ts

// API Configuration
export const API_CONFIG = {
  MANGADEX_BASE_URL: 'https://api.mangadex.org',
  MANGADEX_UPLOADS_URL: 'https://uploads.mangadex.org',
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  REQUEST_TIMEOUT: 10000, // 10 seconds
  MAX_RETRIES: 3,
};

// Simple in-memory cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, duration = API_CONFIG.CACHE_DURATION): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + duration,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.timestamp) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

export const apiCache = new APICache();

// API Request wrapper with retry logic
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  retries = API_CONFIG.MAX_RETRIES
): Promise<T> {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  
  // Check cache first
  const cached = apiCache.get<T>(cacheKey);
  if (cached) {
    return cached;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Check content type before parsing
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Expected JSON but got:', contentType);
      console.error('Response preview:', text.substring(0, 500));
      throw new Error(`Invalid response type: ${contentType}. Expected JSON.`);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cache successful responses
    apiCache.set(cacheKey, data);
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (retries > 0 && error instanceof Error) {
      // Retry on network errors
      if (error.name === 'AbortError' || error.message.includes('fetch')) {
        console.warn(`Retrying request (${retries} attempts left)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return apiRequest<T>(url, options, retries - 1);
      }
    }

    throw error;
  }
}

// Rate limiting helper
class RateLimiter {
  private queue: Array<() => void> = [];
  private running = 0;
  private maxConcurrent = 5;

  async add<T>(fn: () => Promise<T>): Promise<T> {
    if (this.running >= this.maxConcurrent) {
      await new Promise<void>(resolve => this.queue.push(resolve));
    }

    this.running++;
    try {
      return await fn();
    } finally {
      this.running--;
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

export const rateLimiter = new RateLimiter();