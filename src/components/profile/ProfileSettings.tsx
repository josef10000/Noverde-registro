import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Briefcase, 
  Save, 
  Plus, 
  ArrowLeft, 
  Trash2, 
  Users, 
  Palette, 
  Check, 
  X,
  ShieldCheck
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserProfile, Team } from '../../types';
import { getTeamData, deleteTeam, getTeamMembers, removeTeamMember } from '../../lib/teams';
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
  const [theme, setTheme] = useState(profile.theme || 'sky');
  const [isSaving, setIsSaving] = useState(false);
  
  const [managedTeamsData, setManagedTeamsData] = useState<Team[]>([]);
  const [selectedTeamForMembers, setSelectedTeamForMembers] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    const loadTeams = async () => {
      if (profile.managedTeams && profile.managedTeams.length > 0) {
        const teams = await Promise.all(
          profile.managedTeams.map(id => getTeamData(id))
        );
        setManagedTeamsData(teams.filter((t): t is Team => t !== null));
      }
    };
    loadTeams();
  }, [profile.managedTeams]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        displayName,
        jobTitle,
        theme
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

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (confirm(`Tem certeza que deseja excluir a equipe "${teamName}"? Esta ação não pode ser desfeita.`)) {
      try {
        await deleteTeam(profile.uid, teamId);
        setManagedTeamsData(prev => prev.filter(t => t.id !== teamId));
        showToast('Equipe excluída com sucesso!', 'success');
        onUpdate();
      } catch (error) {
        showToast('Erro ao excluir equipe.', 'error');
      }
    }
  };

  const handleManageMembers = async (team: Team) => {
    setSelectedTeamForMembers(team);
    setLoadingMembers(true);
    try {
      const members = await getTeamMembers(team.id);
      setTeamMembers(members);
    } catch (error) {
      showToast('Erro ao carregar membros.', 'error');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleRemoveMember = async (memberUid: string, memberName: string) => {
    if (confirm(`Remover ${memberName} desta equipe?`)) {
      try {
        await removeTeamMember(memberUid);
        setTeamMembers(prev => prev.filter(m => m.uid !== memberUid));
        showToast('Membro removido com sucesso!', 'success');
      } catch (error) {
        showToast('Erro ao remover membro.', 'error');
      }
    }
  };

  if (selectedTeamForMembers) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <button 
          onClick={() => setSelectedTeamForMembers(null)}
          className="flex items-center text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Voltar para Perfil
        </button>

        <div className="glass-card rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Equipe: {selectedTeamForMembers.name}</h2>
              <p className="text-slate-500 text-sm">Gerencie os membros deste time</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-2xl text-primary/80">
              <Users size={24} />
            </div>
          </div>

          <div className="space-y-4">
            {loadingMembers ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Nenhum membro nesta equipe ainda.
              </div>
            ) : (
              teamMembers.map(member => (
                <div key={member.uid} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-primary/80 font-bold">
                      {member.displayName[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">{member.displayName}</h4>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </div>
                  </div>
                  {member.uid !== profile.uid && (
                    <button 
                      onClick={() => handleRemoveMember(member.uid, member.displayName)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                      title="Remover da equipe"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  {member.uid === profile.uid && (
                    <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-1 rounded-md flex items-center gap-1">
                      <ShieldCheck size={12} />
                      Supervisor
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 pb-20">
      <button 
        onClick={onBack}
        className="flex items-center text-slate-400 hover:text-white mb-8 transition-colors group"
      >
        <div className="p-2 rounded-lg group-hover:bg-slate-800 transition-all mr-2">
          <ArrowLeft size={20} />
        </div>
        Voltar para o Dashboard
      </button>

      <div className="space-y-6">
        {/* Card Principal de Perfil */}
        <div className="glass-card rounded-3xl p-8 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
          
          <div className="flex items-center justify-between mb-8 relative">
            <h2 className="text-2xl font-bold text-white">Meu Perfil</h2>
            <div className="px-3 py-1 bg-primary/10 text-primary/80 rounded-full text-xs font-bold uppercase tracking-wider border border-primary/20">
              {profile.role === 'supervisor' ? 'Supervisor' : 'Membro'}
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nome Completo</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary/80 transition-colors" size={20} />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-700"
                    placeholder="Seu nome"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Cargo / Função</label>
                <div className="relative group">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary/80 transition-colors" size={20} />
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-700"
                    placeholder="Ex: Gerente de Receptivo"
                  />
                </div>
              </div>
            </div>

            {/* Seletor de Temas */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-2">
                <Palette size={14} />
                Tema do Sistema
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'dark', name: 'Dark', color: 'bg-slate-900', border: 'border-slate-700' },
                  { id: 'sky', name: 'Sky', color: 'bg-sky-600', border: 'border-primary/80' },
                  { id: 'purple', name: 'Purple', color: 'bg-purple-600', border: 'border-purple-400' }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id as any)}
                    className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      theme === t.id ? 'border-primary bg-primary/5' : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full ${t.color} ${t.border} border shadow-inner`} />
                    <span className="text-xs font-bold text-white">{t.name}</span>
                    {theme === t.id && (
                      <div className="absolute top-2 right-2 text-primary">
                        <Check size={14} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center bg-primary hover:bg-primary/80 disabled:bg-primary/50 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-primary/20 active:scale-[0.98]"
            >
              <Save size={20} className="mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>

        {/* Gestão de Equipes */}
        {profile.role === 'supervisor' && (
          <div className="glass-card rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-white">Minhas Equipes</h3>
              <button 
                onClick={onCreateTeam}
                className="p-2 text-primary/80 hover:bg-primary/10 rounded-xl transition-all"
                title="Nova Equipe"
              >
                <Plus size={24} />
              </button>
            </div>

            <div className="space-y-3">
              {managedTeamsData.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
                  Você ainda não gerencia nenhuma equipe.
                </div>
              ) : (
                managedTeamsData.map(team => (
                  <div key={team.id} className="group flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-slate-600 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 text-primary/80 rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
                        <Users size={20} />
                      </div>
                      <div>
                        <h4 className="text-white font-bold">{team.name}</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ID: {team.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleManageMembers(team)}
                        className="px-3 py-1.5 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold rounded-lg transition-all"
                      >
                        Membros
                      </button>
                      <button 
                        onClick={() => handleDeleteTeam(team.id, team.name)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
