import React, { useState, useEffect, useMemo } from 'react';
import { Pharmacy, GardeStatus } from '../types';
import {
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  Navigation,
  Share2,
  AlertCircle,
  Search,
  Crosshair,
  ExternalLink,
  MessageCircle,
  Check,
  Copy,
  HeartHandshake,
  HelpCircle,
  Sparkles,
  ChevronRight,
  Send,
  X,
} from 'lucide-react';

interface CitizenUserInterfaceProps {
  pharmacies: Pharmacy[];
  onSelectPharmacy: (pharmacy: Pharmacy) => void;
  onSwitchToAdmin: () => void;
}

// Distance calculation using Haversine formula
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Clean phone for tel: and whatsapp
function cleanPhoneForDialer(phone: string | null): string {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '');
}

function cleanPhoneForWhatsApp(phone: string | null): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  // Côte d'Ivoire national prefix handling (10 digits starting with 01, 05, 07, 21, 25, 27)
  if (digits.length === 10 && !digits.startsWith('225')) {
    digits = '225' + digits;
  }
  return digits;
}

export const CitizenUserInterface: React.FC<CitizenUserInterfaceProps> = ({
  pharmacies,
  onSelectPharmacy,
  onSwitchToAdmin,
}) => {
  // Local time in Bingerville (UTC+0 / GMT)
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isNightTime, setIsNightTime] = useState(false);
  const [isWeekend, setIsWeekend] = useState(false);

  // User location & proximity
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [sortByDistance, setSortByDistance] = useState(false);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
  const [onlyGarde, setOnlyGarde] = useState<boolean>(true);
  const [onlyWithLocation, setOnlyWithLocation] = useState<boolean>(false);

  // Copy feedback state
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  // Citizen report modal
  const [reportingPharmacy, setReportingPharmacy] = useState<Pharmacy | null>(null);
  const [reportIssueType, setReportIssueType] = useState('phone_error');
  const [reportComment, setReportComment] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // Live clock and guard status detection for Bingerville
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format for Abidjan / Bingerville (GMT)
      const timeStr = now.toLocaleTimeString('fr-FR', {
        timeZone: 'Africa/Abidjan',
        hour: '2-digit',
        minute: '2-digit',
      });
      const day = now.getUTCDay(); // 0 is Sunday, 6 is Saturday
      const hour = now.getUTCHours();

      setCurrentTime(timeStr);
      setIsWeekend(day === 0 || day === 6 || (day === 5 && hour >= 18));
      setIsNightTime(hour >= 20 || hour < 8);
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Request browser GPS position
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }
    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setIsLocating(false);
        setSortByDistance(true);
      },
      (err) => {
        setIsLocating(false);
        setLocationError("Impossible d'obtenir votre position GPS. Vérifiez les autorisations du navigateur.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Copy phone number
  const handleCopyPhone = (e: React.MouseEvent, id: string, phone: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(id);
    setTimeout(() => setCopiedPhoneId(null), 2500);
  };

  // Share pharmacy
  const handleSharePharmacy = async (e: React.MouseEvent, pharmacy: Pharmacy) => {
    e.stopPropagation();
    const text = `🏥 ${pharmacy.name} - Bingerville\n📞 Tél: ${pharmacy.phone || 'Non renseigné'}\n📍 Adresse: ${pharmacy.address || 'Bingerville'}\nStatut: ${pharmacy.garde_status === 'confirme' ? 'DE GARDE' : 'Pharmacie répertoriée'}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: pharmacy.name,
          text: text,
          url: pharmacy.latitude ? `https://www.google.com/maps?q=${pharmacy.latitude},${pharmacy.longitude}` : window.location.href,
        });
      } catch {
        // Fallback to clipboard
        navigator.clipboard.writeText(text);
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Informations de la pharmacie copiées dans le presse-papiers !');
    }
  };

  // Neighborhood pill definitions in Bingerville
  const neighborhoods = [
    { id: 'all', label: 'Tout Bingerville' },
    { id: 'centre', label: 'Centre-Ville / Marché', keyword: 'centre' },
    { id: 'feh_kesse', label: 'Feh Kessé', keyword: 'feh' },
    { id: 'savane', label: 'Savane / Cité', keyword: 'savane' },
    { id: 'bel_horizon', label: 'Bel Horizon', keyword: 'horizon' },
    { id: 'gbagba', label: 'Gbagba', keyword: 'gbagba' },
    { id: 'abatta', label: 'Abatta / Blanchon', keyword: 'abatta' },
    { id: 'akouai', label: 'Akouai Santai', keyword: 'akouai' },
  ];

  // Filter and sort pharmacies
  const displayPharmacies = useMemo(() => {
    let list = pharmacies.filter((p) => {
      // Garde filter
      if (onlyGarde && p.garde_status !== 'confirme') {
        return false;
      }

      // Location filter
      if (onlyWithLocation && (p.latitude == null || p.longitude == null)) {
        return false;
      }

      // Neighborhood filter
      if (selectedNeighborhood !== 'all') {
        const foundNb = neighborhoods.find((n) => n.id === selectedNeighborhood);
        if (foundNb && foundNb.keyword) {
          const kw = foundNb.keyword.toLowerCase();
          const matches =
            (p.address && p.address.toLowerCase().includes(kw)) ||
            p.name.toLowerCase().includes(kw);
          if (!matches) return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          p.name.toLowerCase().includes(q) ||
          (p.phone && p.phone.toLowerCase().includes(q)) ||
          (p.address && p.address.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });

    // Add distance property if user location is known
    const listWithDistance = list.map((p) => {
      let distanceKm: number | null = null;
      if (userLocation && p.latitude != null && p.longitude != null) {
        distanceKm = calculateDistanceKm(userLocation.lat, userLocation.lng, p.latitude, p.longitude);
      }
      return { ...p, distanceKm };
    });

    // Sorting
    if (sortByDistance && userLocation) {
      listWithDistance.sort((a, b) => {
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    } else {
      // Default: Garde confirmée first, then verified
      listWithDistance.sort((a, b) => {
        if (a.garde_status === 'confirme' && b.garde_status !== 'confirme') return -1;
        if (a.garde_status !== 'confirme' && b.garde_status === 'confirme') return 1;
        if (a.verification_status === 'verifie' && b.verification_status !== 'verifie') return -1;
        if (a.verification_status !== 'verifie' && b.verification_status === 'verifie') return 1;
        return a.name.localeCompare(b.name);
      });
    }

    return listWithDistance;
  }, [
    pharmacies,
    onlyGarde,
    onlyWithLocation,
    selectedNeighborhood,
    searchQuery,
    userLocation,
    sortByDistance,
  ]);

  const gardeCount = useMemo(() => {
    return pharmacies.filter((p) => p.garde_status === 'confirme').length;
  }, [pharmacies]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Emergency Live Alert Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-emerald-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Garde active à Bingerville
              </span>
              <span className="text-xs text-emerald-200/90 font-medium">
                Heure locale : <strong className="text-white font-mono">{currentTime || '12:00'} GMT</strong>
              </span>
              {(isNightTime || isWeekend) && (
                <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-200 border border-amber-400/30 text-[11px] font-medium">
                  {isNightTime ? '🌙 Service de nuit en cours' : '☀️ Garde de week-end en cours'}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight font-['Outfit'] text-white">
              Pharmacies de garde ouvertes maintenant à Bingerville
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
              Consultez les officines assurant le service d'urgence médicale de jour et de nuit. Appelez toujours la pharmacie avant tout déplacement pour confirmer la disponibilité de vos produits de santé.
            </p>
          </div>

          {/* Emergency Hotlines Strip */}
          <div className="bg-emerald-950/60 border border-emerald-700/60 rounded-xl p-3 shrink-0 flex flex-col gap-2">
            <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-300" />
              Numéros d'urgence Bingerville
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <a
                href="tel:185"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
                title="SAMU Côte d'Ivoire"
              >
                <Phone className="w-3 h-3 text-emerald-300 shrink-0" />
                <span>SAMU: <strong>185</strong></span>
              </a>
              <a
                href="tel:180"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
                title="Sapeurs-Pompiers Militaires"
              >
                <Phone className="w-3 h-3 text-red-300 shrink-0" />
                <span>Pompiers: <strong>180</strong></span>
              </a>
              <a
                href="tel:2722403112"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
                title="Commissariat de Police de Bingerville"
              >
                <Phone className="w-3 h-3 text-blue-300 shrink-0" />
                <span>Police: <strong>170</strong></span>
              </a>
              <a
                href="tel:2722403008"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
                title="Hôpital Général CME Bingerville"
              >
                <Phone className="w-3 h-3 text-purple-300 shrink-0" />
                <span>Hôpital CME</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search & Neighborhood Quick Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
        
        {/* Search input + Geolocation trigger */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              id="citizen-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une pharmacie, une rue, un quartier à Bingerville..."
              className="w-full pl-10 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Proximity GPS Button */}
          <button
            onClick={handleRequestLocation}
            disabled={isLocating}
            id="btn-citizen-gps-location"
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs shrink-0 ${
              userLocation
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin text-emerald-400' : ''}`} />
            <span>
              {isLocating
                ? 'Calcul GPS en cours...'
                : userLocation
                ? 'Position GPS active'
                : 'Pharmacies près de moi'}
            </span>
          </button>
        </div>

        {locationError && (
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{locationError}</span>
          </div>
        )}

        {/* Neighborhood filter pills */}
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
            Sélectionner un quartier à Bingerville
          </div>
          <div className="flex flex-wrap gap-1.5">
            {neighborhoods.map((nb) => {
              const isActive = selectedNeighborhood === nb.id;
              return (
                <button
                  key={nb.id}
                  onClick={() => setSelectedNeighborhood(nb.id)}
                  id={`pill-neighborhood-${nb.id}`}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-2xs font-semibold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/70'
                  }`}
                >
                  {nb.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Toggles & Active Counts */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center flex-wrap gap-3">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                id="toggle-only-garde"
                checked={onlyGarde}
                onChange={(e) => setOnlyGarde(e.target.checked)}
                className="w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span className="font-medium text-slate-700">
                Uniquement de garde confirmée ({gardeCount})
              </span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                id="toggle-only-gps"
                checked={onlyWithLocation}
                onChange={(e) => setOnlyWithLocation(e.target.checked)}
                className="w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span className="font-medium text-slate-700">
                Avec positionnement GPS
              </span>
            </label>

            {userLocation && (
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="toggle-sort-distance"
                  checked={sortByDistance}
                  onChange={(e) => setSortByDistance(e.target.checked)}
                  className="w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <span className="font-medium text-emerald-800">
                  Trier par proximité GPS
                </span>
              </label>
            )}
          </div>

          <div className="text-slate-500">
            <strong>{displayPharmacies.length}</strong> pharmacie{displayPharmacies.length > 1 ? 's' : ''} disponible{displayPharmacies.length > 1 ? 's' : ''}
          </div>
        </div>

      </div>

      {/* 3. Pharmacy Cards List for Citizens */}
      {displayPharmacies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            Aucune pharmacie ne correspond à votre filtre
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Aucune officine de garde ne correspond à cette recherche. Essayez de désactiver le filtre "Uniquement de garde" pour voir toutes les pharmacies de Bingerville.
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <button
              onClick={() => {
                setOnlyGarde(false);
                setSelectedNeighborhood('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-xl hover:bg-emerald-800 transition-colors cursor-pointer"
            >
              Afficher toutes les pharmacies
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayPharmacies.map((pharmacy) => {
            const isGarde = pharmacy.garde_status === 'confirme';
            const hasGPS = pharmacy.latitude != null && pharmacy.longitude != null;
            const cleanPhone = cleanPhoneForDialer(pharmacy.phone);
            const waPhone = cleanPhoneForWhatsApp(pharmacy.phone);
            const isCopied = copiedPhoneId === pharmacy.id;

            return (
              <div
                key={pharmacy.id}
                className={`rounded-2xl border transition-all duration-200 bg-white shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden ${
                  isGarde
                    ? 'border-emerald-300 ring-1 ring-emerald-400/20'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {isGarde ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                          DE GARDE ACTUELLE
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Horaires ordinaires
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {pharmacy.verification_status === 'verifie' && (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"
                          title="Coordonnées vérifiées par l'équipe PharmaGuard"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Vérifiée
                        </span>
                      )}

                      <button
                        onClick={(e) => handleSharePharmacy(e, pharmacy)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Partager les coordonnées de cette pharmacie"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Pharmacy Name & Address */}
                  <div>
                    <h3
                      onClick={() => onSelectPharmacy(pharmacy)}
                      className="text-base font-bold text-slate-900 hover:text-emerald-800 transition-colors cursor-pointer font-['Outfit'] line-clamp-1"
                    >
                      {pharmacy.name}
                    </h3>

                    <div className="mt-1 flex items-start gap-1.5 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        {pharmacy.address || 'Bingerville, Côte d’Ivoire'}
                      </span>
                    </div>
                  </div>

                  {/* Proximity / Distance Badge */}
                  {(pharmacy as any).distanceKm != null && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold">
                      <Crosshair className="w-3.5 h-3.5 text-teal-600" />
                      <span>À environ <strong>{(pharmacy as any).distanceKm} km</strong> de votre position</span>
                    </div>
                  )}

                  {/* Primary & Secondary Phones */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    {pharmacy.phone ? (
                      <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-medium">Téléphone principal</span>
                            <a
                              href={`tel:${cleanPhone}`}
                              className="font-mono font-bold text-xs sm:text-sm text-slate-900 hover:text-emerald-700 hover:underline"
                            >
                              {pharmacy.phone}
                            </a>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleCopyPhone(e, pharmacy.id, pharmacy.phone!)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                          title="Copier le numéro"
                        >
                          {isCopied ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic py-1">
                        Numéro de téléphone non renseigné
                      </div>
                    )}

                    {pharmacy.secondary_phone && (
                      <div className="text-[11px] text-slate-500 px-1">
                        Secondaire : <a href={`tel:${cleanPhoneForDialer(pharmacy.secondary_phone)}`} className="font-mono hover:underline text-slate-700">{pharmacy.secondary_phone}</a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Quick Action Buttons */}
                <div className="bg-slate-50/80 p-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
                  {/* Call Button */}
                  {pharmacy.phone ? (
                    <a
                      href={`tel:${cleanPhone}`}
                      id={`btn-call-${pharmacy.id}`}
                      className="col-span-1 inline-flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-2xs cursor-pointer text-center"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Appeler</span>
                    </a>
                  ) : (
                    <button
                      disabled
                      className="col-span-1 inline-flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-slate-400 bg-slate-100 cursor-not-allowed text-center text-[11px]"
                    >
                      Pas de tél
                    </button>
                  )}

                  {/* GPS Navigation */}
                  {hasGPS ? (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.latitude},${pharmacy.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      id={`btn-nav-${pharmacy.id}`}
                      className="col-span-1 inline-flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-medium bg-white text-slate-800 hover:bg-slate-100 border border-slate-300 transition-colors shadow-2xs text-center"
                    >
                      <Navigation className="w-3.5 h-3.5 text-blue-600" />
                      <span>Itinéraire</span>
                    </a>
                  ) : (
                    <button
                      onClick={() => onSelectPharmacy(pharmacy)}
                      className="col-span-1 inline-flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 text-[11px]"
                    >
                      Détails
                    </button>
                  )}

                  {/* WhatsApp Inquiry */}
                  {pharmacy.phone ? (
                    <a
                      href={`https://wa.me/${waPhone}?text=${encodeURIComponent(
                        `Bonjour Pharmacie ${pharmacy.name}, je vous contacte suite à votre inscription sur PharmaGuard Bingerville. Avez-vous de la disponibilité pour une garde / urgence ?`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      id={`btn-wa-${pharmacy.id}`}
                      className="col-span-1 inline-flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-medium bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors text-center"
                      title="Contacter sur WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                  ) : (
                    <button
                      onClick={() => setReportingPharmacy(pharmacy)}
                      className="col-span-1 inline-flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 text-[11px]"
                    >
                      Signaler
                    </button>
                  )}
                </div>

                {/* Micro-bar: Report error or note */}
                <div className="px-4 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Bingerville, Côte d'Ivoire</span>
                  <button
                    onClick={() => {
                      setReportingPharmacy(pharmacy);
                      setReportSubmitted(false);
                      setReportComment('');
                    }}
                    className="hover:text-slate-600 hover:underline cursor-pointer"
                  >
                    Signaler une erreur
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 4. Practical Guide for Citizens */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
              Conseils pratiques pour les urgences nocturnes et de week-end à Bingerville
            </h3>
            <p className="text-xs text-slate-500">
              Guide citoyen pour se procurer des médicaments en dehors des heures habituelles.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-xs text-slate-800">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">1</span>
              Toujours téléphoner avant de se déplacer
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pour vous éviter des trajets inutiles la nuit, composez le numéro de la pharmacie de garde pour vous assurer que le pharmacien est réveillé et que le traitement prescrit est bien en stock.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-xs text-slate-800">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">2</span>
              Avoir une ordonnance médicale valide
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              La dispensation des antibiotiques, antalgiques majeurs et injectables en service de garde nécessite obligatoirement la présentation de l'ordonnance médicale rédigée par un médecin.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-xs text-slate-800">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center">3</span>
              Moyens de paiement acceptés
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Prévoyez de la monnaie en espèces ou votre téléphone avec solde actif Wave, Orange Money ou MTN Mobile Money, car certains terminaux bancaires peuvent être indisponibles la nuit.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Citizen Report Dialog Modal */}
      {reportingPharmacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h4 className="text-sm font-bold text-slate-900 font-['Outfit']">
                  Signaler une information à mettre à jour
                </h4>
              </div>
              <button
                onClick={() => setReportingPharmacy(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Aidez la communauté de Bingerville à maintenir des informations fiables concernant <strong>{reportingPharmacy.name}</strong>.
            </p>

            {reportSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <Check className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="text-xs font-semibold text-emerald-800">
                  Merci pour votre contribution citoyenne !
                </div>
                <div className="text-[11px] text-emerald-600">
                  L'équipe de modération va vérifier et actualiser la fiche sous peu.
                </div>
                <button
                  onClick={() => setReportingPharmacy(null)}
                  className="mt-2 px-4 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setReportSubmitted(true);
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Motif du signalement</label>
                  <select
                    value={reportIssueType}
                    onChange={(e) => setReportIssueType(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="phone_error">Numéro de téléphone erroné ou injoignable</option>
                    <option value="closed_pharmacy">Pharmacie fermée alors qu'indiquée de garde</option>
                    <option value="location_wrong">Position GPS ou adresse inexacte</option>
                    <option value="new_info">Autre précision utile</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Détails ou nouveau numéro</label>
                  <textarea
                    rows={3}
                    value={reportComment}
                    onChange={(e) => setReportComment(e.target.value)}
                    placeholder="Ex: Le nouveau numéro direct de garde est le +225 07 00 00 00 00..."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs placeholder:text-slate-400"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportingPharmacy(null)}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-medium cursor-pointer"
                  >
                    Envoyer le signalement
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
