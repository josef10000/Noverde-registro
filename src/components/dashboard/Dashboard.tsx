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
  UserPlus,
  Users,
  X,
  AlertCircle,
  Trophy,
  TrendingUp,
  Link as LinkIcon
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
import { 
  Agreement, 
  AgreementStatus, 
  AgreementOrigin, 
  DashboardStats, 
  UserProfile, 
  Team 
} from '../../types';
import { getTeamData, getTeamMembers, removeTeamMember } from '../../lib/teams';
import { formatCurrency } from '../../utils/masks';
import { StatCard } from './StatCard';
import { FilterButton } from './FilterButton';
import { ConfirmModal } from '../modals/ConfirmModal';
import { TeamPerformance } from './TeamPerformance';
import { OriginBadge } from './OriginBadge';
import { AgreementModal } from '../modals/AgreementModal';
import { startTour } from '../../utils/tour';
import { GoalModal } from '../modals/GoalModal';
import { HistoryModal } from '../modals/HistoryModal';

import { ToastType } from '../ui/Toast';

interface DashboardProps {
  user: User;
  profile: UserProfile;
  onSettingsClick: () => void;
  showToast: (message: string, type?: ToastType) => void;
}

export const Dashboard = ({ user, profile, onSettingsClick, showToast }: DashboardProps) => {
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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ uid: string; name: string } | null>(null);

  const [selectedTeamId, setSelectedTeamId] = useState<string | 'all'>(profile.teamId || 'all');
  const [managedTeamsData, setManagedTeamsData] = useState<Team[]>([]);
  
  const [selectedMemberId, setSelectedMemberId] = useState<string | 'all'>('all');
  const [currentTeamMembers, setCurrentTeamMembers] = useState<UserProfile[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [selectedClientCpf, setSelectedClientCpf] = useState<string | null>(null);
  const [clientHistory, setClientHistory] = useState<Agreement[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load Members when team changes
  useEffect(() => {
    if (selectedTeamId !== 'all') {
      getTeamMembers(selectedTeamId).then(setCurrentTeamMembers);
      setSelectedMemberId('all');
    } else {
      setCurrentTeamMembers([]);
      setSelectedMemberId('all');
    }
  }, [selectedTeamId]);

  // Load Managed Teams Info
  useEffect(() => {
    if (!profile.managedTeams || profile.managedTeams.length === 0) return;

    const loadTeamsData = async () => {
      const teams = await Promise.all(
        profile.managedTeams.map(id => getTeamData(id))
      );
      const validTeams = teams.filter((t): t is Team => t !== null);
      setManagedTeamsData(validTeams);

      // Atualiza metas baseado na seleção
      if (selectedTeamId === 'all') {
        const totalMonthly = validTeams.reduce((acc, t) => acc + (t.monthlyGoal || 0), 0);
        const avgEff = validTeams.length > 0 
          ? validTeams.reduce((acc, t) => acc + (t.effectivenessGoal || 85), 0) / validTeams.length
          : 85;
        setMonthlyGoal(totalMonthly || 50000);
        setEffectivenessGoal(Math.round(avgEff));
      } else {
        const currentTeam = validTeams.find(t => t.id === selectedTeamId);
        if (currentTeam) {
          setMonthlyGoal(currentTeam.monthlyGoal || 50000);
          setEffectivenessGoal(currentTeam.effectivenessGoal || 85);
        }
      }
    };

    loadTeamsData();
  }, [profile.managedTeams, selectedTeamId]);

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
    
    loadData();
  }, [selectedTeamId, profile.managedTeams]);

  // Handle Tour
  useEffect(() => {
    if (profile && !profile.hasSeenTour) {
      // Pequeno delay para garantir que o layout renderizou
      const timer = setTimeout(() => {
        startTour(profile.role, async () => {
          try {
            await updateDoc(doc(db, 'users', profile.uid), { hasSeenTour: true });
          } catch (e) {
            console.error("Erro ao salvar estado do tour:", e);
          }
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [profile?.hasSeenTour]);

  // Filtering Logic
  const memberFilteredAgreements = useMemo(() => {
    let filtered = agreements;
    
    // Filter by View Mode
    if (viewMode === 'personal') {
      filtered = filtered.filter(a => a.operatorId === profile.uid);
    } else if (selectedMemberId !== 'all') {
      filtered = filtered.filter(a => a.operatorId === selectedMemberId);
    }
    
    return filtered;
  }, [agreements, viewMode, profile.uid, selectedMemberId]);

  const displayAgreements = useMemo(() => {
    let filtered = memberFilteredAgreements;
    
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
  }, [memberFilteredAgreements, searchTerm, filterStatus]);

  // Stats calculation based on member data (ignores search and status filter)
  const stats: DashboardStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalProjected = memberFilteredAgreements.reduce((acc, curr) => acc + curr.value, 0);
    
    const paidAgreements = memberFilteredAgreements.filter(a => a.status === AgreementStatus.PAID);
    const totalPaid = paidAgreements.reduce((acc, curr) => acc + curr.value, 0);
    
    const overdueAgreements = memberFilteredAgreements.filter(a => 
      a.status === AgreementStatus.WAITING && 
      new Date(a.dueDate) < today
    );
    const totalOverdue = overdueAgreements.reduce((acc, curr) => acc + curr.value, 0);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const agreementsToday = memberFilteredAgreements.filter(a => new Date(a.createdAt) >= today);
    const agreementsMonth = memberFilteredAgreements.filter(a => new Date(a.createdAt) >= startOfMonth);

    return {
      totalProjected,
      totalPaid,
      totalOverdue,
      effectivenessRate: (totalPaid / (monthlyGoal || 1)) * 100,
      counts: {
        total: memberFilteredAgreements.length,
        paid: paidAgreements.length,
        waiting: memberFilteredAgreements.filter(a => a.status === AgreementStatus.WAITING).length,
        broken: memberFilteredAgreements.filter(a => a.status === AgreementStatus.BROKEN).length,
        overdue: overdueAgreements.length,
        today: agreementsToday.length,
        month: agreementsMonth.length,
      },
      hourlyDistribution: memberFilteredAgreements.reduce((acc, a) => {
        const hour = new Date(a.createdAt).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>)
    };
  }, [memberFilteredAgreements, monthlyGoal]);

  // Chart Data
  const chartData = useMemo(() => [
    { name: 'Meta', value: monthlyGoal, color: 'url(#colorMeta)' },
    { name: 'Pago', value: stats.totalPaid, color: 'url(#colorPaid)' },
    { name: 'Vencido', value: stats.totalOverdue, color: 'url(#colorOverdue)' },
    { name: 'Pendente', value: Math.max(0, stats.totalProjected - stats.totalPaid - stats.totalOverdue), color: 'url(#colorPending)' }
  ], [monthlyGoal, stats]);

  const filteredAgreements = displayAgreements;

  const paginatedAgreements = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAgreements.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAgreements, currentPage]);

  const totalPages = Math.ceil(filteredAgreements.length / itemsPerPage);

  const handleEfetivar = async (id: string) => {
    try {
      const agreementRef = doc(db, 'agreements', id);
      await updateDoc(agreementRef, { 
        status: AgreementStatus.PAID,
        paidAt: new Date().toISOString()
      });
      showToast('Acordo efetivado com sucesso!', 'success');
    } catch (error) {
      showToast('Erro ao efetivar acordo.', 'error');
    }
  };

  const handleRemoveOperator = (memberUid: string, memberName: string) => {
    setMemberToRemove({ uid: memberUid, name: memberName });
    setIsConfirmOpen(true);
  };

  const confirmRemoveOperator = async () => {
    if (!memberToRemove) return;
    try {
      await removeTeamMember(memberToRemove.uid);
      setCurrentTeamMembers(prev => prev.filter(m => m.uid !== memberToRemove.uid));
      if (selectedMemberId === memberToRemove.uid) setSelectedMemberId('all');
      showToast('Membro removido com sucesso!', 'success');
    } catch (error) {
      showToast('Erro ao remover membro.', 'error');
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
    
    try {
      if (editingAgreement) {
        const agreementRef = doc(db, 'agreements', editingAgreement.id);
        await updateDoc(agreementRef, {
          ...data,
          status: data.status || editingAgreement.status
        });
        showToast('Acordo atualizado com sucesso!', 'success');
      } else {
        const id = Math.random().toString(36).substr(2, 9);
        const now = new Date().toISOString();
        const agreementData = {
          id,
          ...data,
          status: data.status || AgreementStatus.WAITING,
          operatorId: profile.uid,
          teamId: profile.teamId,
          createdAt: now,
          paidAt: data.status === AgreementStatus.PAID ? now : null
        };
        await setDoc(doc(db, 'agreements', id), agreementData);
        showToast('Acordo registrado com sucesso!', 'success');
      }
      setIsModalOpen(false);
      setEditingAgreement(null);
    } catch (error) {
      console.error(error);
      showToast('Erro ao salvar acordo.', 'error');
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
            <div className="bg-primary text-white p-2 rounded-lg shadow-lg shadow-primary/20 cursor-pointer" onClick={onSettingsClick}>
              <PieIcon size={24} />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold tracking-tight text-white leading-none">RNV Gestão</h1>
              {profile.managedTeams && profile.managedTeams.length > 1 ? (
                <select 
                  id="team-selector"
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
            
            <div 
              id="user-profile-menu"
              className="flex items-center gap-3 px-3 py-1.5 bg-slate-800/30 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all group"
              onClick={onSettingsClick}
            >
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">{profile.displayName}</span>
                <span className="text-[9px] text-slate-500 font-medium uppercase tracking-tighter">{profile.jobTitle || 'Operador'}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <UserIcon size={16} />
              </div>
            </div>

            {selectedTeamId !== 'all' && (
              <button 
                onClick={() => {
                  const currentTeam = managedTeamsData.find(t => t.id === selectedTeamId);
                    if (currentTeam) {
                      navigator.clipboard.writeText(currentTeam.inviteToken);
                      showToast(`Código de convite para ${currentTeam.name} copiado!`, 'success');
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
              id="new-agreement-btn"
              onClick={() => setIsModalOpen(true)}
              disabled={selectedTeamId === 'all'}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-sky-400 transition-all shadow-lg shadow-primary/10 active:scale-95 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Novo Acordo</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header com Toggle de Visão (Apenas para Supervisores) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">
              {viewMode === 'personal' ? 'Meu Desempenho' : 'Gestão de Equipe'}
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              {viewMode === 'personal' 
                ? 'Acompanhe suas metas e acordos em tempo real' 
                : 'Visão macro e detalhada da performance do time'}
            </p>
          </div>

          {profile.role === 'supervisor' && (
            <div className="flex bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-2xl">
              <button
                onClick={() => setViewMode('personal')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewMode === 'personal' 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <UserIcon size={14} />
                Pessoal
              </button>
              <button
                onClick={() => setViewMode('team')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewMode === 'team' 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Users size={14} />
                Equipe
              </button>
            </div>
          )}
        </div>
        <section id="stats-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Projetado" 
            value={formatCurrency(stats.totalProjected)} 
            icon={DollarSign} 
            color="primary" 
          />
          <StatCard 
            title="Efetivamente Pago" 
            value={formatCurrency(stats.totalPaid)} 
            icon={TrendingUp} 
            color="emerald" 
          />
          <StatCard 
            id="overdue-card"
            title="Valores Vencidos" 
            value={formatCurrency(stats.totalOverdue)} 
            icon={AlertCircle} 
            color="rose"
            subtitle={`${stats.counts.overdue} acordos pendentes`}
          />
          <StatCard 
            title="Volume de Acordos" 
            value={stats.counts.today} 
            icon={CheckCircle2} 
            color="primary"
            subtitle={`Hoje: ${stats.counts.paid} Pagos | ${stats.counts.waiting} Pendentes`}
          />
          <StatCard 
            title="Produtividade" 
            value={(stats.counts.today / (currentTeamMembers.length || 1)).toFixed(1)} 
            icon={Users} 
            color="amber"
            subtitle={`Média: ${stats.counts.month} registros no mês`}
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid grid-cols-1 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 rounded-2xl shadow-xl relative group md:col-span-2"
            >
              <button 
                onClick={() => setIsGoalModalOpen(true)}
                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-primary opacity-0 group-hover:opacity-100 transition-all bg-slate-900/50 rounded-lg border border-slate-800"
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

          <div id="performance-chart" className="glass-card p-6 rounded-2xl shadow-xl flex flex-col relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all" />
            
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" />
              Performance vs Meta
            </h4>
            
            <div className="flex-1 min-h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMeta" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#334155" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1e293b" stopOpacity={0.4}/>
                    </linearGradient>
                    <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.4}/>
                    </linearGradient>
                    <linearGradient id="colorOverdue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0.4}/>
                    </linearGradient>
                    <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0.4}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis hide domain={[0, 'auto']} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      border: '1px solid #1e293b', 
                      borderRadius: '16px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)',
                      padding: '12px'
                    }}
                    itemStyle={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '12px' }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={40} animationDuration={1500}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              {chartData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color.includes('#') ? item.color : '#334155' }} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Nova Seção: Heatmap e Resumo Adicional */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 glass-card p-6 rounded-2xl shadow-xl relative overflow-hidden group">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-sky-500/5 rounded-full blur-3xl" />
            
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
              <TrendingUp size={16} className="text-sky-400" />
              Densidade de Acordos por Horário
            </h4>
            
            <div className="grid grid-cols-12 md:grid-cols-24 gap-1.5 h-32 items-end">
              {Array.from({ length: 24 }).map((_, hour) => {
                const count = stats.hourlyDistribution[hour] || 0;
                const counts = Object.values(stats.hourlyDistribution);
                const max = counts.length > 0 ? Math.max(...counts) : 1;
                const intensity = (count / max);
                
                return (
                  <div key={hour} className="flex flex-col gap-2 items-center flex-1 h-full justify-end group/item">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: count > 0 ? `${Math.max(10, intensity * 100)}%` : '4px' }}
                      className="w-full rounded-t-sm transition-all duration-500 relative"
                      style={{ 
                        backgroundColor: count > 0 
                          ? `rgba(14, 165, 233, ${0.3 + (intensity * 0.7)})` 
                          : 'rgba(30, 41, 59, 0.3)',
                        boxShadow: count > 0 ? `0 0 15px rgba(14, 165, 233, ${intensity * 0.4})` : 'none'
                      }}
                    >
                      {count > 0 && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-[9px] font-bold text-white px-1.5 py-0.5 rounded border border-slate-700 opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          {count} acordos
                        </div>
                      )}
                    </motion.div>
                    <span className="text-[7px] text-slate-500 font-bold uppercase">{hour}h</span>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 flex justify-between items-center border-t border-slate-800/50 pt-4">
              <p className="text-[9px] text-slate-500 font-medium uppercase tracking-tighter">
                Análise de produtividade temporal baseada em {stats.counts.total} registros
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-slate-500 uppercase font-bold">Intensidade:</span>
                <div className="flex gap-0.5">
                  {[0.2, 0.4, 0.6, 0.8, 1].map(v => (
                    <div key={v} className="w-2 h-2 rounded-sm" style={{ backgroundColor: `rgba(14, 165, 233, ${v})` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <StatCard 
              title="Aguardando" 
              value={stats.counts.waiting} 
              icon={Loader2} 
              color="amber"
              subtitle="Pendente Pagto"
            />
            <StatCard 
              title="Quebrados" 
              value={stats.counts.broken} 
              icon={X} 
              color="rose"
              subtitle="Faltas / Recusas"
            />
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

        {/* Performance Section (Leaderboard & Table) - Only for Team View */}
        {viewMode === 'team' && selectedTeamId !== 'all' && selectedMemberId === 'all' && (
          <div className="mb-12">
            <TeamPerformance agreements={agreements} members={currentTeamMembers} />
          </div>
        )}

        {/* Grade de Equipes - Visão Macro */}
        {viewMode === 'team' && selectedTeamId === 'all' && managedTeamsData.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users size={20} className="text-sky-400" />
                Resumo por Equipe
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {managedTeamsData.map(t => (
                <div 
                  key={t.id}
                  onClick={() => setSelectedTeamId(t.id)}
                  className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl hover:border-primary/50 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-white group-hover:text-sky-400 transition-colors">{t.name}</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Meta: {formatCurrency(t.monthlyGoal)}</p>
                    </div>
                    {profile.teamId === t.id ? (
                      <div className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-emerald-500/20 flex items-center gap-1">
                        <Check size={12} />
                        Minha Equipe
                      </div>
                    ) : (
                      <div className="bg-primary/10 text-sky-400 p-2 rounded-lg">
                        <Target size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: '0%' }} /> 
                    </div>
                    <span className="text-xs font-bold text-slate-300">0%</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                      <p className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Hoje</p>
                      <p className="text-sm font-bold text-sky-400">
                        {agreements.filter(a => a.teamId === t.id && new Date(a.createdAt).getTime() >= new Date().setHours(0,0,0,0)).length}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                      <p className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Mês</p>
                      <p className="text-sm font-bold text-white">
                        {agreements.filter(a => a.teamId === t.id && new Date(a.createdAt).getTime() >= new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()).length}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(t.inviteToken);
                        showToast(`Código de convite para ${t.name} copiado!`);
                      }}
                      className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1"
                    >
                      <UserPlus size={12} />
                      Convite
                    </button>
                    
                    {profile.role === 'supervisor' && (
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          const newTeamId = profile.teamId === t.id ? null : t.id;
                          try {
                            await updateDoc(doc(db, 'users', profile.uid), { teamId: newTeamId });
                            showToast(newTeamId ? `Você agora faz parte da equipe ${t.name}!` : 'Vínculo com a equipe removido.');
                            // Nota: O profile será atualizado pelo listener global no App.tsx
                          } catch (error) {
                            showToast('Erro ao atualizar vínculo.', 'error');
                          }
                        }}
                        className={`py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1 ${
                          profile.teamId === t.id 
                            ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white' 
                            : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                        }`}
                      >
                        {profile.teamId === t.id ? (
                          <>
                            <X size={12} />
                            Desvincular
                          </>
                        ) : (
                          <>
                            <LinkIcon size={12} />
                            Vincular-me
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Navegação por Membros da Equipe */}
        {selectedTeamId !== 'all' && viewMode === 'team' && currentTeamMembers.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Filtrar por Operador</h3>
              {selectedMemberId !== 'all' && (
                <button 
                  onClick={() => setSelectedMemberId('all')}
                  className="text-[10px] font-bold text-primary hover:text-sky-400 uppercase transition-colors"
                >
                  Limpar Filtro
                </button>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedMemberId('all')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                  selectedMemberId === 'all' 
                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                <Users size={14} />
                <span className="text-xs font-bold">Toda a Equipe</span>
              </button>
              {currentTeamMembers.map(member => (
                <div key={member.uid} className="relative group/member">
                  <button
                    onClick={() => setSelectedMemberId(member.uid)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                      selectedMemberId === member.uid 
                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      selectedMemberId === member.uid ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {member.displayName[0].toUpperCase()}
                    </div>
                    <span className="text-xs font-bold whitespace-nowrap">{member.displayName.split(' ')[0]}</span>
                  </button>
                  
                  {profile.role === 'supervisor' && member.uid !== profile.uid && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveOperator(member.uid, member.displayName);
                      }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/member:opacity-100 transition-all hover:bg-rose-600 shadow-lg z-10"
                      title="Remover da equipe"
                    >
                      <X size={10} strokeWidth={3} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-sky-400 transition-colors">
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Buscar por Nome, CPF ou E-mail..." 
            className="w-full bg-slate-950 border border-slate-800 pl-12 pr-6 py-4 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/50 transition-all text-slate-200 placeholder:text-slate-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </section>

        {viewMode === 'team' && selectedTeamId !== 'all' && (
          <section id="team-performance-module" className="mt-8">
            <TeamPerformance 
              agreements={agreements} 
              members={currentTeamMembers} 
            />
          </section>
        )}

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
                        <Loader2 className="animate-spin text-primary" size={32} />
                        <span>Carregando acordos...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedAgreements.map((agreement) => (
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
                                className="p-2 text-slate-500 hover:text-sky-400 hover:bg-primary/10 rounded-lg transition-all"
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
                    ))
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

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmRemoveOperator}
        title="Remover Membro"
        message={`Tem certeza que deseja remover ${memberToRemove?.name} desta equipe? Esta ação não pode ser desfeita.`}
        confirmText="Sim, Remover"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};
