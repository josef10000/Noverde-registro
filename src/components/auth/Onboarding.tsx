import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, UserPlus, ArrowRight, Loader2 } from 'lucide-react';
import { createTeam, joinTeam } from '../../lib/teams';
import { User } from 'firebase/auth';

interface OnboardingProps {
  user: User;
  onComplete: () => void;
}

export const Onboarding = ({ user, onComplete }: OnboardingProps) => {
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice');
  const [teamName, setTeamName] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await createTeam(user.uid, user.email!, teamName);
      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteToken.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      await joinTeam(user.uid, user.email!, inviteToken);
      onComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white tracking-tight">Bem-vindo ao RNV Gestão</h2>
          <p className="mt-2 text-slate-400">Para começar, você precisa fazer parte de uma equipe.</p>
        </div>

        <motion.div 
          layout
          className="glass-card p-8 rounded-3xl shadow-2xl border border-slate-800"
        >
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
              {error}
            </div>
          )}

          {mode === 'choice' && (
            <div className="space-y-4">
              <button 
                onClick={() => setMode('create')}
                className="w-full flex items-center justify-between p-6 bg-slate-900/50 hover:bg-sky-500/10 border border-slate-800 hover:border-sky-500/30 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-sky-500/20 text-sky-400 rounded-xl">
                    <Users size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-white">Criar Nova Equipe</p>
                    <p className="text-xs text-slate-500">Eu sou supervisor e quero gerenciar um time</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-slate-600 group-hover:text-sky-400 transition-colors" />
              </button>

              <button 
                onClick={() => setMode('join')}
                className="w-full flex items-center justify-between p-6 bg-slate-900/50 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/30 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
                    <UserPlus size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-white">Entrar em uma Equipe</p>
                    <p className="text-xs text-slate-500">Recebi um código de convite do meu supervisor</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </button>
            </div>
          )}

          {mode === 'create' && (
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Nome da Equipe</label>
                <input 
                  autoFocus
                  type="text" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-sky-500/50 outline-none transition-all"
                  placeholder="Ex: Time Comercial Sul"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setMode('choice')}
                  className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition-all"
                >
                  Voltar
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="flex-[2] bg-sky-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-sky-400 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Criar Equipe'}
                </button>
              </div>
            </form>
          )}

          {mode === 'join' && (
            <form onSubmit={handleJoin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Código de Convite</label>
                <input 
                  autoFocus
                  type="text" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono focus:border-emerald-500/50 outline-none transition-all"
                  placeholder="Cole o código aqui..."
                  value={inviteToken}
                  onChange={(e) => setInviteToken(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setMode('choice')}
                  className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition-all"
                >
                  Voltar
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="flex-[2] bg-emerald-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Entrar na Equipe'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};
