import * as cheerio from 'cheerio';
import { ScrapedPharmacyResult } from '../types/index.js';
import { normalizePhone, normalizeEmail, normalizeAddress, validateCoordinates } from '../utils/normalizer.js';

export class HtmlPharmacyParser {
  /**
   * Parses generic HTML snippets containing pharmacy directory listings.
   */
  public static parseDirectoryHtml(html: string, sourceName: string, sourceUrl: string): ScrapedPharmacyResult[] {
    const $ = cheerio.load(html);
    const results: ScrapedPharmacyResult[] = [];

    // Target common card/item container patterns
    const items = $('.pharmacy-card, .pharmacie-item, .result-item, article, li, tr');

    items.each((_, el) => {
      const element = $(el);
      const text = element.text();

      // Check if item contains pharmacy-related keywords
      if (!text.toLowerCase().includes('pharmacie')) {
        return;
      }

      // Extract Name
      const name = element.find('h1, h2, h3, h4, .name, .title, strong').first().text().trim() ||
        element.find('a').first().text().trim();

      if (!name || name.length < 5 || !name.toLowerCase().includes('pharmacie')) {
        return;
      }

      // Extract Phone
      let rawPhone: string | null = null;
      const telLink = element.find('a[href^="tel:"]').attr('href');
      if (telLink) {
        rawPhone = telLink.replace('tel:', '');
      } else {
        const phoneMatch = text.match(/(?:\+225\s*)?(?:0[157]|2[157])[\s.-]?(?:\d{2}[\s.-]?){4}/);
        if (phoneMatch) {
          rawPhone = phoneMatch[0];
        }
      }

      // Extract Email
      let rawEmail: string | null = null;
      const mailtoLink = element.find('a[href^="mailto:"]').attr('href');
      if (mailtoLink) {
        rawEmail = mailtoLink.replace('mailto:', '').split('?')[0];
      } else {
        const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) {
          rawEmail = emailMatch[0];
        }
      }

      // Extract Address
      const address = element.find('.address, .location, address, p').first().text().trim() || null;

      // Extract Garde indicators if explicitly present
      const isGarde = /garde|de garde|ouverte 24h|nuit/i.test(text);

      results.push({
        name: name.trim(),
        phone: rawPhone,
        email: rawEmail,
        address: address ? address.replace(/\s+/g, ' ') : null,
        city: 'Bingerville',
        country: "Côte d'Ivoire",
        latitude: null,
        longitude: null,
        sourceName,
        sourceUrl,
        gardeStatus: isGarde ? 'confirme' : 'non_confirme',
      });
    });

    return results;
  }
}
