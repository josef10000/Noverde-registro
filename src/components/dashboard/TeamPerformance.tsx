import React, { useMemo } from 'react';
import { Trophy, Medal, TrendingUp, Users } from 'lucide-react';
import { Agreement, AgreementStatus, UserProfile } from '../../types';
import { formatCurrency } from '../../utils/masks';

interface TeamPerformanceProps {
  agreements: Agreement[];
  members: UserProfile[];
}

export const TeamPerformance = ({ agreements, members }: TeamPerformanceProps) => {
  // Process data for ranking and table
  const performanceData = useMemo(() => {
    const data: Record<string, { 
      name: string; 
      paid: number; 
      projected: number; 
      daily: Record<string, number> 
    }> = {};

    // Initialize with members
    members.forEach(m => {
      data[m.uid] = { name: m.displayName, paid: 0, projected: 0, daily: {} };
    });

    // Get all unique dates from agreements (sorted)
    const uniqueDates = Array.from(new Set(agreements.map(a => a.createdAt.split('T')[0]))).sort();

    agreements.forEach(a => {
      if (!data[a.operatorId]) return;
      
      const date = a.createdAt.split('T')[0];
      const val = a.value;
      
      data[a.operatorId].projected += val;
      if (a.status === AgreementStatus.PAID) {
        data[a.operatorId].paid += val;
        data[a.operatorId].daily[date] = (data[a.operatorId].daily[date] || 0) + val;
      }
    });

    const ranking = Object.entries(data)
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.paid - a.paid);

    return { ranking, uniqueDates };
  }, [agreements, members]);

  const { ranking, uniqueDates } = performanceData;

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  };

  return (
    <div className="space-y-8">
      {/* Ranking / Leaderboard */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
            <Trophy size={20} />
          </div>
          <h2 className="text-xl font-bold text-white">Ranking de Performance</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ranking.slice(0, 4).map((item, index) => (
            <div 
              key={item.id}
              className={`relative p-6 rounded-3xl border transition-all ${
                index === 0 
                  ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20' 
                  : 'bg-slate-900/50 border-slate-800'
              }`}
            >
              {index < 3 && (
                <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                  index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-300' : 'bg-orange-600'
                }`}>
                  <Medal size={16} className="text-white" />
                </div>
              )}
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-300 border border-slate-700">
                    {item.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">#{index + 1} Lugar</p>
                    <p className="text-sm font-bold text-white truncate max-w-[120px]">{item.name}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Total Pago</span>
                    <span className="text-sm font-bold text-emerald-400">{formatCurrency(item.paid)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${index === 0 ? 'bg-amber-500' : 'bg-primary'}`}
                      style={{ width: `${(item.paid / (ranking[0]?.paid || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Daily Productivity Table */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <TrendingUp size={20} />
          </div>
          <h2 className="text-xl font-bold text-white">Produtividade Diária (Pagos)</h2>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-950/50">
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 sticky left-0 bg-slate-950 z-10">
                    Membro da Equipe
                  </th>
                  {uniqueDates.map(date => (
                    <th key={date} className="px-4 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 min-w-[100px]">
                      {formatDate(date)}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-white uppercase tracking-wider border-b border-slate-800 bg-primary/20">
                    Total Acumulado
                  </th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4 border-b border-slate-800/50 sticky left-0 bg-slate-900 group-hover:bg-slate-800 transition-colors z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                          {row.name[0]}
                        </div>
                        <span className="text-sm font-bold text-slate-200">{row.name}</span>
                      </div>
                    </td>
                    {uniqueDates.map(date => (
                      <td key={date} className="px-4 py-4 text-center border-b border-slate-800/50 text-xs font-medium text-slate-400">
                        {row.daily[date] ? formatCurrency(row.daily[date]) : '-'}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right border-b border-slate-800/50 text-sm font-bold text-emerald-400 bg-emerald-500/5">
                      {formatCurrency(row.paid)}
                    </td>
                  </tr>
                ))}
                {/* Footer Totals */}
                <tr className="bg-slate-950/80">
                  <td className="px-6 py-4 font-bold text-white text-xs uppercase tracking-widest sticky left-0 bg-slate-950">
                    Total Diário
                  </td>
                  {uniqueDates.map(date => (
                    <td key={date} className="px-4 py-4 text-center text-xs font-bold text-white border-t border-slate-700">
                      {formatCurrency(
                        ranking.reduce((acc, curr) => acc + (curr.daily[date] || 0), 0)
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right text-sm font-bold text-white bg-primary/40 border-t border-primary/50">
                    {formatCurrency(ranking.reduce((acc, curr) => acc + curr.paid, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
