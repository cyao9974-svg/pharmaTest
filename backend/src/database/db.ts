import pg from 'pg';
import { Pharmacy, PharmacySource, SearchRecord, VerificationStatus, GardeStatus, DashboardStats } from '../types/index.js';
import crypto from 'crypto';

const { Pool } = pg;

export class DatabaseService {
  private static instance: DatabaseService;
  private pool: pg.Pool | null = null;
  private isPostgresConnected = false;

  // In-memory / Fallback store
  private memoryPharmacies: Map<string, Pharmacy> = new Map();
  private memorySources: Map<string, PharmacySource[]> = new Map();
  private memorySearches: SearchRecord[] = [];

  private constructor() {
    this.init();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async init() {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && !dbUrl.includes('username:password')) {
      try {
        this.pool = new Pool({
          connectionString: dbUrl,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
          connectionTimeoutMillis: 3000,
        });

        // Test connection
        const client = await this.pool.connect();
        await this.createTables(client);
        client.release();
        this.isPostgresConnected = true;
        console.log('✅ [Database] Successfully connected to PostgreSQL.');
      } catch (err) {
        console.warn('⚠️ [Database] PostgreSQL connection failed, falling back to embedded in-memory database:', (err as Error).message);
        this.isPostgresConnected = false;
        this.pool = null;
      }
    } else {
      console.log('ℹ️ [Database] DATABASE_URL not set or default. Using embedded high-performance database.');
    }
  }

  private async createTables(client: pg.PoolClient) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS pharmacies (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(100),
        secondary_phone VARCHAR(100),
        address TEXT,
        city VARCHAR(100) DEFAULT 'Bingerville',
        country VARCHAR(100) DEFAULT 'Côte d''Ivoire',
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        verification_status VARCHAR(50) DEFAULT 'non_verifie',
        garde_status VARCHAR(50) DEFAULT 'non_confirme',
        garde_start TIMESTAMPTZ,
        garde_end TIMESTAMPTZ,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sources (
        id VARCHAR(64) PRIMARY KEY,
        pharmacy_id VARCHAR(64) REFERENCES pharmacies(id) ON DELETE CASCADE,
        source_name VARCHAR(150) NOT NULL,
        source_url TEXT,
        collected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS searches (
        id VARCHAR(64) PRIMARY KEY,
        query VARCHAR(255) NOT NULL,
        city VARCHAR(100) DEFAULT 'Bingerville',
        country VARCHAR(100) DEFAULT 'Côte d''Ivoire',
        results_count INTEGER DEFAULT 0,
        duplicates_count INTEGER DEFAULT 0,
        duration_ms INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'termine',
        logs JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  // --- Pharmacies CRUD ---

  public async getPharmacies(filters?: {
    search?: string;
    verification_status?: string;
    has_location?: boolean;
    has_phone?: boolean;
    has_email?: boolean;
    garde_status?: string;
    source?: string;
  }): Promise<Pharmacy[]> {
    let list: Pharmacy[] = [];

    if (this.isPostgresConnected && this.pool) {
      try {
        let sql = `SELECT * FROM pharmacies ORDER BY name ASC`;
        const res = await this.pool.query(sql);
        list = res.rows.map(r => ({
          ...r,
          garde_start: r.garde_start ? r.garde_start.toISOString() : null,
          garde_end: r.garde_end ? r.garde_end.toISOString() : null,
          created_at: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
          updated_at: r.updated_at ? r.updated_at.toISOString() : new Date().toISOString(),
        }));

        // Attach sources
        const sourcesRes = await this.pool.query(`SELECT * FROM sources`);
        const sourcesByPharmacy = new Map<string, PharmacySource[]>();
        for (const s of sourcesRes.rows) {
          const arr = sourcesByPharmacy.get(s.pharmacy_id) || [];
          arr.push({
            ...s,
            collected_at: s.collected_at ? s.collected_at.toISOString() : new Date().toISOString(),
          });
          sourcesByPharmacy.set(s.pharmacy_id, arr);
        }

        for (const p of list) {
          p.sources = sourcesByPharmacy.get(p.id) || [];
        }
      } catch (err) {
        console.error('[Database] Error fetching pharmacies from PostgreSQL:', err);
        list = Array.from(this.memoryPharmacies.values());
      }
    } else {
      list = Array.from(this.memoryPharmacies.values()).map(p => ({
        ...p,
        sources: this.memorySources.get(p.id) || [],
      }));
    }

    // Apply filters
    if (filters) {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(p =>
          p.name.toLowerCase().includes(q) ||
          (p.phone && p.phone.toLowerCase().includes(q)) ||
          (p.secondary_phone && p.secondary_phone.toLowerCase().includes(q)) ||
          (p.email && p.email.toLowerCase().includes(q)) ||
          (p.address && p.address.toLowerCase().includes(q))
        );
      }

      if (filters.verification_status && filters.verification_status !== 'all') {
        list = list.filter(p => p.verification_status === filters.verification_status);
      }

      if (filters.garde_status && filters.garde_status !== 'all') {
        list = list.filter(p => p.garde_status === filters.garde_status);
      }

      if (filters.has_location !== undefined) {
        list = list.filter(p => (p.latitude != null && p.longitude != null) === filters.has_location);
      }

      if (filters.has_phone !== undefined) {
        list = list.filter(p => Boolean(p.phone) === filters.has_phone);
      }

      if (filters.has_email !== undefined) {
        list = list.filter(p => Boolean(p.email) === filters.has_email);
      }

      if (filters.source && filters.source !== 'all') {
        list = list.filter(p => p.sources?.some(s => s.source_name.toLowerCase().includes(filters.source!.toLowerCase())));
      }
    }

    return list;
  }

  public async getPharmacyById(id: string): Promise<Pharmacy | null> {
    if (this.isPostgresConnected && this.pool) {
      const res = await this.pool.query(`SELECT * FROM pharmacies WHERE id = $1`, [id]);
      if (res.rows.length === 0) return null;
      const p = res.rows[0];
      const sourcesRes = await this.pool.query(`SELECT * FROM sources WHERE pharmacy_id = $1`, [id]);
      return {
        ...p,
        garde_start: p.garde_start ? p.garde_start.toISOString() : null,
        garde_end: p.garde_end ? p.garde_end.toISOString() : null,
        created_at: p.created_at ? p.created_at.toISOString() : new Date().toISOString(),
        updated_at: p.updated_at ? p.updated_at.toISOString() : new Date().toISOString(),
        sources: sourcesRes.rows.map(s => ({
          ...s,
          collected_at: s.collected_at ? s.collected_at.toISOString() : new Date().toISOString(),
        })),
      };
    } else {
      const p = this.memoryPharmacies.get(id);
      if (!p) return null;
      return {
        ...p,
        sources: this.memorySources.get(id) || [],
      };
    }
  }

  public async savePharmacy(pharmacy: Partial<Pharmacy> & { name: string }, source?: { name: string; url?: string | null }): Promise<Pharmacy> {
    const id = pharmacy.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const record: Pharmacy = {
      id,
      name: pharmacy.name,
      email: pharmacy.email || null,
      phone: pharmacy.phone || null,
      secondary_phone: pharmacy.secondary_phone || null,
      address: pharmacy.address || null,
      city: pharmacy.city || 'Bingerville',
      country: pharmacy.country || "Côte d'Ivoire",
      latitude: pharmacy.latitude != null ? pharmacy.latitude : null,
      longitude: pharmacy.longitude != null ? pharmacy.longitude : null,
      verification_status: pharmacy.verification_status || 'non_verifie',
      garde_status: pharmacy.garde_status || 'non_confirme',
      garde_start: pharmacy.garde_start || null,
      garde_end: pharmacy.garde_end || null,
      notes: pharmacy.notes || null,
      created_at: pharmacy.created_at || now,
      updated_at: now,
    };

    if (this.isPostgresConnected && this.pool) {
      await this.pool.query(
        `INSERT INTO pharmacies (
          id, name, email, phone, secondary_phone, address, city, country,
          latitude, longitude, verification_status, garde_status, garde_start, garde_end, notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          secondary_phone = EXCLUDED.secondary_phone,
          address = EXCLUDED.address,
          city = EXCLUDED.city,
          country = EXCLUDED.country,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          verification_status = EXCLUDED.verification_status,
          garde_status = EXCLUDED.garde_status,
          garde_start = EXCLUDED.garde_start,
          garde_end = EXCLUDED.garde_end,
          notes = EXCLUDED.notes,
          updated_at = EXCLUDED.updated_at`,
        [
          record.id, record.name, record.email, record.phone, record.secondary_phone,
          record.address, record.city, record.country, record.latitude, record.longitude,
          record.verification_status, record.garde_status, record.garde_start, record.garde_end,
          record.notes, record.created_at, record.updated_at,
        ]
      );

      if (source) {
        const sourceId = crypto.randomUUID();
        await this.pool.query(
          `INSERT INTO sources (id, pharmacy_id, source_name, source_url, collected_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [sourceId, record.id, source.name, source.url || null, now]
        );
      }
    }

    // Always keep memory map up-to-date
    this.memoryPharmacies.set(id, record);

    if (source) {
      const sourceId = crypto.randomUUID();
      const existingSources = this.memorySources.get(id) || [];
      existingSources.push({
        id: sourceId,
        pharmacy_id: id,
        source_name: source.name,
        source_url: source.url || null,
        collected_at: now,
      });
      this.memorySources.set(id, existingSources);
    }

    return {
      ...record,
      sources: this.memorySources.get(id) || [],
    };
  }

  public async updatePharmacy(id: string, updates: Partial<Pharmacy>): Promise<Pharmacy | null> {
    const existing = await this.getPharmacyById(id);
    if (!existing) return null;

    const updated: Pharmacy = {
      ...existing,
      ...updates,
      id,
      updated_at: new Date().toISOString(),
    };

    if (this.isPostgresConnected && this.pool) {
      await this.pool.query(
        `UPDATE pharmacies SET
          name = $1, email = $2, phone = $3, secondary_phone = $4, address = $5,
          city = $6, country = $7, latitude = $8, longitude = $9,
          verification_status = $10, garde_status = $11, garde_start = $12, garde_end = $13,
          notes = $14, updated_at = $15
         WHERE id = $16`,
        [
          updated.name, updated.email, updated.phone, updated.secondary_phone, updated.address,
          updated.city, updated.country, updated.latitude, updated.longitude,
          updated.verification_status, updated.garde_status, updated.garde_start, updated.garde_end,
          updated.notes, updated.updated_at, id,
        ]
      );
    }

    this.memoryPharmacies.set(id, updated);
    return updated;
  }

  public async deletePharmacy(id: string): Promise<boolean> {
    if (this.isPostgresConnected && this.pool) {
      await this.pool.query(`DELETE FROM pharmacies WHERE id = $1`, [id]);
    }
    const had = this.memoryPharmacies.delete(id);
    this.memorySources.delete(id);
    return had;
  }

  // --- Searches History ---

  public async saveSearch(search: Omit<SearchRecord, 'id' | 'created_at'>): Promise<SearchRecord> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const record: SearchRecord = {
      ...search,
      id,
      created_at: now,
    };

    if (this.isPostgresConnected && this.pool) {
      await this.pool.query(
        `INSERT INTO searches (id, query, city, country, results_count, duplicates_count, duration_ms, status, logs, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          record.id, record.query, record.city, record.country,
          record.results_count, record.duplicates_count, record.duration_ms,
          record.status, JSON.stringify(record.logs), record.created_at,
        ]
      );
    }

    this.memorySearches.unshift(record);
    return record;
  }

  public async getSearches(): Promise<SearchRecord[]> {
    if (this.isPostgresConnected && this.pool) {
      try {
        const res = await this.pool.query(`SELECT * FROM searches ORDER BY created_at DESC LIMIT 50`);
        return res.rows.map(r => ({
          ...r,
          created_at: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
          logs: typeof r.logs === 'string' ? JSON.parse(r.logs) : r.logs,
        }));
      } catch (err) {
        console.error('[Database] Failed to get searches from postgres:', err);
      }
    }
    return this.memorySearches;
  }

  // --- Dashboard Stats ---

  public async getStats(): Promise<DashboardStats> {
    const pharmacies = await this.getPharmacies();
    return {
      total: pharmacies.length,
      verified: pharmacies.filter(p => p.verification_status === 'verifie').length,
      withPhone: pharmacies.filter(p => Boolean(p.phone)).length,
      withEmail: pharmacies.filter(p => Boolean(p.email)).length,
      withLocation: pharmacies.filter(p => p.latitude != null && p.longitude != null).length,
      gardeConfirmed: pharmacies.filter(p => p.garde_status === 'confirme').length,
    };
  }

  public isUsingPostgres(): boolean {
    return this.isPostgresConnected;
  }
}

export const db = DatabaseService.getInstance();
