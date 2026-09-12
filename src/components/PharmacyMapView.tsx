import React, { useState } from 'react';
import { Pharmacy } from '../types';
import { MapPin, Phone, Mail, ExternalLink, Eye, AlertTriangle, Clock } from 'lucide-react';

interface PharmacyMapViewProps {
  pharmacies: Pharmacy[];
  onSelectPharmacy: (pharmacy: Pharmacy) => void;
}

export const PharmacyMapView: React.FC<PharmacyMapViewProps> = ({
  pharmacies,
  onSelectPharmacy,
}) => {
  const geolocated = pharmacies.filter((p) => p.latitude != null && p.longitude != null);
  const [activePharmacy, setActivePharmacy] = useState<Pharmacy | null>(geolocated[0] || null);

  // Bingerville coordinates default
  const defaultLat = activePharmacy?.latitude ?? 5.35821;
  const defaultLon = activePharmacy?.longitude ?? -3.88645;

  // OpenStreetMap embed URL
  const bbox = `${defaultLon - 0.03}%2C${defaultLat - 0.02}%2C${defaultLon + 0.03}%2C${defaultLat + 0.02}`;
  const markerLat = activePharmacy?.latitude ?? defaultLat;
  const markerLon = activePharmacy?.longitude ?? defaultLon;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${markerLat}%2C${markerLon}`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Carte Géographique des Pharmacies de Bingerville
          </h2>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
            {geolocated.length} géolocalisées sur {pharmacies.length}
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Repérage interactif OpenStreetMap & coordonnées réelles
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[480px]">
        {/* Sidebar list of pharmacies */}
        <div className="border-r border-slate-200 overflow-y-auto max-h-[500px] divide-y divide-slate-100">
          {geolocated.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              Aucune pharmacie avec coordonnées GPS dans la sélection actuelle.
            </div>
          ) : (
            geolocated.map((p) => {
              const isSelected = activePharmacy?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setActivePharmacy(p)}
                  className={`p-3 text-xs transition-colors cursor-pointer ${
                    isSelected ? 'bg-emerald-50/80 border-l-4 border-emerald-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-slate-900 line-clamp-1">{p.name}</span>
                    {p.garde_status === 'confirme' && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                        DE GARDE
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-1 mb-1.5">
                    {p.address || `${p.city}, Côte d'Ivoire`}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono">
                      {p.latitude?.toFixed(4)}, {p.longitude?.toFixed(4)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPharmacy(p);
                      }}
                      className="text-emerald-700 hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Fiche</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Map Display */}
        <div className="lg:col-span-2 relative bg-slate-100 flex flex-col">
          <iframe
            title="Bingerville Pharmacy Map"
            src={embedUrl}
            className="w-full h-full min-h-[400px] border-0"
            loading="lazy"
          />

          {/* Active pin badge floating */}
          {activePharmacy && (
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-lg border border-slate-200 text-xs">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <span className="font-bold text-slate-900 block font-['Outfit']">{activePharmacy.name}</span>
                  <span className="text-[11px] text-slate-500 block line-clamp-1">{activePharmacy.address || 'Bingerville'}</span>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${activePharmacy.latitude},${activePharmacy.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-[11px] font-medium inline-flex items-center gap-1 transition-colors shrink-0 shadow-2xs"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Itinéraire</span>
                </a>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-100">
                {activePharmacy.phone ? (
                  <span className="font-mono flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {activePharmacy.phone}
                  </span>
                ) : (
                  <span className="italic text-slate-400">Tél non disponible</span>
                )}
                <span className="text-emerald-700 font-medium">
                  {activePharmacy.garde_status === 'confirme' ? '● De garde confirmée' : 'Garde non confirmée'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
