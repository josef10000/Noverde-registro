import React from 'react';
import { motion } from 'motion/react';
import { X, Loader2, Clock, CheckCircle2 } from 'lucide-react';
import { Agreement, AgreementStatus, AgreementType } from '../../types';
import { OriginBadge } from '../dashboard/OriginBadge';
import { formatCurrency } from '../../utils/masks';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientCpf: string | null;
  history: Agreement[];
  isLoading: boolean;
}

export const HistoryModal = ({ 
  isOpen, 
  onClose, 
  clientCpf, 
  history, 
  isLoading 
}: HistoryModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, x: 20 }}
        animate={{ scale: 1, opacity: 1, x: 0 }}
        exit={{ scale: 0.95, opacity: 0, x: 20 }}
        className="relative bg-slate-900 w-full max-w-2xl max-h-[80vh] rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col"
      >
        <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-lg font-bold text-white">Histórico do Cliente</h2>
            <p className="text-xs text-slate-500 font-medium font-mono">CPF: {clientCpf}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="animate-spin text-sky-500" size={24} />
              <span className="text-xs font-medium text-slate-500">Buscando histórico...</span>
            </div>
          ) : history.length > 0 ? (
            <div className="space-y-4">
              {history.map((item) => (
                <div 
                  key={item.id}
                  className={`p-5 rounded-2xl border ${
                    item.status === AgreementStatus.PAID 
                      ? 'bg-emerald-500/5 border-emerald-500/10' 
                      : item.status === AgreementStatus.BROKEN 
                        ? 'bg-rose-500/5 border-rose-500/10' 
                        : 'bg-slate-800/20 border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="text-lg font-bold text-white">{formatCurrency(item.value)}</span>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      {item.status === AgreementStatus.PAID ? (
                        <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white px-2 py-0.5 rounded">PAGO</span>
                      ) : item.status === AgreementStatus.BROKEN ? (
                        <span className="text-[10px] font-black uppercase tracking-widest bg-rose-500 text-white px-2 py-0.5 rounded">QUEBRADO</span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white px-2 py-0.5 rounded">AGUARDANDO</span>
                      )}
                      <OriginBadge origin={item.origin} />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                        {item.type === AgreementType.QUITACAO ? 'Quitação' : 
                         item.type === AgreementType.PARCELAMENTO ? 'Parcelamento' :
                         item.type === AgreementType.PARCELA_ATRASADA ? 'Parc. Atrasada' :
                         item.type === AgreementType.ANTECIPACAO ? 'Antecipação' : item.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      Vencimento: {new Date(item.dueDate).toLocaleDateString('pt-BR')}
                    </div>
                    {item.paidAt && (
                      <div className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 size={12} />
                        Pago em: {new Date(item.paidAt).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 italic">
              Nenhum registro encontrado para este CPF.
            </div>
          )}
        </div>
        <div className="px-8 py-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
           <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Total de negociações: {history.length}</p>
        </div>
      </motion.div>
    </div>
  );
};
