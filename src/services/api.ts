import { Pharmacy, DashboardStats, SearchRecord } from '../types';

export const api = {
  async getStats(): Promise<DashboardStats> {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Échec récupération statistiques');
    const data = await res.json();
    return data.stats;
  },

  async getPharmacies(params?: Record<string, string | boolean | undefined>): Promise<Pharmacy[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== '') {
          searchParams.append(key, String(val));
        }
      });
    }
    const res = await fetch(`/api/pharmacies?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Échec récupération pharmacies');
    const data = await res.json();
    return data.pharmacies || [];
  },

  async getPharmacyById(id: string): Promise<Pharmacy> {
    const res = await fetch(`/api/pharmacies/${id}`);
    if (!res.ok) throw new Error('Pharmacie introuvable');
    const data = await res.json();
    return data.pharmacy;
  },

  async updatePharmacy(id: string, updates: Partial<Pharmacy>): Promise<Pharmacy> {
    const res = await fetch(`/api/pharmacies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Échec mise à jour de la pharmacie');
    const data = await res.json();
    return data.pharmacy;
  },

  async deletePharmacy(id: string): Promise<void> {
    const res = await fetch(`/api/pharmacies/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Échec suppression de la pharmacie');
  },

  async search(params: {
    city?: string;
    country?: string;
    term?: string;
    forceRefresh?: boolean;
    mode?: 'real' | 'demo';
  }): Promise<{ pharmacies: Pharmacy[]; searchRecord: SearchRecord; fromCache: boolean }> {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.details || err.error || 'Erreur lors de la recherche');
    }
    return res.json();
  },

  async getSearches(): Promise<SearchRecord[]> {
    const res = await fetch('/api/searches');
    if (!res.ok) throw new Error('Échec récupération historique');
    const data = await res.json();
    return data.searches || [];
  },

  async seedDemo(): Promise<Pharmacy[]> {
    const res = await fetch('/api/demo/seed', { method: 'POST' });
    if (!res.ok) throw new Error('Échec activation mode démo');
    const data = await res.json();
    return data.pharmacies || [];
  },

  getExportPdfUrl(type: 'summary' | 'detailed' = 'summary'): string {
    return `/api/export/pdf?type=${type}`;
  },

  getExportCsvUrl(): string {
    return '/api/export/csv';
  },

  getExportJsonUrl(): string {
    return '/api/export/json';
  },
};
