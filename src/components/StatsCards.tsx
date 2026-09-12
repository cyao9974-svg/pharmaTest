import React from 'react';
import { DashboardStats } from '../types';
import { Building2, CheckCircle2, Phone, Mail, MapPin, Clock } from 'lucide-react';

interface StatsCardsProps {
  stats: DashboardStats;
  onFilterClick?: (filterType: string) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, onFilterClick }) => {
  const cards = [
    {
      id: 'stat-total',
      label: 'Total pharmacies',
      value: stats.total,
      sub: 'Enregistrées',
      icon: Building2,
      color: 'emerald',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      action: () => onFilterClick && onFilterClick('all'),
    },
    {
      id: 'stat-verified',
      label: 'Vérifiées',
      value: stats.verified,
      sub: `${stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}% du total`,
      icon: CheckCircle2,
      color: 'blue',
      bg: 'bg-blue-50 text-blue-700 border-blue-100',
      action: () => onFilterClick && onFilterClick('verifie'),
    },
    {
      id: 'stat-phone',
      label: 'Avec téléphone',
      value: stats.withPhone,
      sub: 'Numéros CI valides',
      icon: Phone,
      color: 'teal',
      bg: 'bg-teal-50 text-teal-700 border-teal-100',
      action: () => onFilterClick && onFilterClick('has_phone'),
    },
    {
      id: 'stat-email',
      label: 'Avec email',
      value: stats.withEmail,
      sub: 'Adresses publiques',
      icon: Mail,
      color: 'indigo',
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      action: () => onFilterClick && onFilterClick('has_email'),
    },
    {
      id: 'stat-location',
      label: 'Avec localisation',
      value: stats.withLocation,
      sub: 'Coordonnées GPS',
      icon: MapPin,
      color: 'violet',
      bg: 'bg-violet-50 text-violet-700 border-violet-100',
      action: () => onFilterClick && onFilterClick('has_location'),
    },
    {
      id: 'stat-garde',
      label: 'Garde confirmée',
      value: stats.gardeConfirmed,
      sub: 'Tour actuel certifié',
      icon: Clock,
      color: 'amber',
      bg: 'bg-amber-50 text-amber-700 border-amber-100',
      action: () => onFilterClick && onFilterClick('garde_confirme'),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <button
            key={c.id}
            id={c.id}
            onClick={c.action}
            className="text-left bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-700 transition-colors uppercase tracking-wider">
                {c.label}
              </span>
              <div className={`p-1.5 rounded-lg border ${c.bg}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-['Outfit']">
              {c.value}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              {c.sub}
            </div>
          </button>
        );
      })}
    </div>
  );
};
