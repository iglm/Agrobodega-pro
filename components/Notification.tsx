
import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Increased time for better readability

    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';

  return (
    <div className={`fixed top-6 right-0 left-0 mx-auto z-[200] w-[90%] max-w-md p-5 rounded-3xl shadow-2xl border-2 flex items-center gap-5 animate-fade-in-down transform transition-all
      ${isSuccess 
        ? 'bg-emerald-900/95 border-emerald-400 text-white backdrop-blur-md' 
        : 'bg-red-900/95 border-red-400 text-white backdrop-blur-md'}`
    }>
      <div className={`shrink-0 p-2 rounded-full ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}`}>
        {isSuccess ? <CheckCircle className="w-8 h-8 text-white" /> : <AlertTriangle className="w-8 h-8 text-white" />}
      </div>
      <div className="flex-1">
        <p className="font-black text-lg uppercase tracking-wide">{isSuccess ? '¡Excelente!' : 'Atención'}</p>
        <p className="text-base font-medium mt-1 leading-snug">{message}</p>
      </div>
      <button onClick={onClose} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors active:scale-95">
        <X className="w-6 h-6" />
      </button>
    </div>
  );
};
