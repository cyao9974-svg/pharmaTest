import { BaseScraper, ScraperQuery } from './baseScraper.js';
import { ScrapedPharmacyResult } from '../types/index.js';
import { HttpClient } from '../utils/httpClient.js';

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: {
    name?: string;
    'contact:phone'?: string;
    phone?: string;
    'contact:email'?: string;
    email?: string;
    'addr:street'?: string;
    'addr:city'?: string;
    'addr:suburb'?: string;
    opening_hours?: string;
    operator?: string;
    description?: string;
  };
}

interface OverpassResponse {
  elements: OverpassElement[];
}

interface NominatimPlace {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    pharmacy?: string;
    road?: string;
    suburb?: string;
    town?: string;
    city?: string;
    country?: string;
  };
}

export class OsmScraper implements BaseScraper {
  public readonly name = 'OpenStreetMap (OSM Overpass & Nominatim)';
  public readonly description = 'Données géographiques et cartographiques publiques d\'OpenStreetMap pour Bingerville';

  public async scrape(query: ScraperQuery): Promise<ScrapedPharmacyResult[]> {
    const results: ScrapedPharmacyResult[] = [];

    // Attempt 1: Overpass API query for amenity=pharmacy within Bingerville bounding box
    // Lat: 5.33 to 5.42, Lon: -3.95 to -3.85 (Bingerville area)
    const overpassQuery = `[out:json][timeout:10];
(
  node["amenity"="pharmacy"](5.33,-3.95,5.42,-3.85);
  way["amenity"="pharmacy"](5.33,-3.95,5.42,-3.85);
);
out body center;`;

    try {
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
      const data = await HttpClient.getJson<OverpassResponse>(overpassUrl);

      if (data && Array.isArray(data.elements)) {
        for (const el of data.elements) {
          const tags = el.tags || {};
          const name = tags.name || tags.operator;
          if (!name) continue;

          const lat = el.lat ?? el.center?.lat ?? null;
          const lon = el.lon ?? el.center?.lon ?? null;

          const streetParts = [tags['addr:street'], tags['addr:suburb'], 'Bingerville'].filter(Boolean);
          const address = streetParts.length > 1 ? streetParts.join(', ') : `Bingerville, Côte d'Ivoire`;

          const phone = tags['contact:phone'] || tags.phone || null;
          const email = tags['contact:email'] || tags.email || null;

          results.push({
            name: name.trim(),
            phone,
            email,
            address,
            city: tags['addr:city'] || query.city || 'Bingerville',
            country: query.country || "Côte d'Ivoire",
            latitude: lat,
            longitude: lon,
            sourceName: this.name,
            sourceUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
            gardeStatus: 'inconnu', // OSM records physical locations, not live on-call schedules
            notes: tags.opening_hours ? `Horaires indiqués: ${tags.opening_hours}` : null,
          });
        }
      }
    } catch (err) {
      console.warn('[OSM Scraper] Overpass query failed or timed out:', (err as Error).message);
    }

    // Attempt 2: Nominatim public query if results are sparse
    if (results.length < 3) {
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent('pharmacie Bingerville')}&format=json&addressdetails=1&limit=15`;
        const places = await HttpClient.getJson<NominatimPlace[]>(nominatimUrl);

        if (Array.isArray(places)) {
          for (const place of places) {
            const name = place.address?.pharmacy || place.display_name.split(',')[0];
            if (!name || name.toLowerCase().includes('bingerville') && !name.toLowerCase().includes('pharmacie')) {
              continue;
            }

            const lat = parseFloat(place.lat);
            const lon = parseFloat(place.lon);

            results.push({
              name: name.trim(),
              phone: null,
              email: null,
              address: place.display_name,
              city: query.city || 'Bingerville',
              country: query.country || "Côte d'Ivoire",
              latitude: isNaN(lat) ? null : lat,
              longitude: isNaN(lon) ? null : lon,
              sourceName: 'OpenStreetMap (Nominatim)',
              sourceUrl: `https://nominatim.openstreetmap.org/ui/details.html?osmtype=N&osmid=${place.place_id}`,
              gardeStatus: 'inconnu',
              notes: 'Localisation issue du géocodage public OSM Nominatim',
            });
          }
        }
      } catch (err) {
        console.warn('[OSM Scraper] Nominatim query failed:', (err as Error).message);
      }
    }

    return results;
  }
}
