import { ScrapedPharmacyResult } from '../types/index.js';

export interface ScraperQuery {
  city: string;
  country: string;
  term?: string;
}

export interface BaseScraper {
  readonly name: string;
  readonly description: string;
  scrape(query: ScraperQuery): Promise<ScrapedPharmacyResult[]>;
}
