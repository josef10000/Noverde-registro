/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum AgreementStatus {
  PAID = 'pago',
  WAITING = 'aguardando',
  BROKEN = 'quebrado',
}

export enum AgreementOrigin {
  PHONE = 'telefone',
  CHAT = 'chat',
  WHATSAPP = 'whatsapp',
}

export interface Agreement {
  id: string;
  clientName: string;
  clientCpf: string;
  origin: AgreementOrigin;
  dueDate: string;
  value: number;
  status: AgreementStatus;
  phone?: string;
  email?: string;
  paidAt?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalProjected: number;
  totalPaid: number;
  effectivenessRate: number;
  counts: {
    total: number;
    paid: number;
    waiting: number;
    broken: number;
  };
}
