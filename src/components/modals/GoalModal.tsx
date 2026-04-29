import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goal: number, effGoal: number) => void;
  monthlyGoal: number;
  effectivenessGoal: number;
}

export const GoalModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  monthlyGoal, 
  effectivenessGoal 
}: GoalModalProps) => {
  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newGoal = parseFloat(formData.get('goal') as string);
    const newEffGoal = parseFloat(formData.get('effGoal') as string);
    onSubmit(newGoal, newEffGoal);
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
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-800 overflow-hidden"
      >
        <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-lg font-bold text-white">Meta Mensal</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleFormSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Cota Mensal (R$)</label>
              <input 
                required
                name="goal"
                type="number" 
                defaultValue={monthlyGoal}
                className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Meta de Efetividade (%)</label>
              <input 
                required
                name="effGoal"
                type="number" 
                defaultValue={effectivenessGoal}
                className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-slate-200"
              />
            </div>
          </div>
          <button 
            type="submit"
            className="w-full px-6 py-4 rounded-xl bg-sky-500 text-white font-bold hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/20"
          >
            Atualizar Metas
          </button>
        </form>
      </motion.div>
    </div>
  );
};
