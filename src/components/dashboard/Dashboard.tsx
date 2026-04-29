import React, { useState, useMemo, useEffect } from 'react';
import { 
  PieChart as PieIcon, 
  LogOut, 
  Plus, 
  Search, 
  DollarSign, 
  CheckCircle2, 
  Target, 
  Loader2, 
  Edit3, 
  Trash2, 
  Check 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  orderBy,
  where,
  getDocFromServer
} from 'firebase/firestore';
import { signOut, User } from 'firebase/auth';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

import { auth, db } from '../../lib/firebase';
import { Agreement, AgreementStatus, AgreementOrigin, DashboardStats } from '../../types';
import { formatCurrency } from '../../utils/masks';
import { StatCard } from './StatCard';
import { FilterButton } from './FilterButton';
import { OriginBadge } from './OriginBadge';
import { AgreementModal } from '../modals/AgreementModal';
import { GoalModal } from '../modals/GoalModal';
import { HistoryModal } from '../modals/HistoryModal';

interface DashboardProps {
  user: User;
}

export const Dashboard = ({ user }: DashboardProps) => {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [monthlyGoal, setMonthlyGoal] = useState<number>(50000);
  const [effectivenessGoal, setEffectivenessGoal] = useState<number>(85);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | AgreementStatus>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<Agreement | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [selectedClientCpf, setSelectedClientCpf] = useState<string | null>(null);
  const [clientHistory, setClientHistory] = useState<Agreement[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load Settings
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setMonthlyGoal(data.monthlyGoal || 50000);
        setEffectivenessGoal(data.effectivenessGoal || 85);
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore Subscription
  useEffect(() => {
    const q = query(collection(db, 'agreements'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agreement));
      setAgreements(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Stats calculation
  const stats: DashboardStats = useMemo(() => {
    const totalProjected = agreements.reduce((acc, curr) => acc + curr.value, 0);
    const totalPaid = agreements
      .filter(a => a.status === AgreementStatus.PAID)
      .reduce((acc, curr) => acc + curr.value, 0);
    
    return {
      totalProjected,
      totalPaid,
      effectivenessRate: (totalPaid / (monthlyGoal || 1)) * 100,
      counts: {
        total: agreements.length,
        paid: agreements.filter(a => a.status === AgreementStatus.PAID).length,
        waiting: agreements.filter(a => a.status === AgreementStatus.WAITING).length,
        broken: agreements.filter(a => a.status === AgreementStatus.BROKEN).length,
      }
    };
  }, [agreements, monthlyGoal]);

  // Chart Data
  const chartData = useMemo(() => [
    { name: 'Meta', value: monthlyGoal, color: '#1e293b' },
    { name: 'Pago', value: stats.totalPaid, color: '#10b981' },
    { name: 'Pendente', value: Math.max(0, stats.totalProjected - stats.totalPaid), color: '#f59e0b' }
  ], [monthlyGoal, stats]);

  // Filtering
  const filteredAgreements = useMemo(() => {
    setCurrentPage(1);
    return agreements.filter(agreement => {
      const matchesSearch = 
        agreement.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agreement.clientCpf.includes(searchTerm) ||
        (agreement.email?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFilter = filterStatus === 'all' || agreement.status === filterStatus;
      
      return matchesSearch && matchesFilter;
    });
  }, [agreements, searchTerm, filterStatus]);

  const paginatedAgreements = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAgreements.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAgreements, currentPage]);

  const totalPages = Math.ceil(filteredAgreements.length / itemsPerPage);

  const handleEfetivar = async (id: string) => {
    try {
      await updateDoc(doc(db, 'agreements', id), { 
        status: AgreementStatus.PAID, 
        paidAt: new Date().toISOString() 
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este acordo?')) return;
    try {
      await deleteDoc(doc(db, 'agreements', id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleClientClick = (cpf: string) => {
    setSelectedClientCpf(cpf);
    setIsLoadingHistory(true);
    
    const q = query(
      collection(db, 'agreements'), 
      where('clientCpf', '==', cpf),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agreement));
      setClientHistory(history);
      setIsLoadingHistory(false);
    });

    return () => unsubscribe();
  };

  const handleUpdateGoal = async (newGoal: number, newEffGoal: number) => {
    try {
      await setDoc(doc(db, 'settings', 'global'), { 
        monthlyGoal: newGoal,
        effectivenessGoal: newEffGoal,
        updatedAt: new Date().toISOString()
      });
      setIsGoalModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddOrEditAgreement = async (data: any) => {
    const id = editingAgreement?.id || Math.random().toString(36).substr(2, 9);
    const agreementData = {
      ...data,
      status: (editingAgreement?.status || AgreementStatus.WAITING) as AgreementStatus,
      createdAt: editingAgreement?.createdAt || new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'agreements', id), agreementData);
      setIsModalOpen(false);
      setEditingAgreement(null);
    } catch (error) {
      console.error(error);
    }
  };

  const getEffectivenessColor = (rate: number, goal: number) => {
    if (rate >= goal) return 'text-emerald-400';
    if (rate >= goal * 0.75) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="min-h-screen bg-[#020617] font-sans text-slate-200 pb-20">
      <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-sky-500 text-white p-2 rounded-lg shadow-lg shadow-sky-500/20">
              <PieIcon size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-none">RNV Gestão</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">Dashboard Operacional</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-xs font-bold text-white">{user.displayName || user.email?.split('@')[0]}</span>
              <span className="text-[10px] text-slate-500 font-medium">{user.email}</span>
            </div>
            <button 
              onClick={() => signOut(auth)}
              className="p-2.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 rounded-xl transition-all border border-transparent hover:border-rose-500/20"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-sky-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/10 active:scale-95"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Novo Acordo</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard 
              title="Total Projetado" 
              value={formatCurrency(stats.totalProjected)} 
              icon={DollarSign} 
              colorClass="bg-blue-500/10 text-blue-400" 
            />
            <StatCard 
              title="Efetivamente Pago" 
              value={formatCurrency(stats.totalPaid)} 
              icon={CheckCircle2} 
              trend="12% vs mês ant."
              colorClass="bg-emerald-500/10 text-emerald-400" 
            />
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 rounded-2xl shadow-xl relative group md:col-span-2"
            >
              <button 
                onClick={() => setIsGoalModalOpen(true)}
                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-all bg-slate-900/50 rounded-lg border border-slate-800"
              >
                <Target size={14} />
              </button>
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Recuperação de Cota</p>
                  <h3 className="text-3xl font-bold text-white mt-1">
                    {((stats.totalPaid / (monthlyGoal || 1)) * 100).toFixed(1)}%
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Taxa de Efetividade</p>
                  <p className={`text-xl font-bold ${getEffectivenessColor((stats.counts.paid / (stats.counts.total || 1)) * 100, effectivenessGoal)}`}>
                    {((stats.counts.paid / (stats.counts.total || 1)) * 100).toFixed(1)}%
                  </p>
                  <p className="text-[8px] text-slate-500 font-medium uppercase mt-0.5">Base: {stats.counts.total} acordos</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <span>Progresso da Recuperação</span>
                  <span>Meta: {formatCurrency(monthlyGoal)}</span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((stats.totalPaid / (monthlyGoal || 1)) * 100, 100)}%` }}
                    className={`h-full rounded-full bg-gradient-to-r from-sky-600 to-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.4)]`}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                   <span>Recuperado: {formatCurrency(stats.totalPaid)}</span>
                   <span>Faltam: {formatCurrency(Math.max(0, monthlyGoal - stats.totalPaid))}</span>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="glass-card p-6 rounded-2xl shadow-xl flex flex-col">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Performance vs Meta</h4>
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap gap-4">
          <FilterButton 
            label="Total" 
            count={stats.counts.total} 
            colorClass="bg-slate-800 text-slate-400" 
            active={filterStatus === 'all'} 
            onClick={() => setFilterStatus('all')}
          />
          <FilterButton 
            label="Pagos" 
            count={stats.counts.paid} 
            colorClass="bg-emerald-500/10 text-emerald-400" 
            active={filterStatus === AgreementStatus.PAID} 
            onClick={() => setFilterStatus(AgreementStatus.PAID)}
          />
          <FilterButton 
            label="Aguardando" 
            count={stats.counts.waiting} 
            colorClass="bg-amber-500/10 text-amber-400" 
            active={filterStatus === AgreementStatus.WAITING} 
            onClick={() => setFilterStatus(AgreementStatus.WAITING)}
          />
          <FilterButton 
            label="Faltas/Quebrados" 
            count={stats.counts.broken} 
            colorClass="bg-rose-500/10 text-rose-400" 
            active={filterStatus === AgreementStatus.BROKEN} 
            onClick={() => setFilterStatus(AgreementStatus.BROKEN)}
          />
        </section>

        <section className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-sky-400 transition-colors">
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Buscar por Nome, CPF ou E-mail..." 
            className="w-full bg-slate-950 border border-slate-800 pl-12 pr-6 py-4 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500/50 transition-all text-slate-200 placeholder:text-slate-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </section>

        <section className="glass-card rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-500">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Cliente</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Origem</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Vencimento</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Valor</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin text-sky-500" size={32} />
                        <span>Carregando acordos...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {paginatedAgreements.map((agreement) => (
                      <motion.tr 
                        key={agreement.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`group transition-colors ${
                          agreement.status === AgreementStatus.PAID 
                            ? 'bg-emerald-500/5' 
                            : agreement.status === AgreementStatus.BROKEN 
                              ? 'bg-rose-500/5' 
                              : 'hover:bg-slate-800/30'
                        }`}
                      >
                        <td className="px-6 py-5">
                          <button 
                            onClick={() => handleClientClick(agreement.clientCpf)}
                            className="flex flex-col text-left hover:opacity-70 transition-opacity"
                          >
                            <span className={`font-semibold text-slate-100 ${agreement.status === AgreementStatus.BROKEN ? 'text-slate-500' : ''}`}>
                              {agreement.clientName}
                            </span>
                            <span className="text-xs text-sky-400/70 font-mono mt-0.5">{agreement.clientCpf}</span>
                          </button>
                        </td>
                        <td className="px-6 py-5">
                          <OriginBadge origin={agreement.origin} />
                        </td>
                        <td className="px-6 py-5 text-sm font-medium text-slate-300">
                          {new Date(agreement.dueDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-5 text-sm font-bold text-white tabular-nums">
                          {formatCurrency(agreement.value)}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {agreement.status === AgreementStatus.PAID ? (
                              <div className="flex items-center gap-1.5 text-emerald-400 pr-2">
                                 <CheckCircle2 size={16} />
                                 <span className="text-xs font-bold uppercase tracking-wide">Pago</span>
                              </div>
                            ) : (
                              <button 
                                onClick={() => handleEfetivar(agreement.id)}
                                className="bg-emerald-500/10 text-emerald-400 p-2 rounded-lg hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
                                title="Efetivar Pagamento"
                              >
                                <Check size={18} />
                              </button>
                            )}

                            <div className="flex items-center gap-1 border-l border-slate-800 pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => {
                                  setEditingAgreement(agreement);
                                  setIsModalOpen(true);
                                }}
                                className="p-2 text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-all"
                                title="Editar"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDelete(agreement.id)}
                                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/30">
              <p className="text-xs text-slate-500">
                Mostrando <span className="font-bold text-slate-300">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-bold text-slate-300">{Math.min(currentPage * itemsPerPage, filteredAgreements.length)}</span> de <span className="font-bold text-slate-300">{filteredAgreements.length}</span> acordos
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg border border-slate-800 text-xs font-bold text-slate-400 hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg border border-slate-800 text-xs font-bold text-slate-400 hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      <AgreementModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAgreement(null);
        }}
        onSubmit={handleAddOrEditAgreement}
        editingAgreement={editingAgreement}
      />

      <GoalModal 
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSubmit={handleUpdateGoal}
        monthlyGoal={monthlyGoal}
        effectivenessGoal={effectivenessGoal}
      />

      <HistoryModal 
        isOpen={!!selectedClientCpf}
        onClose={() => setSelectedClientCpf(null)}
        clientCpf={selectedClientCpf}
        history={clientHistory}
        isLoading={isLoadingHistory}
      />
    </div>
  );
};
