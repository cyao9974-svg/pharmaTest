import React from 'react';
import { SearchRecord } from '../types';
import { X, History, CheckCircle2, AlertCircle, Clock, Calendar, Database, ShieldAlert } from 'lucide-react';

interface SearchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  searches: SearchRecord[];
}

export const SearchHistoryModal: React.FC<SearchHistoryModalProps> = ({
  isOpen,
  onClose,
  searches,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-white/10 rounded-lg">
              <History className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide font-['Outfit']">
                Historique des Recherches & Collectes
              </h2>
              <p className="text-xs text-slate-400">
                Traçabilité des opérations de collecte, durées et déduplications
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-3">
          {searches.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              Aucun historique de recherche enregistré pour le moment.
            </div>
          ) : (
            searches.map((s) => {
              const dateObj = new Date(s.created_at);
              const dateStr = dateObj.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              });
              const timeStr = dateObj.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={s.id}
                  className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs space-y-2 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{dateStr} — {timeStr}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {s.status}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {s.duration_ms} ms
                    </span>
                  </div>

                  <div className="text-slate-800 font-medium">
                    Recherche : <span className="text-emerald-800">"{s.query}"</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/80 text-[11px] text-slate-600">
                    <div>
                      Résultats finaux : <strong className="text-slate-900">{s.results_count}</strong>
                    </div>
                    <div>
                      Doublons éliminés : <strong className="text-amber-700">{s.duplicates_count}</strong>
                    </div>
                    <div>
                      Ville : <strong className="text-slate-900">{s.city}</strong>
                    </div>
                  </div>

                  {s.logs && s.logs.length > 0 && (
                    <details className="mt-2 text-[10px] text-slate-500 cursor-pointer">
                      <summary className="hover:text-slate-800 select-none">
                        Afficher les étapes de collecte ({s.logs.length})
                      </summary>
                      <div className="mt-1.5 p-2 bg-white rounded-lg border border-slate-200 space-y-1 font-mono">
                        {s.logs.map((l, i) => (
                          <div key={i} className="flex items-start gap-1">
                            <span className="text-slate-400">[{l.step}]</span>
                            <span className="text-slate-700">{l.message}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
