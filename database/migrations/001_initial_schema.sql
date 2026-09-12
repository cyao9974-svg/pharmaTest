-- Migration 001: Initial Schema for PharmaGuard Bingerville
-- Database: PostgreSQL

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

CREATE INDEX IF NOT EXISTS idx_pharmacies_city ON pharmacies(city);
CREATE INDEX IF NOT EXISTS idx_pharmacies_verification ON pharmacies(verification_status);
CREATE INDEX IF NOT EXISTS idx_pharmacies_garde ON pharmacies(garde_status);
CREATE INDEX IF NOT EXISTS idx_sources_pharmacy_id ON sources(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_searches_created_at ON searches(created_at DESC);
