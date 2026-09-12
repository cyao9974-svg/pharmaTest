import { ScrapedPharmacyResult, Pharmacy, VerificationStatus, GardeStatus } from '../types/index.js';
import {
  normalizeNameForComparison,
  normalizePhone,
  normalizeEmail,
  normalizeAddress,
  validateCoordinates,
  calculateHaversineDistance,
  computeStringSimilarity,
} from '../utils/normalizer.js';

/**
 * Deduplication and data merging engine for pharmacies.
 */
export class PharmacyDeduplicator {
  /**
   * Evaluates if two pharmacy records refer to the exact same establishment.
   */
  public static areDuplicates(a: ScrapedPharmacyResult, b: ScrapedPharmacyResult): { isDuplicate: boolean; reason: string } {
    // 1. Exact or normalized phone match
    if (a.phone && b.phone) {
      const phoneA = a.phone.replace(/\s+/g, '');
      const phoneB = b.phone.replace(/\s+/g, '');
      if (phoneA === phoneB) {
        return { isDuplicate: true, reason: 'Identical phone number' };
      }
    }

    // 2. Exact GPS proximity (< 80 meters) + some name token similarity
    if (a.latitude != null && a.longitude != null && b.latitude != null && b.longitude != null) {
      const dist = calculateHaversineDistance(a.latitude, a.longitude, b.latitude, b.longitude);
      if (dist < 80) {
        const normA = normalizeNameForComparison(a.name);
        const normB = normalizeNameForComparison(b.name);
        const sim = computeStringSimilarity(normA, normB);
        if (sim > 0.4 || normA.includes(normB) || normB.includes(normA)) {
          return { isDuplicate: true, reason: `GPS distance: ${Math.round(dist)}m and name similarity` };
        }
      }
    }

    // 3. Name comparison
    const normA = normalizeNameForComparison(a.name);
    const normB = normalizeNameForComparison(b.name);

    if (normA && normB) {
      if (normA === normB) {
        return { isDuplicate: true, reason: 'Identical normalized name' };
      }

      const similarity = computeStringSimilarity(normA, normB);
      if (similarity >= 0.85) {
        return { isDuplicate: true, reason: `High name similarity (${Math.round(similarity * 100)}%)` };
      }

      // Check if one contains the other entirely (e.g. "Pharmacie de la Mairie" vs "Pharmacie de la Mairie Bingerville")
      if ((normA.length > 5 && normB.includes(normA)) || (normB.length > 5 && normA.includes(normB))) {
        return { isDuplicate: true, reason: 'Name substring match' };
      }
    }

    return { isDuplicate: false, reason: '' };
  }

  /**
   * Merges two pharmacy records, preserving the most complete and accurate details.
   */
  public static merge(existing: ScrapedPharmacyResult, incoming: ScrapedPharmacyResult): ScrapedPharmacyResult {
    // Pick the most complete name
    const preferredName = existing.name.length >= incoming.name.length ? existing.name : incoming.name;

    // Merge phones
    let primaryPhone = existing.phone || incoming.phone || null;
    let secondaryPhone = existing.secondaryPhone || incoming.secondaryPhone || null;

    if (primaryPhone && incoming.phone && primaryPhone !== incoming.phone && !secondaryPhone) {
      secondaryPhone = incoming.phone;
    }

    // Merge emails
    const email = existing.email || incoming.email || null;

    // Merge address (prefer the longer, more descriptive address)
    let address = existing.address || incoming.address || null;
    if (existing.address && incoming.address) {
      address = incoming.address.length > existing.address.length ? incoming.address : existing.address;
    }

    // Merge GPS
    const lat = existing.latitude != null ? existing.latitude : incoming.latitude;
    const lon = existing.longitude != null ? existing.longitude : incoming.longitude;

    // Merge guard status (confirm status if any source confirms it)
    let gardeStatus: GardeStatus = 'non_confirme';
    if (existing.gardeStatus === 'confirme' || incoming.gardeStatus === 'confirme') {
      gardeStatus = 'confirme';
    } else if (existing.gardeStatus === 'inconnu' && incoming.gardeStatus === 'inconnu') {
      gardeStatus = 'inconnu';
    }

    const gardeStart = existing.gardeStart || incoming.gardeStart || null;
    const gardeEnd = existing.gardeEnd || incoming.gardeEnd || null;

    return {
      name: preferredName,
      email,
      phone: primaryPhone,
      secondaryPhone,
      address,
      city: existing.city || incoming.city || 'Bingerville',
      country: existing.country || incoming.country || "Côte d'Ivoire",
      latitude: lat,
      longitude: lon,
      sourceName: existing.sourceName === incoming.sourceName 
        ? existing.sourceName 
        : `${existing.sourceName}, ${incoming.sourceName}`,
      sourceUrl: existing.sourceUrl || incoming.sourceUrl || null,
      gardeStatus,
      gardeStart,
      gardeEnd,
      notes: [existing.notes, incoming.notes].filter(Boolean).join(' | ') || null,
    };
  }

  /**
   * Determines default verification status based on completeness.
   */
  public static determineVerificationStatus(pharmacy: ScrapedPharmacyResult): VerificationStatus {
    const hasPhone = Boolean(pharmacy.phone);
    const hasAddress = Boolean(pharmacy.address);
    const hasLocation = pharmacy.latitude != null && pharmacy.longitude != null;

    if (hasPhone && hasAddress && hasLocation) {
      return 'a_verifier'; // Ready for human reviewer validation
    }
    if (!hasPhone && !hasAddress) {
      return 'informations_incompletes';
    }
    return 'non_verifie';
  }

  /**
   * Deduplicates an array of scraped pharmacy items.
   * Returns cleaned items and count of duplicates eliminated.
   */
  public static processList(rawList: ScrapedPharmacyResult[]): { cleaned: ScrapedPharmacyResult[]; duplicatesCount: number } {
    const cleaned: ScrapedPharmacyResult[] = [];
    let duplicatesCount = 0;

    for (const raw of rawList) {
      // First normalize the raw item fields
      const phoneNorm = normalizePhone(raw.phone);
      const emailNorm = normalizeEmail(raw.email);
      const addrNorm = normalizeAddress(raw.address);
      const coords = validateCoordinates(raw.latitude, raw.longitude);

      const normalizedItem: ScrapedPharmacyResult = {
        ...raw,
        name: raw.name.trim(),
        phone: phoneNorm.primary || raw.phone || null,
        secondaryPhone: phoneNorm.secondary || raw.secondaryPhone || null,
        email: emailNorm,
        address: addrNorm,
        latitude: coords.latitude,
        longitude: coords.longitude,
        city: raw.city || 'Bingerville',
        country: raw.country || "Côte d'Ivoire",
      };

      // Skip entries with empty or clearly invalid names
      if (!normalizedItem.name || normalizedItem.name.length < 3) {
        continue;
      }

      // Check if duplicate exists in cleaned list
      let foundIndex = -1;
      for (let i = 0; i < cleaned.length; i++) {
        const check = this.areDuplicates(cleaned[i], normalizedItem);
        if (check.isDuplicate) {
          foundIndex = i;
          break;
        }
      }

      if (foundIndex >= 0) {
        cleaned[foundIndex] = this.merge(cleaned[foundIndex], normalizedItem);
        duplicatesCount++;
      } else {
        cleaned.push(normalizedItem);
      }
    }

    return { cleaned, duplicatesCount };
  }
}
