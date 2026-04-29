import React, { useState, useMemo, useEffect } from 'react';
import { 
  PieChart,
  Loader2,
  Trash2,
  Edit3,
  Target,
  Mail,
  Lock,
  LogIn,
  LogOut,
  Chrome,
  Phone,
  MessageSquare,
  MessageCircle,
  Plus,
  Check,
  X,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Search,
  Clock,
  Users
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
  getDocFromServer,
  where
} from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut,
  User
} from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { 
  Agreement, 
  AgreementOrigin, 
  AgreementStatus, 
  DashboardStats 
} from './types';

// --- Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Utilities ---
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatCPF = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

// --- Components ---

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  colorClass 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  trend?: string;
  colorClass: string;
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card p-6 rounded-2xl flex flex-col justify-between shadow-xl"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon size={24} className="text-current" />
      </div>
      {trend && (
        <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <TrendingUp size={12} />
          {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
    </div>
  </motion.div>
);

const FilterButton = ({ 
  label, 
  count, 
  colorClass, 
  active, 
  onClick 
}: { 
  label: string; 
  count: number; 
  colorClass: string; 
  active: boolean;
  onClick: () => void;
}) => (
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

const LoginPage = ({ onAuthSuccess }: { onAuthSuccess: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      alert('E-mail de recuperação enviado!');
      setIsForgotPassword(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#020617]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md glass-card p-8 rounded-3xl space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Recuperar Senha</h2>
            <p className="text-slate-500 text-sm">Digite seu e-mail para receber o link de recuperação.</p>
          </div>
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400" size={18} />
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all text-slate-200" placeholder="seu@email.com" />
              </div>
            </div>
            <button disabled={loading} type="submit" className="w-full bg-sky-500 py-4 rounded-xl font-bold text-white hover:bg-sky-400 transition-all flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Enviar E-mail'}
            </button>
            <button type="button" onClick={() => setIsForgotPassword(false)} className="w-full text-slate-500 text-sm hover:text-white transition-colors">Voltar para entrar</button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#020617]">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md glass-card p-8 rounded-3xl space-y-8 shadow-2xl">
        <div className="text-center flex flex-col items-center gap-4">
          <div className="bg-sky-500 p-4 rounded-2xl shadow-xl shadow-sky-500/20">
            <PieChart size={32} className="text-white" />
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-white">RNV Gestão</h2>
            <p className="text-slate-500 text-sm">{isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}</p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400" size={18} />
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all text-slate-200" placeholder="seu@email.com" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Senha</label>
                {isLogin && <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[10px] font-bold text-sky-500 uppercase hover:text-sky-400">Esqueci a senha</button>}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400" size={18} />
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all text-slate-200" placeholder="••••••••" />
              </div>
            </div>
          </div>

          <button disabled={loading} type="submit" className="w-full bg-sky-500 py-4 rounded-xl font-bold text-white hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/10 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Entrar' : 'Cadastrar')}
            <LogIn size={20} />
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center px-2">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#020617] px-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">Ou continuar com</span>
          </div>
        </div>

        <button onClick={handleGoogleSignIn} className="w-full bg-slate-900 border border-slate-800 py-4 rounded-xl font-bold text-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
          <Chrome size={20} />
          Google
        </button>

        <p className="text-center text-sm text-slate-500">
          {isLogin ? 'Ainda não tem conta?' : 'Já possui conta?'}
          <button onClick={() => setIsLogin(!isLogin)} className="ml-2 font-bold text-sky-500 hover:text-sky-400">{isLogin ? 'Cadastre-se' : 'Faça login'}</button>
        </p>
      </motion.div>
    </div>
  );
};
const OriginBadge = ({ origin }: { origin: AgreementOrigin }) => {
  const configs = {
    [AgreementOrigin.PHONE]: { icon: Phone, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'Telefone' },
    [AgreementOrigin.CHAT]: { icon: MessageSquare, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', label: 'Chat' },
    [AgreementOrigin.WHATSAPP]: { icon: MessageCircle, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'WhatsApp' },
  };
  const config = configs[origin];
  const Icon = config.icon;

  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [agreements, setAgreements] = useState<Agreement[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="animate-spin text-sky-500" size={48} />
      </div>
    );
  }

  if (!user) {
    return <LoginPage onAuthSuccess={() => {}} />;
  }

  return <Dashboard agreementsData={agreements} user={user} />;
}

function Dashboard({ agreementsData, user }: { agreementsData: Agreement[], user: User }) {
  const [agreements, setAgreements] = useState<Agreement[]>(agreementsData);
  const [monthlyGoal, setMonthlyGoal] = useState<number>(50000); // Default goal
  const [effectivenessGoal, setEffectivenessGoal] = useState<number>(85); // Target percentage
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | AgreementStatus>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<Agreement | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // History State
  const [selectedClientCpf, setSelectedClientCpf] = useState<string | null>(null);
  const [clientHistory, setClientHistory] = useState<Agreement[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load Settings (Goal)
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
    
    // Test connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agreement));
      setAgreements(data);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'agreements');
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
      effectivenessRate: (totalPaid / (monthlyGoal || 1)) * 100, // Use goal as base if user preferred
      counts: {
        total: agreements.length,
        paid: agreements.filter(a => a.status === AgreementStatus.PAID).length,
        waiting: agreements.filter(a => a.status === AgreementStatus.WAITING).length,
        broken: agreements.filter(a => a.status === AgreementStatus.BROKEN).length,
      }
    };
  }, [agreements, monthlyGoal]);

  // Filtering
  const filteredAgreements = useMemo(() => {
    setCurrentPage(1); // Reset to first page on search/filter
    return agreements.filter(agreement => {
      const matchesSearch = 
        agreement.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agreement.clientCpf.includes(searchTerm) ||
        (agreement.email?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesFilter = filterStatus === 'all' || agreement.status === filterStatus;
      
      return matchesSearch && matchesFilter;
    });
  }, [agreements, searchTerm, filterStatus]);

  // Paginated data
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
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `agreements/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este acordo?')) return;
    try {
      await deleteDoc(doc(db, 'agreements', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `agreements/${id}`);
    }
  };

  const handleEdit = (agreement: Agreement) => {
    setEditingAgreement(agreement);
    setIsModalOpen(true);
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
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'agreements_history');
      setIsLoadingHistory(false);
    });

    return () => unsubscribe();
  };

  const handleUpdateGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newGoal = parseFloat(formData.get('goal') as string);
    const newEffGoal = parseFloat(formData.get('effGoal') as string);
    try {
      await setDoc(doc(db, 'settings', 'global'), { 
        monthlyGoal: newGoal,
        effectivenessGoal: newEffGoal,
        updatedAt: new Date().toISOString()
      });
      setIsGoalModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/global');
    }
  };

  const getEffectivenessColor = (rate: number, goal: number) => {
    if (rate >= goal) return 'text-emerald-400';
    if (rate >= goal * 0.75) return 'text-amber-400'; // "Perto"
    return 'text-rose-400'; // "Longe"
  };

  const getEffectivenessBarColor = (rate: number, goal: number) => {
    if (rate >= goal) return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
    if (rate >= goal * 0.75) return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
    return 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]';
  };

  const handleAddAgreement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = editingAgreement?.id || Math.random().toString(36).substr(2, 9);
    
    const agreementData = {
      clientName: formData.get('name') as string,
      clientCpf: formData.get('cpf') as string,
      origin: formData.get('origin') as AgreementOrigin,
      dueDate: formData.get('dueDate') as string,
      value: parseFloat(formData.get('value') as string),
      status: (editingAgreement?.status || AgreementStatus.WAITING) as AgreementStatus,
      createdAt: editingAgreement?.createdAt || new Date().toISOString(),
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
    };

    try {
      await setDoc(doc(db, 'agreements', id), agreementData);
      setIsModalOpen(false);
      setEditingAgreement(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'agreements');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] font-sans text-slate-200 pb-20">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-sky-500 text-white p-2 rounded-lg shadow-lg shadow-sky-500/20">
              <PieChart size={24} />
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
        
        {/* Indicators Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            className="glass-card p-6 rounded-2xl shadow-xl relative group"
          >
            <button 
              onClick={() => setIsGoalModalOpen(true)}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-all bg-slate-900/50 rounded-lg border border-slate-800"
            >
              <Target size={14} />
            </button>
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Taxa de Efetividade</p>
            <div className="mt-4 flex items-end justify-between">
              <h3 className={`text-3xl font-bold transition-colors duration-500 ${getEffectivenessColor(stats.effectivenessRate, effectivenessGoal)}`}>
                {stats.effectivenessRate.toFixed(1)}%
              </h3>
              <p className="text-xs font-medium text-slate-500 mb-1">Meta: {effectivenessGoal}% | Cota: {formatCurrency(monthlyGoal)}</p>
            </div>
            <div className="mt-3 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(stats.effectivenessRate, 100)}%` }}
                className={`h-full rounded-full transition-colors duration-500 ${getEffectivenessBarColor(stats.effectivenessRate, effectivenessGoal)}`}
              />
            </div>
          </motion.div>
        </section>

        {/* Volume Filters */}
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

        {/* Search */}
        <section className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-sky-400 transition-colors">
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Buscar por Nome, CPF ou E-mail..." 
            className="w-full bg-slate-900 border border-slate-800 pl-12 pr-6 py-4 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500/50 transition-all text-slate-200 placeholder:text-slate-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </section>

        {/* Operational Table */}
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
                            <span className="text-xs text-info-blue font-mono mt-0.5 text-sky-400/70">{agreement.clientCpf}</span>
                          </button>
                        </td>
                        <td className="px-6 py-5">
                          <OriginBadge origin={agreement.origin} />
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                             <span className={`text-sm font-medium ${
                               agreement.status === AgreementStatus.BROKEN ? 'text-rose-400' : 'text-slate-300'
                             }`}>
                              {new Date(agreement.dueDate).toLocaleDateString('pt-BR')}
                            </span>
                            {agreement.status === AgreementStatus.BROKEN && (
                              <span className="text-[10px] font-bold text-rose-500 uppercase mt-0.5">Vencido</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm font-bold text-white tabular-nums">
                            {formatCurrency(agreement.value)}
                          </span>
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
                                onClick={() => handleEdit(agreement)}
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
                {!isLoading && filteredAgreements.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                      Nenhum acordo encontrado para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
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
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        currentPage === page 
                          ? 'bg-sky-500 text-white' 
                          : 'text-slate-500 hover:bg-slate-800'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
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

      {/* Modal for New Agreement */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-800 overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingAgreement ? 'Editar Acordo' : 'Registrar Novo Acordo'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">Preencha os dados do cliente e a negociação.</p>
                </div>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingAgreement(null);
                  }}
                  className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddAgreement} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* CPF Column */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">CPF *</label>
                    <input 
                      required
                      name="cpf"
                      type="text" 
                      placeholder="000.000.000-00" 
                      defaultValue={editingAgreement?.clientCpf}
                      onChange={(e) => e.target.value = formatCPF(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-mono text-slate-200"
                    />
                  </div>
                  {/* Name Column */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nome Completo</label>
                    <input 
                      name="name"
                      type="text" 
                      defaultValue={editingAgreement?.clientName}
                      placeholder="Ex: João Silva" 
                      className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-slate-200"
                    />
                  </div>
                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Telefone/WhatsApp</label>
                    <input 
                      name="phone"
                      type="tel" 
                      defaultValue={editingAgreement?.phone}
                      placeholder="(00) 00000-0000" 
                      className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-slate-200"
                    />
                  </div>
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">E-mail</label>
                    <input 
                      name="email"
                      type="email" 
                      defaultValue={editingAgreement?.email}
                      placeholder="exemplo@email.com" 
                      className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-slate-200"
                    />
                  </div>
                  {/* Value */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Valor do Acordo *</label>
                    <div className="relative">
                      <span className="absolute left-4 inset-y-0 flex items-center text-slate-500 font-bold">R$</span>
                      <input 
                        required
                        name="value"
                        type="number" 
                        step="0.01"
                        defaultValue={editingAgreement?.value}
                        placeholder="0,00" 
                        className="w-full bg-slate-950 border border-slate-800 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-slate-200"
                      />
                    </div>
                  </div>
                  {/* Due Date */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Data de Vencimento *</label>
                    <input 
                      required
                      name="dueDate"
                      type="date" 
                      defaultValue={editingAgreement?.dueDate}
                      className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-slate-200 color-scheme-dark"
                    />
                  </div>
                </div>

                {/* Origin Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Origem do Atendimento *</label>
                  <select 
                    required
                    name="origin"
                    defaultValue={editingAgreement?.origin || ""}
                    className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all appearance-none outline-none text-slate-200"
                  >
                    <option value="" disabled>Selecione uma origem...</option>
                    <option value={AgreementOrigin.PHONE}>Telefone</option>
                    <option value={AgreementOrigin.CHAT}>Chat</option>
                    <option value={AgreementOrigin.WHATSAPP}>WhatsApp</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingAgreement(null);
                    }}
                    className="flex-1 px-6 py-4 rounded-xl border border-slate-800 font-bold text-slate-400 hover:bg-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-4 rounded-xl bg-sky-500 text-white font-bold hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/20 active:scale-95"
                  >
                    {editingAgreement ? 'Atualizar Acordo' : 'Salvar Acordo'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Monthly Goal Modal */}
      <AnimatePresence>
        {isGoalModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGoalModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-800 overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <h2 className="text-lg font-bold text-white">Meta Mensal</h2>
                <button 
                  onClick={() => setIsGoalModalOpen(false)}
                  className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleUpdateGoal} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Cota Mensal (R$)</label>
                    <input 
                      required
                      name="goal"
                      type="number" 
                      defaultValue={monthlyGoal}
                      className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Meta de Efetividade (%)</label>
                    <input 
                      required
                      name="effGoal"
                      type="number" 
                      defaultValue={effectivenessGoal}
                      className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-slate-200"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full px-6 py-4 rounded-xl bg-sky-500 text-white font-bold hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/20"
                >
                  Atualizar Metas
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Client History Modal */}
      <AnimatePresence>
        {selectedClientCpf && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClientCpf(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, x: 20 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.95, opacity: 0, x: 20 }}
              className="relative bg-slate-900 w-full max-w-2xl max-h-[80vh] rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col"
            >
              <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <div>
                  <h2 className="text-lg font-bold text-white">Histórico do Cliente</h2>
                  <p className="text-xs text-slate-500 font-medium font-mono">CPF: {selectedClientCpf}</p>
                </div>
                <button 
                  onClick={() => setSelectedClientCpf(null)}
                  className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                {isLoadingHistory ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <Loader2 className="animate-spin text-sky-500" size={24} />
                    <span className="text-xs font-medium text-slate-500">Buscando histórico...</span>
                  </div>
                ) : clientHistory.length > 0 ? (
                  <div className="space-y-4">
                    {clientHistory.map((item) => (
                      <div 
                        key={item.id}
                        className={`p-5 rounded-2xl border ${
                          item.status === AgreementStatus.PAID 
                            ? 'bg-emerald-500/5 border-emerald-500/10' 
                            : item.status === AgreementStatus.BROKEN 
                              ? 'bg-rose-500/5 border-rose-500/10' 
                              : 'bg-slate-800/20 border-slate-800'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                              {new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </span>
                            <span className="text-lg font-bold text-white">{formatCurrency(item.value)}</span>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            {item.status === AgreementStatus.PAID ? (
                              <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white px-2 py-0.5 rounded">PAGO</span>
                            ) : item.status === AgreementStatus.BROKEN ? (
                              <span className="text-[10px] font-black uppercase tracking-widest bg-rose-500 text-white px-2 py-0.5 rounded">QUEBRADO</span>
                            ) : (
                              <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white px-2 py-0.5 rounded">AGUARDANDO</span>
                            )}
                            <OriginBadge origin={item.origin} />
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            Vencimento: {new Date(item.dueDate).toLocaleDateString('pt-BR')}
                          </div>
                          {item.paidAt && (
                            <div className="flex items-center gap-1 text-emerald-400">
                              <CheckCircle2 size={12} />
                              Pago em: {new Date(item.paidAt).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500 italic">
                    Nenhum registro encontrado para este CPF.
                  </div>
                )}
              </div>
              <div className="px-8 py-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
                 <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Total de negociações: {clientHistory.length}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
