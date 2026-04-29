import React from 'react';
import { Phone, MessageSquare, MessageCircle } from 'lucide-react';
import { AgreementOrigin } from '../../types';

interface OriginBadgeProps {
  origin: AgreementOrigin;
}

export const OriginBadge = ({ origin }: OriginBadgeProps) => {
  const configs = {
    [AgreementOrigin.PHONE]: { icon: Phone, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'Telefone' },
    [AgreementOrigin.CHAT]: { icon: MessageSquare, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', label: 'Chat' },
    [AgreementOrigin.WHATSAPP]: { icon: MessageCircle, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'WhatsApp' },
  };
  
  const config = configs[origin];
  if (!config) return null;
  
  const Icon = config.icon;

  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
};
