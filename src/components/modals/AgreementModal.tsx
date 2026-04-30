import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { Agreement, AgreementOrigin, AgreementStatus, AgreementType } from '../../types';
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

  const normalizeValue = (val: string): number => {
    if (!val) return 0;
    // Remove R$, espaços e pontos de milhar (se houver vírgula depois)
    let cleaned = val.replace(/[R$\s]/g, '');
    
    if (cleaned.includes(',') && cleaned.includes('.')) {
      // Formato brasileiro: 1.234,56 -> 1234.56
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
      // Formato simples com vírgula: 1234,56 -> 1234.56
      cleaned = cleaned.replace(',', '.');
    }
    
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const rawValue = formData.get('value') as string;
    const normalizedValue = normalizeValue(rawValue);

    const agreementData = {
      clientName: formData.get('name') as string,
      clientCpf: formData.get('cpf') as string,
      origin: formData.get('origin') as AgreementOrigin,
      dueDate: formData.get('dueDate') as string,
      value: normalizedValue,
      phone: formData.get('phone') as string,
      type: formData.get('type') as AgreementType,
      status: formData.get('initialStatus') as AgreementStatus,
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
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tipo de Acordo *</label>
              <select 
                required
                name="type"
                defaultValue={editingAgreement?.type || ""}
                className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all appearance-none outline-none text-slate-200"
              >
                <option value="" disabled>Selecione o tipo...</option>
                <option value="quitacao">Quitação</option>
                <option value="parcelamento">Parcelamento</option>
                <option value="parcela_atrasada">Parcela Atrasada</option>
                <option value="antecipacao">Antecipação</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Valor do Acordo *</label>
              <div className="relative">
                <span className="absolute left-4 inset-y-0 flex items-center text-slate-500 font-bold">R$</span>
                <input 
                  required
                  name="value"
                  type="text" 
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
                <option value={AgreementOrigin.QUITE_DIGITAL}>Quite Digital</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Status Inicial</label>
              <div className="grid grid-cols-2 gap-4">
                <label className="relative flex flex-col cursor-pointer group">
                  <input 
                    type="radio" 
                    name="initialStatus" 
                    value={AgreementStatus.WAITING} 
                    defaultChecked={!editingAgreement || editingAgreement.status === AgreementStatus.WAITING}
                    className="peer hidden"
                  />
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 bg-slate-950 peer-checked:border-sky-500/50 peer-checked:bg-sky-500/5 transition-all">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-700 flex items-center justify-center peer-checked:border-sky-500 group-hover:border-slate-600 transition-all">
                      <div className="w-2.5 h-2.5 rounded-full bg-sky-500 scale-0 peer-checked:scale-100 transition-all" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-300 peer-checked:text-white uppercase tracking-wider">Pendente</span>
                      <span className="text-[9px] text-slate-500 font-medium">Aguardando pagamento</span>
                    </div>
                  </div>
                </label>
                
                <label className="relative flex flex-col cursor-pointer group">
                  <input 
                    type="radio" 
                    name="initialStatus" 
                    value={AgreementStatus.PAID} 
                    defaultChecked={editingAgreement?.status === AgreementStatus.PAID}
                    className="peer hidden"
                  />
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 bg-slate-950 peer-checked:border-emerald-500/50 peer-checked:bg-emerald-500/5 transition-all">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-700 flex items-center justify-center peer-checked:border-emerald-500 group-hover:border-slate-600 transition-all">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 scale-0 peer-checked:scale-100 transition-all" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-300 peer-checked:text-white uppercase tracking-wider">Já Pago</span>
                      <span className="text-[9px] text-slate-500 font-medium">Registrar como efetivado</span>
                    </div>
                  </div>
                </label>
              </div>
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
