import { Cloud, Cpu, Headset, MessageCircle, PhoneCall, Zap } from 'lucide-react';
import { AgreementOrigin } from '../../types';

interface OriginBadgeProps {
  origin: AgreementOrigin;
}

export const OriginBadge = ({ origin }: OriginBadgeProps) => {
  const configs = {
    [AgreementOrigin.SALESFORCE]: { icon: Cloud, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'Salesforce' },
    [AgreementOrigin.OKTOR]: { icon: Cpu, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', label: 'Oktor' },
    [AgreementOrigin.CALLIX]: { icon: Headset, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', label: 'Callix' },
    [AgreementOrigin.WHATSAPP]: { icon: MessageCircle, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'WhatsApp' },
    [AgreementOrigin.WEBPHONE]: { icon: PhoneCall, color: 'bg-sky-500/10 text-sky-400 border-sky-500/20', label: 'Webphone' },
    [AgreementOrigin.QUITE_DIGITAL]: { icon: Zap, color: 'bg-pink-500/10 text-pink-400 border-pink-500/20', label: 'Quite Digital' },
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
