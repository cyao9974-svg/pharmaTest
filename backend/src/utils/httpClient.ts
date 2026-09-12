/**
 * Polite HTTP client for scraping public health and pharmacy open data.
 * Adheres to responsible scraping rules: explicit User-Agent, timeouts, rate-limiting, and error handling.
 */

const DEFAULT_TIMEOUT_MS = 8000;
const USER_AGENT = 'PharmaGuard-Bingerville/1.0 (Public Health Open Data Collector; Côte d\'Ivoire; contact@pharmaguard.ci)';

export class HttpClient {
  private static lastRequestTimestamp = 0;
  private static minDelayBetweenRequestsMs = 500;

  /**
   * Enforces rate limiting between requests to external servers.
   */
  private static async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTimestamp;
    if (elapsed < this.minDelayBetweenRequestsMs) {
      const waitTime = this.minDelayBetweenRequestsMs - elapsed;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.lastRequestTimestamp = Date.now();
  }

  /**
   * Executes a polite GET request with timeout and custom headers.
   */
  public static async get(url: string, headers: Record<string, string> = {}): Promise<string> {
    await this.throttle();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/json,text/plain;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          ...headers,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Executes a polite JSON GET request with timeout.
   */
  public static async getJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
    const text = await this.get(url, {
      'Accept': 'application/json, text/plain',
      ...headers,
    });
    return JSON.parse(text) as T;
  }
}
