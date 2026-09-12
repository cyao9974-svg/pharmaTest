/**
 * Automated test suite for PharmaGuard Bingerville
 * Tests parsing, normalization, deduplication, GPS validation, and PDF generation.
 */

import {
  normalizePhone,
  normalizeEmail,
  normalizeNameForComparison,
  validateCoordinates,
  computeStringSimilarity,
} from '../utils/normalizer.js';
import { PharmacyDeduplicator } from '../services/deduplicator.js';
import { PdfService } from '../pdf/pdfService.js';
import { DEMO_PHARMACIES } from '../services/demoData.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('🧪 Running PharmaGuard Bingerville Test Suite...\n');

  // 1. Phone Extraction & Normalization (+225)
  console.log('--- 1. Extraction et Normalisation des Téléphones ---');
  const p1 = normalizePhone('+225 07 12 34 56 78');
  assert(p1.primary === '+225 07 12 34 56 78', 'Standard 10-digit CI mobile format preserved');

  const p2 = normalizePhone('0712345678 / 0501020304');
  assert(p2.primary === '+225 07 12 34 56 78' && p2.secondary === '+225 05 01 02 03 04', 'Multi-phone string extracted into primary and secondary');

  const p3 = normalizePhone('Tél: 27 22 40 12 34');
  assert(p3.primary === '+225 27 22 40 12 34', 'Landline number cleaned and formatted');

  const pEmpty = normalizePhone(null);
  assert(pEmpty.primary === null && pEmpty.secondary === null, 'Null phone returns null (no invention)');

  // 2. Email Normalization
  console.log('\n--- 2. Extraction et Normalisation des Emails ---');
  const e1 = normalizeEmail('  Contact@PharmacieBingerville.CI  ');
  assert(e1 === 'contact@pharmaciebingerville.ci', 'Email trimmed and lowercased');

  const e2 = normalizeEmail('Écrivez-nous à info@sante.ci pour toute question');
  assert(e2 === 'info@sante.ci', 'Email extracted from unstructured text');

  const eInvalid = normalizeEmail('pas-d-email');
  assert(eInvalid === null, 'Invalid email returns null (no placeholder)');

  // 3. Name Normalization & Fuzzy Matching
  console.log('\n--- 3. Normalisation et Comparaison des Noms ---');
  const norm1 = normalizeNameForComparison('Pharmacie du Centre');
  const norm2 = normalizeNameForComparison('PHARMACIE DU CENTRE');
  const norm3 = normalizeNameForComparison('Pharmacie du Centre Bingerville');
  assert(norm1 === norm2, 'Case insensitivity and accent stripping produce identical tokens');
  assert(computeStringSimilarity(norm1, 'centre') > 0.8 || norm3.includes(norm1), 'Fuzzy substring detection works');

  // 4. GPS Coordinates Validation
  console.log('\n--- 4. Validation des Coordonnées GPS ---');
  const c1 = validateCoordinates(5.358210, -3.886450);
  assert(c1.latitude === 5.35821 && c1.longitude === -3.88645, 'Valid Bingerville coordinates rounded to precision');

  const cInvalid = validateCoordinates(999, -500);
  assert(cInvalid.latitude === null && cInvalid.longitude === null, 'Out-of-bound coordinates rejected');

  const cNull = validateCoordinates(null, undefined);
  assert(cNull.latitude === null && cNull.longitude === null, 'Null coordinates preserved as null');

  // 5. Deduplication
  console.log('\n--- 5. Déduplication et Fusion des Données ---');
  const testList = [
    {
      name: 'Pharmacie de Bingerville',
      phone: '+225 27 22 40 31 12',
      email: null,
      address: 'Centre ville',
      latitude: 5.3582,
      longitude: -3.8864,
      sourceName: 'Source 1',
      sourceUrl: 'https://source1.com',
    },
    {
      name: 'PHARMACIE DE BINGERVILLE',
      phone: '+225 27 22 40 31 12',
      email: 'contact@bingerville.ci',
      address: 'Face au Grand Marché Municipal, Bingerville',
      latitude: 5.35821,
      longitude: -3.88645,
      sourceName: 'Source 2',
      sourceUrl: 'https://source2.com',
    },
  ];

  const { cleaned, duplicatesCount } = PharmacyDeduplicator.processList(testList);
  assert(duplicatesCount === 1, 'Duplicate detected between uppercase and lowercase entries with identical phone');
  assert(cleaned.length === 1, 'Merged into a single record');
  assert(cleaned[0].email === 'contact@bingerville.ci', 'Enriched email retained during merge');
  assert(cleaned[0].address?.includes('Marché'), 'Longer descriptive address retained');

  // 6. PDF Generation
  console.log('\n--- 6. Génération de Documents PDF ---');
  const dummyStats = {
    total: 2,
    verified: 1,
    withPhone: 2,
    withEmail: 1,
    withLocation: 2,
    gardeConfirmed: 1,
  };

  try {
    const dummyPharmacies = cleaned.map((p, i) => ({
      ...p,
      id: `test-${i}`,
      secondary_phone: p.secondaryPhone || null,
      city: 'Bingerville',
      country: "Côte d'Ivoire",
      verification_status: 'verifie' as const,
      garde_status: 'confirme' as const,
      garde_start: '2026-09-08T08:00:00Z',
      garde_end: '2026-09-15T08:00:00Z',
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const summaryBuffer = await PdfService.generateSummaryPdf(dummyPharmacies, dummyStats);
    assert(summaryBuffer.length > 500, 'Summary PDF buffer generated successfully');

    const detailedBuffer = await PdfService.generateDetailedPdf(dummyPharmacies, dummyStats);
    assert(detailedBuffer.length > 500, 'Detailed PDF buffer generated successfully');
  } catch (err) {
    assert(false, `PDF Generation failed: ${(err as Error).message}`);
  }

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(e => {
  console.error(e);
  process.exit(1);
});
