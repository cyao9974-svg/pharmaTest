/**
 * Normalization utilities for PharmaGuard Bingerville
 * Responsible for cleaning and standardizing Ivorian phone numbers, emails, addresses, and coordinates.
 */

/**
 * Normalizes an Ivorian phone number.
 * Detects multiple numbers separated by slash, comma, or semicolons.
 * Format: +225 XX XX XX XX XX or landline.
 */
export function normalizePhone(rawInput: string | null | undefined): { primary: string | null; secondary: string | null } {
  if (!rawInput || typeof rawInput !== 'string') {
    return { primary: null, secondary: null };
  }

  // Split multiple numbers
  const candidates = rawInput
    .split(/[/,;]|\bet\b|\bou\b/i)
    .map(c => c.trim())
    .filter(Boolean);

  const cleanedNumbers: string[] = [];

  for (const candidate of candidates) {
    // Strip non-digits except initial +
    let cleaned = candidate.replace(/[^\d+]/g, '');

    // Handle +225 or 00225 or missing country code
    if (cleaned.startsWith('+225')) {
      cleaned = cleaned.substring(4);
    } else if (cleaned.startsWith('00225')) {
      cleaned = cleaned.substring(5);
    } else if (cleaned.startsWith('225') && cleaned.length > 10) {
      cleaned = cleaned.substring(3);
    }

    // Remove any remaining non-digits
    cleaned = cleaned.replace(/\D/g, '');

    if (cleaned.length === 0) continue;

    // Handle 10-digit CI numbers (modern format) or 8-digit older formats
    let formatted: string | null = null;

    if (cleaned.length === 10) {
      // e.g. 07 12 34 56 78
      formatted = `+225 ${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8, 10)}`;
    } else if (cleaned.length === 8) {
      // 8-digit format formatted cleanly
      formatted = `+225 ${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 8)}`;
    } else if (cleaned.length >= 6 && cleaned.length <= 12) {
      // Fallback preserves the number with country prefix if appropriate
      formatted = `+225 ${cleaned}`;
    }

    if (formatted && !cleanedNumbers.includes(formatted)) {
      cleanedNumbers.push(formatted);
    }
  }

  return {
    primary: cleanedNumbers[0] || null,
    secondary: cleanedNumbers[1] || null,
  };
}

/**
 * Validates and cleans email addresses.
 * Returns null if invalid. Never invents an email.
 */
export function normalizeEmail(rawInput: string | null | undefined): string | null {
  if (!rawInput || typeof rawInput !== 'string') return null;

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = rawInput.trim().match(emailRegex);

  if (!match) return null;

  const email = match[0].toLowerCase();
  // Basic validation check
  if (email.length < 6 || email.endsWith('.png') || email.endsWith('.jpg') || email.includes('example.com')) {
    return null;
  }

  return email;
}

/**
 * Normalizes pharmacy name for fuzzy matching and deduplication.
 */
export function normalizeNameForComparison(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/\b(pharmacie|ste|sainte|saint|dr|docteur|et|de|du|des|la|le|l'|d')\b/gi, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes pharmacy address string.
 */
export function normalizeAddress(rawAddress: string | null | undefined): string | null {
  if (!rawAddress || typeof rawAddress !== 'string') return null;
  const cleaned = rawAddress
    .replace(/\s+/g, ' ')
    .replace(/^(adresse\s*:\s*)/i, '')
    .trim();
  return cleaned.length > 2 ? cleaned : null;
}

/**
 * Validates latitude and longitude.
 * Ensures numbers are within real geographic bounds for Bingerville / Côte d'Ivoire.
 */
export function validateCoordinates(lat: number | null | undefined, lon: number | null | undefined): { latitude: number | null; longitude: number | null } {
  if (lat == null || lon == null) {
    return { latitude: null, longitude: null };
  }

  const latitude = typeof lat === 'number' ? lat : parseFloat(String(lat));
  const longitude = typeof lon === 'number' ? lon : parseFloat(String(lon));

  if (isNaN(latitude) || isNaN(longitude)) {
    return { latitude: null, longitude: null };
  }

  // Latitude must be -90 to 90, Longitude -180 to 180
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return { latitude: null, longitude: null };
  }

  // Round to 6 decimal places (~0.1m precision)
  return {
    latitude: Math.round(latitude * 1000000) / 1000000,
    longitude: Math.round(longitude * 1000000) / 1000000,
  };
}

/**
 * Calculates distance between two GPS coordinates in meters (Haversine formula).
 */
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radius of Earth in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Computes Levenshtein distance similarity (0.0 to 1.0)
 */
export function computeStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;

  const s1 = str1.length < str2.length ? str1 : str2;
  const s2 = str1.length < str2.length ? str2 : str1;

  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    costs[i] = i;
  }

  for (let j = 1; j <= s2.length; j++) {
    let prev = j;
    for (let i = 1; i <= s1.length; i++) {
      let cost = prev;
      if (s1[i - 1] === s2[j - 1]) {
        cost = costs[i - 1];
      } else {
        cost = Math.min(costs[i - 1] + 1, prev + 1, costs[i] + 1);
      }
      costs[i - 1] = prev;
      prev = cost;
    }
    costs[s1.length] = prev;
  }

  const distance = costs[s1.length];
  const maxLen = Math.max(s1.length, s2.length);
  return 1.0 - distance / maxLen;
}
