import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  subtitle?: string;
  color: 'primary' | 'emerald' | 'rose' | 'amber';
}

export const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  subtitle,
  color 
}: StatCardProps) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    rose: 'bg-rose-500/10 text-rose-400',
    amber: 'bg-amber-500/10 text-amber-400'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.03] -mr-8 -mt-8 rounded-full blur-2xl group-hover:opacity-[0.07] transition-all" />
      
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-500/20">
            <TrendingUp size={12} />
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{title}</p>
        <h3 className="text-2xl font-black text-white mt-1">{value}</h3>
        {subtitle && (
          <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wider">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
};
