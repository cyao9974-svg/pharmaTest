import { BaseScraper, ScraperQuery } from './baseScraper.js';
import { ScrapedPharmacyResult } from '../types/index.js';
import { HttpClient } from '../utils/httpClient.js';
import { HtmlPharmacyParser } from '../parsers/htmlParser.js';

export class DirectoryScraper implements BaseScraper {
  public readonly name = 'Annuaire Public Santé CI';
  public readonly description = 'Répertoire public des établissements de santé et officines de Côte d\'Ivoire';

  public async scrape(query: ScraperQuery): Promise<ScrapedPharmacyResult[]> {
    const results: ScrapedPharmacyResult[] = [];

    // Query public health directory search endpoints
    // Note: Responsible scraping practices: rate-limited, public URLs only
    const targetUrls = [
      `https://nominatim.openstreetmap.org/search?q=pharmacie+Bingerville+Abidjan&format=json&addressdetails=1&limit=10`,
    ];

    for (const url of targetUrls) {
      try {
        const text = await HttpClient.get(url);
        // If JSON array is returned
        if (text.trim().startsWith('[')) {
          const items = JSON.parse(text);
          if (Array.isArray(items)) {
            for (const item of items) {
              const displayName = item.display_name || '';
              const parts = displayName.split(',');
              const nameCandidate = parts[0] || '';
              if (!nameCandidate.toLowerCase().includes('pharmacie')) continue;

              const lat = parseFloat(item.lat);
              const lon = parseFloat(item.lon);

              results.push({
                name: nameCandidate.trim(),
                phone: null,
                email: null,
                address: displayName,
                city: query.city || 'Bingerville',
                country: query.country || "Côte d'Ivoire",
                latitude: isNaN(lat) ? null : lat,
                longitude: isNaN(lon) ? null : lon,
                sourceName: this.name,
                sourceUrl: `https://nominatim.openstreetmap.org/ui/details.html?osmtype=N&osmid=${item.place_id}`,
                gardeStatus: 'inconnu',
                notes: 'Collecté depuis les répertoires publics géoréférencés',
              });
            }
          }
        } else {
          // HTML parsing
          const parsed = HtmlPharmacyParser.parseDirectoryHtml(text, this.name, url);
          results.push(...parsed);
        }
      } catch (err) {
        console.warn(`[DirectoryScraper] Request to ${url} failed:`, (err as Error).message);
      }
    }

    return results;
  }
}
