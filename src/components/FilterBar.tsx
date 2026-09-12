import React from 'react';
import { Search, Filter, MapPin, CheckCircle, ShieldCheck, List, Map, X, SlidersHorizontal } from 'lucide-react';
import { VerificationStatus, GardeStatus } from '../types';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  availabilityFilter: string; // 'all' | 'complete' | 'partial'
  onAvailabilityChange: (val: string) => void;
  locationFilter: string; // 'all' | 'with_location' | 'no_location'
  onLocationChange: (val: string) => void;
  verificationFilter: string; // 'all' | VerificationStatus
  onVerificationChange: (val: string) => void;
  gardeFilter: string; // 'all' | 'confirme' | 'non_confirme'
  onGardeChange: (val: string) => void;
  sourceFilter: string;
  onSourceChange: (val: string) => void;
  sourcesList: string[];
  viewMode: 'table' | 'map';
  onViewModeChange: (mode: 'table' | 'map') => void;
  totalFiltered: number;
  totalRaw: number;
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  availabilityFilter,
  onAvailabilityChange,
  locationFilter,
  onLocationChange,
  verificationFilter,
  onVerificationChange,
  gardeFilter,
  onGardeChange,
  sourceFilter,
  onSourceChange,
  sourcesList,
  viewMode,
  onViewModeChange,
  totalFiltered,
  totalRaw,
  onResetFilters,
}) => {
  const hasActiveFilters =
    searchQuery !== '' ||
    availabilityFilter !== 'all' ||
    locationFilter !== 'all' ||
    verificationFilter !== 'all' ||
    gardeFilter !== 'all' ||
    sourceFilter !== 'all';

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 mb-4 shadow-2xs space-y-3">
      {/* Top row: Instant Search + View toggle + Count */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Instant Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            id="filter-instant-search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filtrer par nom, téléphone, adresse, email..."
            className="w-full pl-9 pr-8 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Toggle & Reset */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              id="btn-reset-filters"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Réinitialiser</span>
            </button>
          )}

          {/* View Mode Switcher */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-slate-600">
            <button
              onClick={() => onViewModeChange('table')}
              id="btn-view-table"
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Tableau</span>
            </button>
            <button
              onClick={() => onViewModeChange('map')}
              id="btn-view-map"
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Carte GPS</span>
            </button>
          </div>

          <span className="text-xs text-slate-500 font-medium whitespace-nowrap pl-2 border-l border-slate-200">
            <strong className="text-slate-800">{totalFiltered}</strong> / {totalRaw}
          </span>
        </div>

      </div>

      {/* Bottom row: Filter Selectors */}
      <div className="flex items-center flex-wrap gap-2 pt-1 border-t border-slate-100 text-xs text-slate-600">
        <div className="flex items-center gap-1 text-slate-400 mr-1 text-[11px] font-semibold uppercase">
          <Filter className="w-3 h-3" />
          <span>Filtres :</span>
        </div>

        {/* Par disponibilité */}
        <select
          id="filter-availability"
          value={availabilityFilter}
          onChange={(e) => onAvailabilityChange(e.target.value)}
          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
        >
          <option value="all">Disponibilité : Toutes</option>
          <option value="complete">Complètes (Tél + GPS)</option>
          <option value="partial">Informations partielles</option>
        </select>

        {/* Par localisation */}
        <select
          id="filter-location"
          value={locationFilter}
          onChange={(e) => onLocationChange(e.target.value)}
          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
        >
          <option value="all">Localisation : Toutes</option>
          <option value="with_location">📍 Localisation disponible</option>
          <option value="no_location">⚠️ Localisation non disponible</option>
        </select>

        {/* Par statut de vérification */}
        <select
          id="filter-verification"
          value={verificationFilter}
          onChange={(e) => onVerificationChange(e.target.value)}
          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
        >
          <option value="all">Vérification : Tous statuts</option>
          <option value="verifie">✓ Vérifiée</option>
          <option value="a_verifier">À vérifier</option>
          <option value="non_verifie">Non vérifiée</option>
          <option value="informations_incompletes">Infos incomplètes</option>
        </select>

        {/* Par statut de garde */}
        <select
          id="filter-garde"
          value={gardeFilter}
          onChange={(e) => onGardeChange(e.target.value)}
          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
        >
          <option value="all">Garde : Toutes</option>
          <option value="confirme">● De garde confirmée</option>
          <option value="non_confirme">Statut non confirmé</option>
        </select>

        {/* Par source */}
        {sourcesList.length > 0 && (
          <select
            id="filter-source"
            value={sourceFilter}
            onChange={(e) => onSourceChange(e.target.value)}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">Source : Toutes</option>
            {sourcesList.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};
