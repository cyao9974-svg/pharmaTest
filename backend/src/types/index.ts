export type VerificationStatus = 'non_verifie' | 'verifie' | 'a_verifier' | 'informations_incompletes';
export type GardeStatus = 'confirme' | 'non_confirme' | 'inconnu';

export interface PharmacySource {
  id: string;
  pharmacy_id: string;
  source_name: string;
  source_url: string | null;
  collected_at: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  secondary_phone: string | null;
  address: string | null;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  verification_status: VerificationStatus;
  garde_status: GardeStatus;
  garde_start: string | null;
  garde_end: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  sources?: PharmacySource[];
}

export interface ScrapedPharmacyResult {
  name: string;
  email: string | null;
  phone: string | null;
  secondaryPhone?: string | null;
  address: string | null;
  city?: string;
  country?: string;
  latitude: number | null;
  longitude: number | null;
  sourceName: string;
  sourceUrl: string | null;
  gardeStatus?: GardeStatus;
  gardeStart?: string | null;
  gardeEnd?: string | null;
  notes?: string | null;
}

export interface SearchStepLog {
  step: string;
  status: 'ok' | 'pending' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

export interface SearchRecord {
  id: string;
  query: string;
  city: string;
  country: string;
  results_count: number;
  duplicates_count: number;
  duration_ms: number;
  status: 'termine' | 'erreur' | 'en_cours';
  logs: SearchStepLog[];
  created_at: string;
}

export interface DashboardStats {
  total: number;
  verified: number;
  withPhone: number;
  withEmail: number;
  withLocation: number;
  gardeConfirmed: number;
}
