import React, { useState, useEffect } from 'react';
import { Pharmacy, VerificationStatus, GardeStatus } from '../types';
import {
  X,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  CheckCircle,
  Calendar,
  AlertTriangle,
  Clock,
  Save,
  Trash2,
  Shield,
  Layers,
  FileText,
} from 'lucide-react';

interface PharmacyModalProps {
  pharmacy: Pharmacy | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Pharmacy>) => Promise<void>;
  onDelete: (id: string, name: string) => Promise<void>;
  initialEditMode?: boolean;
}

export const PharmacyModal: React.FC<PharmacyModalProps> = ({
  pharmacy,
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialEditMode = false,
}) => {
  if (!isOpen || !pharmacy) return null;

  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [formData, setFormData] = useState<Partial<Pharmacy>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData({
      name: pharmacy.name,
      phone: pharmacy.phone || '',
      secondary_phone: pharmacy.secondary_phone || '',
      email: pharmacy.email || '',
      address: pharmacy.address || '',
      city: pharmacy.city || 'Bingerville',
      country: pharmacy.country || "Côte d'Ivoire",
      latitude: pharmacy.latitude != null ? pharmacy.latitude : undefined,
      longitude: pharmacy.longitude != null ? pharmacy.longitude : undefined,
      verification_status: pharmacy.verification_status,
      garde_status: pharmacy.garde_status,
      garde_start: pharmacy.garde_start ? pharmacy.garde_start.slice(0, 10) : '',
      garde_end: pharmacy.garde_end ? pharmacy.garde_end.slice(0, 10) : '',
      notes: pharmacy.notes || '',
    });
    setIsEditing(initialEditMode);
  }, [pharmacy, initialEditMode]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(pharmacy.id, formData);
      setIsEditing(false);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickVerify = async () => {
    setIsSaving(true);
    try {
      await onSave(pharmacy.id, { verification_status: 'verifie' });
    } finally {
      setIsSaving(false);
    }
  };

  const hasLocation = pharmacy.latitude != null && pharmacy.longitude != null;
  const mapUrl = hasLocation
    ? `https://www.google.com/maps?q=${pharmacy.latitude},${pharmacy.longitude}`
    : `https://www.google.com/maps/search/${encodeURIComponent(pharmacy.name + ' Bingerville')}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 px-6 py-4 text-white flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-white/20">
                Fiche Établissement
              </span>
              {pharmacy.garde_status === 'confirme' && (
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-emerald-400 text-emerald-950">
                  De garde confirmée
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold font-['Outfit']">{pharmacy.name}</h2>
            <p className="text-xs text-emerald-100">Bingerville, Côte d'Ivoire</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5 text-xs text-slate-700">
          
          {/* View Mode */}
          {!isEditing ? (
            <>
              {/* Guard period alert banner */}
              <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                pharmacy.garde_status === 'confirme'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <Clock className={`w-4 h-4 shrink-0 mt-0.5 ${pharmacy.garde_status === 'confirme' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <div className="font-semibold text-xs">
                    {pharmacy.garde_status === 'confirme' ? 'Pharmacie de garde active' : 'Statut de garde non confirmé'}
                  </div>
                  <div className="text-[11px] mt-0.5 text-slate-600">
                    {pharmacy.garde_start && pharmacy.garde_end ? (
                      <span>
                        Période de garde renseignée : du <strong>{new Date(pharmacy.garde_start).toLocaleDateString('fr-FR')}</strong> au <strong>{new Date(pharmacy.garde_end).toLocaleDateString('fr-FR')}</strong>
                      </span>
                    ) : (
                      <span>
                        Cette officine est répertoriée à Bingerville. La période de tour de garde spécifique n'est pas certifiée pour la date actuelle.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* General Contact Info Grid */}
              <div className="bg-slate-50/75 rounded-xl border border-slate-200/80 p-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Coordonnées & Contact</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Téléphone principal</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {pharmacy.phone ? (
                        <a href={`tel:${pharmacy.phone.replace(/\s+/g, '')}`} className="text-emerald-700 hover:underline">
                          {pharmacy.phone}
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Non disponible</span>
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Téléphone secondaire</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {pharmacy.secondary_phone ? (
                        <a href={`tel:${pharmacy.secondary_phone.replace(/\s+/g, '')}`} className="text-emerald-700 hover:underline">
                          {pharmacy.secondary_phone}
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Non disponible</span>
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Adresse email</span>
                    <span className="font-semibold text-slate-900">
                      {pharmacy.email ? (
                        <a href={`mailto:${pharmacy.email}`} className="text-emerald-700 hover:underline">
                          {pharmacy.email}
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Non disponible</span>
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Adresse géographique</span>
                    <span className="text-slate-800">
                      {pharmacy.address || <span className="text-slate-400 italic">Bingerville, Côte d'Ivoire (Non précisée)</span>}
                    </span>
                  </div>
                </div>
              </div>

              {/* Geographic Coordinates & Map */}
              <div className="bg-slate-50/75 rounded-xl border border-slate-200/80 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Localisation & Cartographie</span>
                  </h3>
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Voir sur la carte</span>
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Latitude</span>
                    <span className="font-mono font-medium text-slate-800">
                      {pharmacy.latitude != null ? pharmacy.latitude : 'Non disponible'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Longitude</span>
                    <span className="font-mono font-medium text-slate-800">
                      {pharmacy.longitude != null ? pharmacy.longitude : 'Non disponible'}
                    </span>
                  </div>
                </div>

                {hasLocation ? (
                  <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>📍 Localisation disponible avec repérage GPS précis à Bingerville</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>⚠️ Localisation non disponible (coordonnées GPS absentes)</span>
                  </div>
                )}
              </div>

              {/* Source & Verification Status */}
              <div className="bg-slate-50/75 rounded-xl border border-slate-200/80 p-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Traçabilité & Vérification</span>
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Statut de vérification :</span>
                    <span className="font-semibold text-slate-800 capitalize">
                      {pharmacy.verification_status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Date de collecte :</span>
                    <span className="text-slate-700">
                      {new Date(pharmacy.created_at).toLocaleString('fr-FR')}
                    </span>
                  </div>

                  <div className="pt-1">
                    <span className="text-slate-500 block text-[11px] mb-1">Sources d'origine :</span>
                    {pharmacy.sources && pharmacy.sources.length > 0 ? (
                      <div className="space-y-1">
                        {pharmacy.sources.map((s) => (
                          <div key={s.id} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-md border border-slate-200">
                            <span className="font-medium text-slate-800">{s.source_name}</span>
                            {s.source_url && (
                              <a
                                href={s.source_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-700 hover:underline inline-flex items-center gap-1"
                              >
                                <span>Lien source</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Répertoire public</span>
                    )}
                  </div>

                  {pharmacy.notes && (
                    <div className="mt-2 p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-lg text-amber-900 text-xs">
                      <strong>Notes :</strong> {pharmacy.notes}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Edit Form Mode */
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom de la pharmacie</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone principal</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    placeholder="+225 07 00 00 00 00"
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone secondaire</label>
                  <input
                    type="text"
                    value={formData.secondary_phone || ''}
                    placeholder="+225 27 00 00 00 00"
                    onChange={(e) => setFormData({ ...formData, secondary_phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  placeholder="contact@pharmacie.ci"
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse physique</label>
                <input
                  type="text"
                  value={formData.address || ''}
                  placeholder="Quartier, Rue, Repère à Bingerville"
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.latitude ?? ''}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.longitude ?? ''}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Statut de vérification</label>
                  <select
                    value={formData.verification_status}
                    onChange={(e) => setFormData({ ...formData, verification_status: e.target.value as VerificationStatus })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  >
                    <option value="non_verifie">Non vérifiée</option>
                    <option value="verifie">Vérifiée</option>
                    <option value="a_verifier">À vérifier</option>
                    <option value="informations_incompletes">Informations incomplètes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Statut de garde</label>
                  <select
                    value={formData.garde_status}
                    onChange={(e) => setFormData({ ...formData, garde_status: e.target.value as GardeStatus })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  >
                    <option value="confirme">De garde confirmée</option>
                    <option value="non_confirme">Non confirmé</option>
                    <option value="inconnu">Inconnu</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Début de garde</label>
                  <input
                    type="date"
                    value={formData.garde_start || ''}
                    onChange={(e) => setFormData({ ...formData, garde_start: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fin de garde</label>
                  <input
                    type="date"
                    value={formData.garde_end || ''}
                    onChange={(e) => setFormData({ ...formData, garde_end: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes complémentaires</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  placeholder="Informations utiles, horaires spéciaux, etc."
                />
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <div>
            {!isEditing ? (
              <button
                onClick={() => onDelete(pharmacy.id, pharmacy.name)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer</span>
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                {pharmacy.verification_status !== 'verifie' && (
                  <button
                    onClick={handleQuickVerify}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Marquer comme vérifiée</span>
                  </button>
                )}
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  <span>Modifier</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
