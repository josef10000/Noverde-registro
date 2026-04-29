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
  Check,
  User as UserIcon,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion';
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
import { 
  Agreement, 
  AgreementStatus, 
  AgreementOrigin, 
  DashboardStats, 
  UserProfile, 
  Team 
} from '../../types';
import { getTeamData } from '../../lib/teams';
import { formatCurrency } from '../../utils/masks';
import { StatCard } from './StatCard';
import { FilterButton } from './FilterButton';
import { OriginBadge } from './OriginBadge';
import { AgreementModal } from '../modals/AgreementModal';
import { GoalModal } from '../modals/GoalModal';
import { HistoryModal } from '../modals/HistoryModal';


interface DashboardProps {
  user: User;
  profile: UserProfile;
  onSettingsClick: () => void;
}

export const Dashboard = ({ user, profile, onSettingsClick }: DashboardProps) => {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [monthlyGoal, setMonthlyGoal] = useState<number>(50000);
  const [effectivenessGoal, setEffectivenessGoal] = useState<number>(85);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | AgreementStatus>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<Agreement | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'personal' | 'team'>(profile.role === 'supervisor' ? 'team' : 'personal');
  const [team, setTeam] = useState<Team | null>(null);

  const [selectedTeamId, setSelectedTeamId] = useState<string | 'all'>(profile.teamId || 'all');
  const [managedTeamsData, setManagedTeamsData] = useState<Team[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [selectedClientCpf, setSelectedClientCpf] = useState<string | null>(null);
  const [clientHistory, setClientHistory] = useState<Agreement[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load Managed Teams Info
  useEffect(() => {
    const loadTeams = async () => {
      if (profile.managedTeams && profile.managedTeams.length > 0) {
        const teams = await Promise.all(
          profile.managedTeams.map(id => getTeamData(id))
        );
        setManagedTeamsData(teams.filter(t => t !== null) as Team[]);
      }
    };
    loadTeams();
  }, [profile.managedTeams]);

  // Load Data based on selected team(s)
  useEffect(() => {
    const loadData = async () => {
      const teamsToWatch = selectedTeamId === 'all' 
        ? (profile.managedTeams || []) 
        : [selectedTeamId];

      if (teamsToWatch.length === 0) {
        setIsLoading(false);
        return;
      }

      // Load Settings (if single team)
      let unsubscribeSettings = () => {};
      if (selectedTeamId !== 'all') {
        const settingsRef = doc(db, 'settings', selectedTeamId);
        unsubscribeSettings = onSnapshot(settingsRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setMonthlyGoal(data.monthlyGoal || 50000);
            setEffectivenessGoal(data.effectivenessGoal || 85);
          }
        });
      } else {
        // Default macro goals or sum of goals? For now, default
        setMonthlyGoal(50000 * teamsToWatch.length); 
      }

      // Firestore Subscription for Agreements
      const q = query(
        collection(db, 'agreements'), 
        where('teamId', 'in', teamsToWatch),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribeAgreements = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agreement));
        setAgreements(data);
        setIsLoading(false);
      });

      return () => {
        unsubscribeSettings();
        unsubscribeAgreements();
      };
    };
    
    return loadData();
  }, [selectedTeamId, profile.managedTeams]);

  // Filtering Logic
  const displayAgreements = useMemo(() => {
    let filtered = agreements;
    
    // Filter by View Mode
    if (viewMode === 'personal') {
      filtered = filtered.filter(a => a.operatorId === profile.uid);
    }
    
    // Filter by Search
    if (searchTerm) {
      filtered = filtered.filter(agreement => 
        agreement.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agreement.clientCpf.includes(searchTerm) ||
        (agreement.email?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Filter by Status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(a => a.status === filterStatus);
    }
    
    return filtered;
  }, [agreements, viewMode, profile.uid, searchTerm, filterStatus]);

  // Stats calculation based on display data
  const stats: DashboardStats = useMemo(() => {
    const totalProjected = displayAgreements.reduce((acc, curr) => acc + curr.value, 0);
    const totalPaid = displayAgreements
      .filter(a => a.status === AgreementStatus.PAID)
      .reduce((acc, curr) => acc + curr.value, 0);
    
    return {
      totalProjected,
      totalPaid,
      effectivenessRate: (totalPaid / (monthlyGoal || 1)) * 100,
      counts: {
        total: displayAgreements.length,
        paid: displayAgreements.filter(a => a.status === AgreementStatus.PAID).length,
        waiting: displayAgreements.filter(a => a.status === AgreementStatus.WAITING).length,
        broken: displayAgreements.filter(a => a.status === AgreementStatus.BROKEN).length,
      }
    };
  }, [displayAgreements, monthlyGoal]);

  // Chart Data
  const chartData = useMemo(() => [
    { name: 'Meta', value: monthlyGoal, color: '#1e293b' },
    { name: 'Pago', value: stats.totalPaid, color: '#10b981' },
    { name: 'Pendente', value: Math.max(0, stats.totalProjected - stats.totalPaid), color: '#f59e0b' }
  ], [monthlyGoal, stats]);

  const filteredAgreements = displayAgreements;

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
    if (!profile.teamId) return;
    try {
      await setDoc(doc(db, 'settings', profile.teamId), { 
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
    if (!profile.teamId) return;
    const id = editingAgreement?.id || Math.random().toString(36).substr(2, 9);
    const agreementData = {
      ...data,
      status: (editingAgreement?.status || AgreementStatus.WAITING) as AgreementStatus,
      createdAt: editingAgreement?.createdAt || new Date().toISOString(),
      operatorId: editingAgreement?.operatorId || profile.uid,
      teamId: profile.teamId
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
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-sky-500 text-white p-2 rounded-lg shadow-lg shadow-sky-500/20 cursor-pointer" onClick={onSettingsClick}>
              <PieIcon size={24} />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold tracking-tight text-white leading-none">RNV Gestão</h1>
              {profile.managedTeams && profile.managedTeams.length > 1 ? (
                <select 
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="bg-transparent text-[10px] text-sky-400 uppercase tracking-widest font-bold mt-1 outline-none border-none cursor-pointer hover:text-sky-300 transition-colors"
                >
                  <option value="all" className="bg-slate-900 text-white">Visão Macro (Todas)</option>
                  {managedTeamsData.map(t => (
                    <option key={t.id} value={t.id} className="bg-slate-900 text-white">{t.name}</option>
                  ))}
                </select>
              ) : (
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">
                  {managedTeamsData.find(t => t.id === selectedTeamId)?.name || 'Dashboard Operacional'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-end">
            {profile.role === 'supervisor' && selectedTeamId !== 'all' && (
              <div className="bg-slate-800/50 p-1 rounded-xl flex gap-1 mr-2">
                <button 
                  onClick={() => setViewMode('personal')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'personal' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Pessoal
                </button>
                <button 
                  onClick={() => setViewMode('team')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'team' ? 'bg-sky-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Equipe
                </button>
              </div>
            )}
            
            <div 
              className="flex items-center gap-3 px-3 py-1.5 bg-slate-800/30 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all group"
              onClick={onSettingsClick}
            >
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">{profile.displayName}</span>
                <span className="text-[9px] text-slate-500 font-medium uppercase tracking-tighter">{profile.jobTitle || 'Operador'}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-500 border border-sky-500/20">
                <UserIcon size={16} />
              </div>
            </div>

            {selectedTeamId !== 'all' && (
              <button 
                onClick={() => {
                  const currentTeam = managedTeamsData.find(t => t.id === selectedTeamId);
                  if (currentTeam) {
                    navigator.clipboard.writeText(currentTeam.inviteToken);
                    alert(`Código de convite para ${currentTeam.name} copiado!`);
                  }
                }}
                className="p-2.5 text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-400 rounded-xl transition-all border border-transparent"
                title="Copiar Convite"
              >
                <UserPlus size={20} />
              </button>
            )}

            <button 
              onClick={() => signOut(auth)}
              className="p-2.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 rounded-xl transition-all"
              title="Sair"
            >
              <LogOut size={20} />
            </button>

            <button 
              onClick={() => setIsModalOpen(true)}
              disabled={selectedTeamId === 'all'}
              className="flex items-center gap-2 bg-sky-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/10 active:scale-95 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
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
                    {paginatedAgreements.map((agreement) => (
                      <motion.tr 
                        key={agreement.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
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
