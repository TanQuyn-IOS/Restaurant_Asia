import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useRestaurant();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          let bg = 'bg-slate-900 text-white border-slate-700';
          let icon = <Info className="w-5 h-5 text-blue-400 shrink-0" />;

          if (toast.type === 'success') {
            bg = 'bg-emerald-950/90 text-emerald-100 border-emerald-700 shadow-emerald-900/20';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
          } else if (toast.type === 'warning') {
            bg = 'bg-amber-950/90 text-amber-100 border-amber-700 shadow-amber-900/20';
            icon = <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />;
          } else if (toast.type === 'error') {
            bg = 'bg-rose-950/90 text-rose-100 border-rose-700 shadow-rose-900/20';
            icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-lg backdrop-blur-md text-sm ${bg}`}
            >
              <div className="flex items-center gap-2.5">
                {icon}
                <span className="font-medium">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors ml-3 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
