import React, { useMemo } from 'react';
import { Trophy, Medal, TrendingUp, Users } from 'lucide-react';
import { Agreement, AgreementStatus, UserProfile } from '../../types';
import { formatCurrency } from '../../utils/masks';

interface TeamPerformanceProps {
  agreements: Agreement[];
  members: UserProfile[];
}

export const TeamPerformance = ({ agreements, members }: TeamPerformanceProps) => {
  if (members.length === 0) {
    return (
      <div className="p-8 border-2 border-dashed border-slate-800 rounded-3xl text-center text-slate-500">
        Nenhum membro encontrado nesta equipe para gerar o ranking.
      </div>
    );
  }

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

      {/* Daily Productivity Table - Request Format */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <TrendingUp size={20} />
          </div>
          <h2 className="text-xl font-bold text-white">Produtividade Diária (Pagos)</h2>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-black text-white uppercase bg-sky-600/40 border-r border-slate-800 sticky left-0 z-20 min-w-[200px]">
                    PAGAMENTO TOTAL
                  </th>
                  {uniqueDates.map(date => (
                    <th key={date} className="px-4 py-3 text-center text-[10px] font-bold text-slate-300 uppercase bg-slate-800/50 border-r border-slate-700/30">
                      {formatDate(date)}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-[11px] font-black text-white uppercase bg-slate-800 border-l border-slate-700 sticky right-0 z-10">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {ranking.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/30 border-b border-slate-800/50">
                    <td className="px-4 py-2.5 font-bold text-xs bg-slate-950 border-r border-slate-800 sticky left-0 z-10 group-hover:bg-slate-900 transition-colors">
                      {row.name}
                    </td>
                    {uniqueDates.map(date => (
                      <td key={date} className="px-4 py-2.5 text-center text-[11px] font-medium border-r border-slate-800/30">
                        {row.daily[date] ? formatCurrency(row.daily[date]) : 'R$ 0,00'}
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-right font-black text-xs text-white bg-slate-900 sticky right-0 z-10 border-l border-slate-800">
                      {formatCurrency(row.paid)}
                    </td>
                  </tr>
                ))}
                {/* Total Footer Row */}
                <tr className="bg-sky-950/20">
                  <td className="px-4 py-3 font-black text-[11px] text-white uppercase bg-sky-600/40 border-r border-slate-800 sticky left-0 z-10">
                    Total
                  </td>
                  {uniqueDates.map(date => (
                    <td key={date} className="px-4 py-3 text-center text-[11px] font-black text-white border-r border-slate-800/50 bg-slate-800/20">
                      {formatCurrency(
                        ranking.reduce((acc, curr) => acc + (curr.daily[date] || 0), 0)
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-black text-[12px] text-sky-400 bg-slate-800 sticky right-0 z-10 border-l border-slate-800">
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
