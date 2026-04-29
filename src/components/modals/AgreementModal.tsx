import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { Agreement, AgreementOrigin, AgreementStatus } from '../../types';
import { formatCPF } from '../../utils/masks';

interface AgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  editingAgreement: Agreement | null;
}

export const AgreementModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingAgreement 
}: AgreementModalProps) => {
  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const agreementData = {
      clientName: formData.get('name') as string,
      clientCpf: formData.get('cpf') as string,
      origin: formData.get('origin') as AgreementOrigin,
      dueDate: formData.get('dueDate') as string,
      value: parseFloat(formData.get('value') as string),
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
    };

    onSubmit(agreementData);
  };

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
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-800 overflow-hidden"
      >
        <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h2 className="text-lg font-bold text-white">
              {editingAgreement ? 'Editar Acordo' : 'Registrar Novo Acordo'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">Preencha os dados do cliente e a negociação.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">CPF *</label>
              <input 
                required
                name="cpf"
                type="text" 
                placeholder="000.000.000-00" 
                defaultValue={editingAgreement?.clientCpf}
                onChange={(e) => e.target.value = formatCPF(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-mono text-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nome Completo</label>
              <input 
                name="name"
                type="text" 
                defaultValue={editingAgreement?.clientName}
                placeholder="Ex: João Silva" 
                className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Telefone/WhatsApp</label>
              <input 
                name="phone"
                type="tel" 
                defaultValue={editingAgreement?.phone}
                placeholder="(00) 00000-0000" 
                className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">E-mail</label>
              <input 
                name="email"
                type="email" 
                defaultValue={editingAgreement?.email}
                placeholder="exemplo@email.com" 
                className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Valor do Acordo *</label>
              <div className="relative">
                <span className="absolute left-4 inset-y-0 flex items-center text-slate-500 font-bold">R$</span>
                <input 
                  required
                  name="value"
                  type="number" 
                  step="0.01"
                  defaultValue={editingAgreement?.value}
                  placeholder="0,00" 
                  className="w-full bg-slate-950 border border-slate-800 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-slate-200"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Data de Vencimento *</label>
              <input 
                required
                name="dueDate"
                type="date" 
                defaultValue={editingAgreement?.dueDate}
                className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-slate-200 color-scheme-dark"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Origem do Atendimento *</label>
            <select 
              required
              name="origin"
              defaultValue={editingAgreement?.origin || ""}
              className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all appearance-none outline-none text-slate-200"
            >
              <option value="" disabled>Selecione uma origem...</option>
              <option value={AgreementOrigin.SALESFORCE}>Salesforce</option>
              <option value={AgreementOrigin.OKTOR}>Oktor</option>
              <option value={AgreementOrigin.CALLIX}>Callix</option>
              <option value={AgreementOrigin.WHATSAPP}>WhatsApp</option>
              <option value={AgreementOrigin.WEBPHONE}>Webphone</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-xl border border-slate-800 font-bold text-slate-400 hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 px-6 py-4 rounded-xl bg-sky-500 text-white font-bold hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/20 active:scale-95"
            >
              {editingAgreement ? 'Atualizar Acordo' : 'Salvar Acordo'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
