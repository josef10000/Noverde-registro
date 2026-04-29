import React, { useState } from 'react';
import { User as UserIcon, Briefcase, Save, Plus, ArrowLeft } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserProfile } from '../../types';

import { ToastType } from '../ui/Toast';

interface ProfileSettingsProps {
  profile: UserProfile;
  onUpdate: () => void;
  onBack: () => void;
  onCreateTeam: () => void;
  showToast: (message: string, type?: ToastType) => void;
}

export function ProfileSettings({ profile, onUpdate, onBack, onCreateTeam, showToast }: ProfileSettingsProps) {
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [jobTitle, setJobTitle] = useState(profile.jobTitle || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        displayName,
        jobTitle
      });
      showToast('Perfil atualizado com sucesso!', 'success');
      onUpdate();
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      showToast('Erro ao salvar as alterações.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button 
        onClick={onBack}
        className="flex items-center text-slate-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" />
        Voltar para o Dashboard
      </button>

      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Meu Perfil</h2>
          <div className="px-3 py-1 bg-sky-500/10 text-sky-400 rounded-full text-xs font-semibold uppercase tracking-wider">
            {profile.role === 'supervisor' ? 'Supervisor' : 'Membro'}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Nome Completo
            </label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#020617] border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                placeholder="Seu nome"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Cargo / Função
            </label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full bg-[#020617] border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                placeholder="Ex: Gerente de Receptivo"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full flex items-center justify-center bg-sky-500 hover:bg-sky-600 disabled:bg-sky-500/50 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-sky-500/20"
          >
            <Save size={20} className="mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>

        {profile.role === 'supervisor' && (
          <div className="mt-12 pt-8 border-t border-slate-800">
            <h3 className="text-lg font-semibold text-white mb-4">Gestão de Equipes</h3>
            <p className="text-slate-400 text-sm mb-6">
              Como supervisor, você pode criar múltiplas equipes para gerenciar diferentes áreas ou turnos.
            </p>
            <button
              onClick={onCreateTeam}
              className="flex items-center justify-center w-full py-4 border-2 border-dashed border-slate-800 hover:border-sky-500/50 hover:bg-sky-500/5 text-slate-400 hover:text-sky-400 rounded-xl transition-all"
            >
              <Plus size={20} className="mr-2" />
              Criar Nova Equipe
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
