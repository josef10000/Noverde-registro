import React from 'react';

interface FilterButtonProps {
  label: string;
  count: number;
  colorClass: string;
  active: boolean;
  onClick: () => void;
}

export const FilterButton = ({ 
  label, 
  count, 
  colorClass, 
  active, 
  onClick 
}: FilterButtonProps) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-6 py-3 rounded-xl border transition-all duration-200 ${
      active 
        ? 'border-sky-500 bg-sky-500 text-white shadow-md shadow-sky-500/20' 
        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
    }`}
  >
    <span className="text-sm font-semibold">{label}</span>
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
      active ? 'bg-white/20 text-white' : colorClass
    }`}>
      {count}
    </span>
  </button>
);
