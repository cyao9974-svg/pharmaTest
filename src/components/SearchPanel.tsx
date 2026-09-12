import React, { useState } from 'react';
import { Search, Loader2, Sparkles, AlertCircle, CheckCircle2, Clock, Globe, ArrowRight, RefreshCw, X } from 'lucide-react';
import { SearchStepLog } from '../types';

interface SearchPanelProps {
  onSearch: (params: { city: string; country: string; term: string; forceRefresh: boolean; mode?: 'real' | 'demo' }) => Promise<void>;
  isLoading: boolean;
  currentLogs: SearchStepLog[];
  onClose?: () => void;
  isOpen: boolean;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  onSearch,
  isLoading,
  currentLogs,
  onClose,
  isOpen,
}) => {
  const [city, setCity] = useState('Bingerville');
  const [country, setCountry] = useState("Côte d'Ivoire");
  const [term, setTerm] = useState('pharmacies de garde Bingerville');
  const [forceRefresh, setForceRefresh] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || isLoading) return;
    onSearch({ city, country, term, forceRefresh, mode: 'real' });
  };

  const presetQueries = [
    'pharmacies de garde Bingerville',
    'pharmacie Bingerville',
    'pharmacie de garde Bingerville Côte d\'Ivoire',
    'tour de garde Abidjan Est Bingerville',
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden mb-6 transition-all animate-in fade-in-50 duration-200">
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 px-5 py-4 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-xs">
            <Search className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide font-['Outfit']">
              Collecteur & Moteur de Recherche de Pharmacies
            </h2>
            <p className="text-xs text-emerald-100/80">
              Scraping responsable et requêtes d'annuaires publics autorisés
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* City */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ville cible
            </label>
            <input
              type="text"
              id="input-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={isLoading}
              required
              className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all disabled:opacity-60"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pays
            </label>
            <input
              type="text"
              id="input-country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={isLoading}
              required
              className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all disabled:opacity-60"
            />
          </div>

          {/* Force refresh checkbox */}
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
              <input
                type="checkbox"
                id="checkbox-force-refresh"
                checked={forceRefresh}
                onChange={(e) => setForceRefresh(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span>Forcer une nouvelle collecte (ignorer le cache)</span>
            </label>
          </div>

          {/* Query Term */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Terme de recherche / Requête de scraping
            </label>
            <div className="relative">
              <input
                type="text"
                id="input-search-term"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="ex: pharmacies de garde Bingerville"
                disabled={isLoading}
                required
                className="w-full pl-3 pr-32 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                id="btn-submit-search"
                disabled={isLoading || !term.trim()}
                className="absolute right-1 top-1 bottom-1 px-4 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Collecte en cours...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Lancer la recherche</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick preset suggestions */}
            <div className="mt-2.5 flex items-center flex-wrap gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium mr-1">Suggestions :</span>
              {presetQueries.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setTerm(q)}
                  disabled={isLoading}
                  className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

        </div>
      </form>

      {/* Real-time Scraping Progress Visualization (Section 27) */}
      {isLoading && (
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-4 animate-in fade-in-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
              <span className="text-xs font-semibold text-slate-800">
                Recherche des pharmacies de garde...
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Bingerville, Côte d'Ivoire</span>
          </div>

          {/* Stepper logs */}
          <div className="space-y-1.5 bg-white border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto font-mono text-[11px]">
            {currentLogs.length === 0 ? (
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-3 h-3 animate-spin" />
                <span>Initialisation des collecteurs autorisés...</span>
              </div>
            ) : (
              currentLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-700">
                  {log.status === 'ok' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />}
                  {log.status === 'pending' && <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin shrink-0 mt-0.5" />}
                  {log.status === 'warn' && <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />}
                  {log.status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />}
                  <span className="font-semibold text-slate-900">{log.step}:</span>
                  <span className="text-slate-600">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
