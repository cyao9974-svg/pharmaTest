import React, { useState } from 'react';
import { Pharmacy, VerificationStatus } from '../types';
import {
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle,
  Eye,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Navigation,
} from 'lucide-react';

interface PharmacyTableProps {
  pharmacies: Pharmacy[];
  onSelect: (pharmacy: Pharmacy) => void;
  onEdit: (pharmacy: Pharmacy) => void;
  onDelete: (id: string, name: string) => void;
  onMarkVerified: (pharmacy: Pharmacy) => void;
}

export const PharmacyTable: React.FC<PharmacyTableProps> = ({
  pharmacies,
  onSelect,
  onEdit,
  onDelete,
  onMarkVerified,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyPhone = (e: React.MouseEvent, id: string, phone: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'verifie':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3" />
            Vérifiée
          </span>
        );
      case 'a_verifier':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            À vérifier
          </span>
        );
      case 'informations_incompletes':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3" />
            Incomplète
          </span>
        );
      case 'non_verifie':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Non vérifiée
          </span>
        );
    }
  };

  const getGardeBadge = (pharmacy: Pharmacy) => {
    if (pharmacy.garde_status === 'confirme') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          De garde
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-[10px] text-slate-400">
        Non confirmé
      </span>
    );
  };

  if (pharmacies.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Aucune pharmacie trouvée</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
          Aucun établissement ne correspond à vos critères de recherche. Essayez de réinitialiser vos filtres ou lancez une nouvelle collecte.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Pharmacie</th>
              <th className="py-3 px-3">Statut de Garde</th>
              <th className="py-3 px-3">Téléphone</th>
              <th className="py-3 px-3">Email</th>
              <th className="py-3 px-3">Adresse</th>
              <th className="py-3 px-3">Localisation</th>
              <th className="py-3 px-3">Source</th>
              <th className="py-3 px-3">Vérification</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {pharmacies.map((p) => {
              const hasLocation = p.latitude != null && p.longitude != null;
              const primarySource = p.sources && p.sources.length > 0 ? p.sources[0] : null;

              return (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50/75 transition-colors group"
                >
                  {/* Name */}
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onSelect(p)}
                      className="font-semibold text-slate-900 hover:text-emerald-700 text-left transition-colors cursor-pointer group-hover:underline block"
                    >
                      {p.name}
                    </button>
                    <span className="text-[11px] text-slate-400">
                      {p.city}, {p.country}
                    </span>
                  </td>

                  {/* Guard status */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {getGardeBadge(p)}
                  </td>

                  {/* Phone */}
                  <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                    {p.phone ? (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${p.phone.replace(/\s+/g, '')}`}
                          className="text-slate-800 hover:text-emerald-700 flex items-center gap-1 font-semibold"
                          title={p.secondary_phone ? `Secondaire: ${p.secondary_phone}` : undefined}
                        >
                          <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{p.phone}</span>
                        </a>
                        <button
                          onClick={(e) => handleCopyPhone(e, p.id, p.phone!)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          title="Copier le numéro"
                        >
                          {copiedId === p.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Non disponible</span>
                    )}
                  </td>

                  {/* Email */}
                  <td className="py-3 px-3 max-w-[150px] truncate">
                    {p.email ? (
                      <a
                        href={`mailto:${p.email}`}
                        className="text-slate-800 hover:text-emerald-700 flex items-center gap-1 truncate"
                        title={p.email}
                      >
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{p.email}</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">Non disponible</span>
                    )}
                  </td>

                  {/* Address */}
                  <td className="py-3 px-3 max-w-[180px] truncate" title={p.address || ''}>
                    {p.address ? (
                      <span className="truncate block text-slate-800">{p.address}</span>
                    ) : (
                      <span className="text-slate-400 italic">Bingerville (non précisée)</span>
                    )}
                  </td>

                  {/* Location indicator */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {hasLocation ? (
                      <a
                        href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
                        title={`GPS: ${p.latitude}, ${p.longitude} — Ouvrir dans Google Maps`}
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>📍 Disponible</span>
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-600/90 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>⚠️ Non dispo</span>
                      </span>
                    )}
                  </td>

                  {/* Source */}
                  <td className="py-3 px-3 max-w-[120px] truncate text-[11px]">
                    {primarySource?.source_url ? (
                      <a
                        href={primarySource.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-600 hover:text-emerald-700 inline-flex items-center gap-1 truncate"
                        title={`Source: ${primarySource.source_name}`}
                      >
                        <span className="truncate">{primarySource.source_name}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                      </a>
                    ) : (
                      <span className="text-slate-500 truncate block">
                        {primarySource?.source_name || 'Registre local'}
                      </span>
                    )}
                  </td>

                  {/* Verification Status */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {getStatusBadge(p.verification_status)}
                  </td>

                  {/* Action buttons */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {/* View details */}
                      <button
                        onClick={() => onSelect(p)}
                        title="Consulter les détails"
                        className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Mark verified shortcut */}
                      {p.verification_status !== 'verifie' && (
                        <button
                          onClick={() => onMarkVerified(p)}
                          title="Marquer comme vérifiée"
                          className="p-1 rounded-md text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Edit */}
                      <button
                        onClick={() => onEdit(p)}
                        title="Modifier les données"
                        className="p-1 rounded-md text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDelete(p.id, p.name)}
                        title="Supprimer cette entrée"
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
