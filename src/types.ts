export enum AgreementStatus {
  WAITING = 'waiting',
  PAID = 'paid',
  BROKEN = 'broken'
}

export enum AgreementOrigin {
  SALESFORCE = 'salesforce',
  OKTOR = 'oktor',
  CALLIX = 'callix',
  WHATSAPP = 'whatsapp',
  WEBPHONE = 'webphone',
  QUITE_DIGITAL = 'quite_digital'
}

export enum AgreementType {
  QUITACAO = 'quitacao',
  PARCELAMENTO = 'parcelamento',
  PARCELA_ATRASADA = 'parcela_atrasada',
  ANTECIPACAO = 'antecipacao'
}

export enum AgreementCategory {
  FIXA = 'fixa',
  VARIAVEL = 'variavel'
}

export type UserRole = 'supervisor' | 'member';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  teamId?: string;
  managedTeams?: string[]; // Para supervisores que gerenciam múltiplos times
  jobTitle?: string;
  theme?: 'dark' | 'sky' | 'purple';
  hasSeenTour?: boolean;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  supervisorId: string;
  inviteToken: string;
  monthlyGoal?: number;
  effectivenessGoal?: number;
  createdAt: string;
}

export interface Agreement {
  id: string;
  clientName: string;
  clientCpf: string;
  value: number;
  dueDate: string;
  status: AgreementStatus;
  origin: AgreementOrigin;
  type: AgreementType;
  category: AgreementCategory;
  phone?: string;
  operatorId: string; // Quem registrou
  teamId: string;     // A qual equipe pertence
  createdAt: string;
  paidAt?: string;
}

export interface DashboardStats {
  totalProjected: number;
  totalPaid: number;
  totalOverdue: number;
  totalPendingToday: number;
  effectivenessRate: number;
  ticketAverage: number;
  remainingToGoal: number;
  projection: number;
  counts: {
    total: number;
    paid: number;
    waiting: number;
    broken: number;
    overdue: number;
    pendingToday: number;
    today: number;
    month: number;
  };
  hourlyDistribution: Record<number, number>;
}
