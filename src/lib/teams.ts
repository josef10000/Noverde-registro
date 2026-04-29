import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  arrayUnion 
} from 'firebase/firestore';
import { db } from './firebase';
import { Team, UserProfile, UserRole } from '../types';

export const createTeam = async (uid: string, userEmail: string, teamName: string): Promise<string> => {
  const teamId = Math.random().toString(36).substr(2, 9);
  const inviteToken = Math.random().toString(36).substr(2, 12);
  
  const teamData: Team = {
    id: teamId,
    name: teamName,
    supervisorId: uid,
    inviteToken,
    createdAt: new Date().toISOString()
  };

  // 1. Criar a equipe
  await setDoc(doc(db, 'teams', teamId), teamData);

  // 2. Atualizar o perfil do usuário
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    await updateDoc(userRef, {
      role: 'supervisor' as UserRole,
      managedTeams: arrayUnion(teamId),
      teamId: userSnap.data().teamId || teamId
    });
  } else {
    const userProfile: UserProfile = {
      uid,
      email: userEmail,
      displayName: userEmail.split('@')[0],
      role: 'supervisor',
      teamId,
      managedTeams: [teamId],
      createdAt: new Date().toISOString()
    };
    await setDoc(userRef, userProfile);
  }

  return teamId;
};

export const joinTeam = async (uid: string, userEmail: string, inviteToken: string): Promise<boolean> => {
  const teamsRef = collection(db, 'teams');
  const q = query(teamsRef, where('inviteToken', '==', inviteToken));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error('Token de convite inválido.');
  }

  const teamData = querySnapshot.docs[0].data() as Team;

  const userProfile: UserProfile = {
    uid,
    email: userEmail,
    displayName: userEmail.split('@')[0],
    role: 'member',
    teamId: teamData.id,
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'users', uid), userProfile);
  
  return true;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

export const getTeamData = async (teamId: string): Promise<Team | null> => {
  const docRef = doc(db, 'teams', teamId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as Team;
  }
  return null;
};
