import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from './services/api';
import { Pharmacy, DashboardStats, SearchRecord, SearchStepLog } from './types';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { SearchPanel } from './components/SearchPanel';
import { FilterBar } from './components/FilterBar';
import { PharmacyTable } from './components/PharmacyTable';
import { PharmacyModal } from './components/PharmacyModal';
import { SearchHistoryModal } from './components/SearchHistoryModal';
import { PharmacyMapView } from './components/PharmacyMapView';
import { CitizenUserInterface } from './components/CitizenUserInterface';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ShieldCheck, Info, Sparkles, AlertCircle } from 'lucide-react';

export default function App() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    verified: 0,
    withPhone: 0,
    withEmail: 0,
    withLocation: 0,
    gardeConfirmed: 0,
  });
  const [searches, setSearches] = useState<SearchRecord[]>([]);

  // Navigation mode: Citizen UI (Grand Public / Urgences) vs Admin Console (Gestion & Scraping)
  const [activeTab, setActiveTab] = useState<'citizen' | 'admin'>('citizen');

  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchLogs, setSearchLogs] = useState<SearchStepLog[]>([]);

  // Modals & Panels
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalEditMode, setModalEditMode] = useState(false);

  // View & Filters
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [gardeFilter, setGardeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load initial data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pharmaData, statsData, searchesData] = await Promise.all([
        api.getPharmacies(),
        api.getStats(),
        api.getSearches(),
      ]);
      setPharmacies(pharmaData);
      setStats(statsData);
      setSearches(searchesData);
    } catch (err) {
      console.error(err);
      addToast('error', 'Erreur de chargement', (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Search & Scraping
  const handleSearch = async (params: {
    city: string;
    country: string;
    term: string;
    forceRefresh: boolean;
    mode?: 'real' | 'demo';
  }) => {
    setIsSearching(true);
    setSearchLogs([
      {
        step: 'Initialisation',
        status: 'pending',
        message: `Lancement de la requête "${params.term}" pour ${params.city}...`,
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
      const result = await api.search(params);
      setPharmacies(result.pharmacies);
      setSearchLogs(result.searchRecord.logs || []);

      const [newStats, newSearches] = await Promise.all([api.getStats(), api.getSearches()]);
      setStats(newStats);
      setSearches(newSearches);

      addToast(
        'success',
        result.fromCache ? 'Données chargées (Cache)' : 'Collecte terminée avec succès',
        `${result.pharmacies.length} pharmacies disponibles (${result.searchRecord.duplicates_count} doublons supprimés)`
      );
    } catch (err) {
      addToast('error', 'Échec de la collecte', (err as Error).message);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle Demo Mode
  const handleLoadDemo = async () => {
    setIsLoading(true);
    try {
      const demoData = await api.seedDemo();
      setPharmacies(demoData);
      const [newStats, newSearches] = await Promise.all([api.getStats(), api.getSearches()]);
      setStats(newStats);
      setSearches(newSearches);
      addToast('info', 'Mode Démo activé', '10 pharmacies fictives de Bingerville chargées pour test.');
    } catch (err) {
      addToast('error', 'Erreur', (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Pharmacy CRUD Actions
  const handleSelectPharmacy = (pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setModalEditMode(false);
    setIsModalOpen(true);
  };

  const handleEditPharmacy = (pharmacy: Pharmacy) => {
    setSelectedPharmacy(pharmacy);
    setModalEditMode(true);
    setIsModalOpen(true);
  };

  const handleSavePharmacy = async (id: string, updates: Partial<Pharmacy>) => {
    const updated = await api.updatePharmacy(id, updates);
    setPharmacies((prev) => prev.map((p) => (p.id === id ? updated : p)));
    setSelectedPharmacy(updated);
    const newStats = await api.getStats();
    setStats(newStats);
    addToast('success', 'Modifications enregistrées', updated.name);
  };

  const handleDeletePharmacy = async (id: string, name: string) => {
    if (!window.confirm(`Confirmez-vous la suppression de "${name}" ?`)) return;
    try {
      await api.deletePharmacy(id);
      setPharmacies((prev) => prev.filter((p) => p.id !== id));
      if (selectedPharmacy?.id === id) {
        setIsModalOpen(false);
        setSelectedPharmacy(null);
      }
      const newStats = await api.getStats();
      setStats(newStats);
      addToast('info', 'Pharmacie supprimée', name);
    } catch (err) {
      addToast('error', 'Erreur de suppression', (err as Error).message);
    }
  };

  const handleMarkVerified = async (pharmacy: Pharmacy) => {
    try {
      const updated = await api.updatePharmacy(pharmacy.id, { verification_status: 'verifie' });
      setPharmacies((prev) => prev.map((p) => (p.id === pharmacy.id ? updated : p)));
      const newStats = await api.getStats();
      setStats(newStats);
      addToast('success', 'Statut mis à jour', `"${pharmacy.name}" marquée comme vérifiée`);
    } catch (err) {
      addToast('error', 'Erreur', (err as Error).message);
    }
  };

  // Distinct Sources list
  const distinctSources = useMemo(() => {
    const set = new Set<string>();
    pharmacies.forEach((p) => {
      p.sources?.forEach((s) => set.add(s.source_name));
    });
    return Array.from(set);
  }, [pharmacies]);

  // Filter logic
  const filteredPharmacies = useMemo(() => {
    return pharmacies.filter((p) => {
      // Instant query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          p.name.toLowerCase().includes(q) ||
          (p.phone && p.phone.toLowerCase().includes(q)) ||
          (p.secondary_phone && p.secondary_phone.toLowerCase().includes(q)) ||
          (p.email && p.email.toLowerCase().includes(q)) ||
          (p.address && p.address.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Availability filter
      if (availabilityFilter === 'complete') {
        if (!p.phone || p.latitude == null || p.longitude == null) return false;
      } else if (availabilityFilter === 'partial') {
        if (p.phone && p.latitude != null && p.longitude != null && p.email) return false;
      }

      // Location filter
      if (locationFilter === 'with_location') {
        if (p.latitude == null || p.longitude == null) return false;
      } else if (locationFilter === 'no_location') {
        if (p.latitude != null && p.longitude != null) return false;
      }

      // Verification filter
      if (verificationFilter !== 'all') {
        if (p.verification_status !== verificationFilter) return false;
      }

      // Garde filter
      if (gardeFilter === 'confirme') {
        if (p.garde_status !== 'confirme') return false;
      } else if (gardeFilter === 'non_confirme') {
        if (p.garde_status === 'confirme') return false;
      }

      // Source filter
      if (sourceFilter !== 'all') {
        const hasSource = p.sources?.some((s) => s.source_name.toLowerCase().includes(sourceFilter.toLowerCase()));
        if (!hasSource) return false;
      }

      return true;
    });
  }, [
    pharmacies,
    searchQuery,
    availabilityFilter,
    locationFilter,
    verificationFilter,
    gardeFilter,
    sourceFilter,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setAvailabilityFilter('all');
    setLocationFilter('all');
    setVerificationFilter('all');
    setGardeFilter('all');
    setSourceFilter('all');
  };

  const handleStatsFilterClick = (type: string) => {
    handleResetFilters();
    if (type === 'verifie') setVerificationFilter('verifie');
    if (type === 'has_phone') setAvailabilityFilter('complete');
    if (type === 'has_location') setLocationFilter('with_location');
    if (type === 'garde_confirme') setGardeFilter('confirme');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header */}
      <Header
        onRefresh={loadData}
        onOpenSearch={() => setIsSearchPanelOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onLoadDemo={handleLoadDemo}
        isRefreshing={isLoading}
        totalCount={pharmacies.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Search / Scraping Collapsible Panel (Can be opened from anywhere) */}
        <SearchPanel
          isOpen={isSearchPanelOpen}
          onClose={() => setIsSearchPanelOpen(false)}
          onSearch={handleSearch}
          isLoading={isSearching}
          currentLogs={searchLogs}
        />

        {/* Dynamic View: Citizen Interface vs Admin Management Console */}
        {activeTab === 'citizen' ? (
          <CitizenUserInterface
            pharmacies={pharmacies}
            onSelectPharmacy={handleSelectPharmacy}
            onSwitchToAdmin={() => setActiveTab('admin')}
          />
        ) : (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Responsible Scraping Notice Banner */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs border border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <span className="font-semibold block sm:inline text-white">Console de Collecte & Normalisation :</span>{' '}
                  <span className="text-slate-300">
                    Collecte automatisée des pharmacies de Bingerville avec déduplication, géolocalisation OSM et vérification des coordonnées téléphoniques ivoiriennes (+225).
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsSearchPanelOpen(true)}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                Lancer une collecte
              </button>
            </div>

            {/* Dashboard Metrics Cards */}
            <div>
              <StatsCards stats={stats} onFilterClick={handleStatsFilterClick} />
            </div>

            {/* Filter Toolbar */}
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              availabilityFilter={availabilityFilter}
              onAvailabilityChange={setAvailabilityFilter}
              locationFilter={locationFilter}
              onLocationChange={setLocationFilter}
              verificationFilter={verificationFilter}
              onVerificationChange={setVerificationFilter}
              gardeFilter={gardeFilter}
              onGardeChange={setGardeFilter}
              sourceFilter={sourceFilter}
              onSourceChange={setSourceFilter}
              sourcesList={distinctSources}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              totalFiltered={filteredPharmacies.length}
              totalRaw={pharmacies.length}
              onResetFilters={handleResetFilters}
            />

            {/* Main Content View (Table or Interactive Map) */}
            {viewMode === 'table' ? (
              <PharmacyTable
                pharmacies={filteredPharmacies}
                onSelect={handleSelectPharmacy}
                onEdit={handleEditPharmacy}
                onDelete={handleDeletePharmacy}
                onMarkVerified={handleMarkVerified}
              />
            ) : (
              <PharmacyMapView
                pharmacies={filteredPharmacies}
                onSelectPharmacy={handleSelectPharmacy}
              />
            )}
          </div>
        )}

        {/* Detailed Modal */}
        <PharmacyModal
          pharmacy={selectedPharmacy}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPharmacy(null);
          }}
          onSave={handleSavePharmacy}
          onDelete={handleDeletePharmacy}
          initialEditMode={modalEditMode}
        />

        {/* Search History Modal */}
        <SearchHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          searches={searches}
        />

        {/* Toast notifications */}
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>PharmaGuard Bingerville</strong> • Application professionnelle de collecte et gestion des pharmacies de garde
          </div>
          <div className="text-[11px] text-slate-400">
            Bingerville, District Autonome d'Abidjan • Données collectées automatiquement à vérifier avant usage médical d'urgence.
          </div>
        </div>
      </footer>
    </div>
  );
}
