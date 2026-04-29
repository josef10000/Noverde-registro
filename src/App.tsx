import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { LoginPage } from './components/auth/LoginPage';
import { Dashboard } from './components/dashboard/Dashboard';
import { Onboarding } from './components/auth/Onboarding';
import { ProfileSettings } from './components/profile/ProfileSettings';
import { getUserProfile } from './lib/teams';
import { UserProfile } from './types';

import { Toast, ToastType } from './components/ui/Toast';
import { AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'profile' | 'create-team'>('dashboard');
  
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userProfile = await getUserProfile(u.uid);
          setProfile(userProfile);
        } catch (error) {
          console.error("Erro ao buscar perfil:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);
      setView('dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="animate-spin text-sky-500" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AnimatePresence>
          {toast && (
            <Toast 
              message={toast.message} 
              type={toast.type} 
              onClose={() => setToast(null)} 
            />
          )}
        </AnimatePresence>
        <LoginPage onAuthSuccess={() => {}} showToast={showToast} />
      </>
    );
  }

  if (!profile || !profile.teamId) {
    return (
      <>
        <AnimatePresence>
          {toast && (
            <Toast 
              message={toast.message} 
              type={toast.type} 
              onClose={() => setToast(null)} 
            />
          )}
        </AnimatePresence>
        <Onboarding user={user} onComplete={refreshProfile} showToast={showToast} />
      </>
    );
  }

  return (
    <>
      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>

      {view === 'profile' ? (
        <ProfileSettings 
          profile={profile} 
          onUpdate={refreshProfile}
          onBack={() => setView('dashboard')}
          onCreateTeam={() => setView('create-team')}
          showToast={showToast}
        />
      ) : view === 'create-team' ? (
        <Onboarding 
          user={user} 
          onComplete={refreshProfile} 
          isAdditionalTeam={true}
          onBack={() => setView('profile')}
          showToast={showToast}
        />
      ) : (
        <Dashboard 
          user={user} 
          profile={profile} 
          onSettingsClick={() => setView('profile')} 
          showToast={showToast}
        />
      )}
    </>
  );
}
