import React, { useState, useRef, useEffect } from 'react';
import {
  RefreshCw,
  Search,
  FileDown,
  History,
  ShieldAlert,
  Sparkles,
  ChevronDown,
  FileText,
  Database,
  HeartPulse,
  SlidersHorizontal,
  MoreVertical,
  X,
} from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  onOpenSearch: () => void;
  onOpenHistory: () => void;
  onLoadDemo: () => void;
  isRefreshing: boolean;
  totalCount: number;
  activeTab: 'citizen' | 'admin';
  onTabChange: (tab: 'citizen' | 'admin') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  onOpenSearch,
  onOpenHistory,
  onLoadDemo,
  isRefreshing,
  totalCount,
  activeTab,
  onTabChange,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [mobileExportExpanded, setMobileExportExpanded] = useState(false);

  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(e.target as Node)
      ) {
        setShowExportMenu(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node)
      ) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* Brand */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-xs ring-2 sm:ring-4 ring-emerald-50 shrink-0">
              <ShieldAlert className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 font-['Outfit']">
                  PharmaGuard
                </span>
                <span className="hidden xs:inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                  Bingerville
                </span>
              </div>
              <p className="hidden xl:block text-[11px] text-slate-500 leading-tight">
                Portail citoyen & outil de collecte des pharmacies de garde
              </p>
            </div>
          </div>

          {/* Mode Switcher: Citoyen vs Gestion (Compact on mobile/tablet) */}
          <div className="inline-flex items-center p-0.5 sm:p-1 rounded-xl bg-slate-100 border border-slate-200/90 shrink-0">
            <button
              onClick={() => onTabChange('citizen')}
              id="tab-mode-citizen"
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'citizen'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5 text-emerald-200" />
              <span>
                <span className="hidden sm:inline">Espace </span>Citoyen
              </span>
            </button>
            <button
              onClick={() => onTabChange('admin')}
              id="tab-mode-admin"
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>
                <span className="hidden sm:inline">Console </span>Gestion
              </span>
            </button>
          </div>

          {/* Action Controls - Desktop View (lg and above) */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {/* Quick Demo Seed */}
            <button
              onClick={onLoadDemo}
              id="btn-demo-mode"
              title="Charger 10 pharmacies pour tester l'application"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Mode Démo</span>
            </button>

            {/* History Button (shown in admin) */}
            {activeTab === 'admin' && (
              <button
                onClick={onOpenHistory}
                id="btn-open-history"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>Historique</span>
              </button>
            )}

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              id="btn-refresh-data"
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              title="Actualiser les données"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
              <span>Actualiser</span>
            </button>

            {/* New Search Button */}
            <button
              onClick={onOpenSearch}
              id="btn-new-search"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Collecte auto</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative" ref={exportDropdownRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                id="btn-export-dropdown"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5 text-slate-600" />
                <span>Exporter</span>
                <ChevronDown className="w-3 h-3 text-slate-500 ml-0.5" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in-50 duration-100">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Documents PDF
                  </div>
                  
                  <a
                    href="/api/export/pdf?type=summary"
                    download
                    onClick={() => setShowExportMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-medium">PDF Résumé</div>
                      <div className="text-[10px] text-slate-400">Tableau récapitulatif compact</div>
                    </div>
                  </a>

                  <a
                    href="/api/export/pdf?type=detailed"
                    download
                    onClick={() => setShowExportMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-teal-600" />
                    <div>
                      <div className="font-medium">PDF Détaillé</div>
                      <div className="text-[10px] text-slate-400">Fiches complètes avec coordonnées</div>
                    </div>
                  </a>

                  <div className="px-3 py-1.5 border-b border-slate-100 border-t mt-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Données Structurées
                  </div>

                  <a
                    href="/api/export/csv"
                    download
                    onClick={() => setShowExportMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Database className="w-4 h-4 text-blue-500" />
                    <div>
                      <div className="font-medium">Exporter en CSV</div>
                      <div className="text-[10px] text-slate-400">Pour Excel et tableurs</div>
                    </div>
                  </a>

                  <a
                    href="/api/export/json"
                    download
                    onClick={() => setShowExportMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <span className="w-4 h-4 flex items-center justify-center font-mono font-bold text-[10px] text-purple-600">{`{ }`}</span>
                    <div>
                      <div className="font-medium">Exporter en JSON</div>
                      <div className="text-[10px] text-slate-400">Format API structuré</div>
                    </div>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Action Controls - Mobile & Tablet View (< lg) */}
          <div className="flex lg:hidden items-center gap-1.5 shrink-0" ref={mobileMenuRef}>
            {/* Quick Refresh Icon */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              id="btn-mobile-refresh"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Actualiser"
              aria-label="Actualiser les données"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            {/* Mobile Actions Drawer / Popover Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                id="btn-mobile-menu-toggle"
                className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  showMobileMenu
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                }`}
                title="Options et outils"
                aria-label="Menu des outils"
              >
                {showMobileMenu ? (
                  <X className="w-4 h-4" />
                ) : (
                  <MoreVertical className="w-4 h-4" />
                )}
              </button>

              {/* Mobile Dropdown Menu */}
              {showMobileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                    Outils & Actions
                  </div>

                  {/* Search / Scraping */}
                  <button
                    onClick={() => {
                      onOpenSearch();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors text-left cursor-pointer mb-1"
                  >
                    <Search className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Lancer une collecte auto</span>
                  </button>

                  {/* Mode Démo */}
                  <button
                    onClick={() => {
                      onLoadDemo();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-amber-800 hover:bg-amber-50 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Charger les données de démo</span>
                  </button>

                  {/* History */}
                  <button
                    onClick={() => {
                      onOpenHistory();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <History className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>Historique des collectes</span>
                  </button>

                  {/* Export Expandable Section */}
                  <div className="pt-1 mt-1 border-t border-slate-100">
                    <button
                      onClick={() => setMobileExportExpanded(!mobileExportExpanded)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileDown className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>Télécharger / Exporter</span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                          mobileExportExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {mobileExportExpanded && (
                      <div className="mt-1 pl-2 pr-1 space-y-1 bg-slate-50 rounded-xl p-1.5 border border-slate-200/60">
                        <a
                          href="/api/export/pdf?type=summary"
                          download
                          onClick={() => setShowMobileMenu(false)}
                          className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-white rounded-lg transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <span>PDF Résumé (1 page)</span>
                        </a>
                        <a
                          href="/api/export/pdf?type=detailed"
                          download
                          onClick={() => setShowMobileMenu(false)}
                          className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-white rounded-lg transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-teal-600" />
                          <span>PDF Détaillé (Complet)</span>
                        </a>
                        <a
                          href="/api/export/csv"
                          download
                          onClick={() => setShowMobileMenu(false)}
                          className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-white rounded-lg transition-colors"
                        >
                          <Database className="w-3.5 h-3.5 text-blue-500" />
                          <span>Fichier Excel / CSV</span>
                        </a>
                        <a
                          href="/api/export/json"
                          download
                          onClick={() => setShowMobileMenu(false)}
                          className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-white rounded-lg transition-colors"
                        >
                          <span className="font-mono text-[10px] text-purple-600 font-bold">{`{ }`}</span>
                          <span>Fichier JSON API</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
