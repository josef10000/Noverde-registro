import React, { useState } from 'react';
import { motion } from 'motion';
import { Mail, Lock, LogIn, Loader2, Chrome, PieChart } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '../../lib/firebase';

interface LoginPageProps {
  onAuthSuccess: () => void;
}

export const LoginPage = ({ onAuthSuccess }: LoginPageProps) => {
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
      onAuthSuccess();
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
      onAuthSuccess();
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
