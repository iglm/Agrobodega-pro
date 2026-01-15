import React, { useState } from 'react';
import { Lock, Unlock, ShieldCheck, X } from 'lucide-react';

interface SecurityModalProps {
  existingPin?: string;
  onSuccess: (pin: string) => void;
  onClose: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ existingPin, onSuccess, onClose }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const isSetup = !existingPin;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pin.length < 4) {
      setError('El PIN debe tener al menos 4 dígitos.');
      return;
    }

    if (isSetup) {
      if (pin !== confirmPin) {
        setError('Los PIN no coinciden.');
        return;
      }
      onSuccess(pin);
    } else {
      if (pin === existingPin) {
        onSuccess(pin);
      } else {
        setError('PIN incorrecto.');
        setPin('');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-slide-up">
        
        <div className="bg-slate-900 p-6 flex flex-col items-center border-b border-slate-700 relative">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isSetup ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
             {isSetup ? <ShieldCheck className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
          </div>
          <h3 className="text-xl font-bold text-white">
            {isSetup ? 'Crear PIN Administrativo' : 'Acceso Gerencial'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {isSetup ? 'Proteja los datos sensibles de su bodega' : 'Ingrese su PIN para desbloquear funciones'}
          </p>
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
               <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                 {isSetup ? 'Nuevo PIN' : 'Ingrese PIN'}
               </label>
               <input 
                  type="password" 
                  inputMode="numeric"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-center text-2xl tracking-widest text-white focus:border-emerald-500 outline-none transition-colors"
                  placeholder="****"
                  autoFocus
                  maxLength={6}
               />
            </div>

            {isSetup && (
               <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Confirmar PIN</label>
                  <input 
                      type="password" 
                      inputMode="numeric"
                      value={confirmPin}
                      onChange={e => setConfirmPin(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-center text-2xl tracking-widest text-white focus:border-emerald-500 outline-none transition-colors"
                      placeholder="****"
                      maxLength={6}
                  />
               </div>
            )}

            {error && (
               <p className="text-xs text-red-400 text-center bg-red-900/20 p-2 rounded border border-red-900/50">
                 {error}
               </p>
            )}

            <button 
               type="submit"
               className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${isSetup ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500'}`}
            >
               {isSetup ? <ShieldCheck className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
               {isSetup ? 'Proteger Sistema' : 'Desbloquear'}
            </button>
        </form>

      </div>
    </div>
  );
};