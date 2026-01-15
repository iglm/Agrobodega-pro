
import React, { useState } from 'react';
import { ShieldCheck, LogIn, FileText, CheckCircle2, Gavel, Zap, Lock, Award, Package, Calculator, BarChart3, ShieldAlert, Sparkles, User as UserIcon } from 'lucide-react';
import { User as UserType } from '../types';
import { LegalComplianceModal } from './LegalComplianceModal';

interface LandingProps {
  onEnter: (user: UserType) => void;
  onShowManual: () => void;
  onLoadDemoData: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onEnter, onShowManual, onLoadDemoData }) => {
  const [adminName, setAdminName] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showLegal, setShowLegal] = useState(false);

  const AUTHOR = "Lucas Mateo Tabares Franco";

  const handleLogin = () => {
    if (!accepted || !adminName.trim()) return;
    setIsLoggingIn(true);
    setTimeout(() => {
      onEnter({
        id: 'local_user',
        name: adminName.trim(),
        email: 'gestor@agrobodega.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AgroPro'
      });
    }, 1000);
  };

  const canLogin = accepted && adminName.trim().length > 0 && !isLoggingIn;

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden select-none">
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]"></div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center pt-16">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-8 rounded-[3rem] shadow-2xl shadow-emerald-900/40 mb-8 animate-slide-up">
              <Package className="w-16 h-16 text-white" />
          </div>
          
          <h1 className="text-6xl font-black text-white tracking-tighter leading-none animate-slide-up">
              AgroBodega <span className="text-emerald-500 italic">Pro</span>
          </h1>
          <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.4em] mt-4 mb-2 animate-slide-up">
              Sistema de Inteligencia y Rentabilidad
          </p>
          <div className="bg-slate-900/50 border border-slate-800 px-4 py-1.5 rounded-full inline-flex items-center gap-2 mb-12 animate-slide-up">
              <Award className="w-3 h-3 text-emerald-500" />
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic">Herramienta Privada de {AUTHOR}</span>
          </div>

          <div className="w-full max-w-2xl mb-12 animate-slide-up text-left">
              <div className="bg-slate-900/40 p-5 rounded-[2rem] border border-slate-800 flex flex-col items-center gap-2">
                  <Calculator className="w-6 h-6 text-indigo-400" />
                  <p className="text-[10px] font-black text-white uppercase">Costo al Gramo</p>
                  <p className="text-[9px] text-slate-500 leading-tight text-center">Precisión en bultos de 50kg y líquidos.</p>
              </div>
          </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-8 pb-12 bg-slate-950/80 backdrop-blur-2xl border-t border-slate-800 z-50 animate-slide-up">
          <div className="max-w-md mx-auto space-y-6">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase ml-2 flex items-center gap-2"><UserIcon className="w-3 h-3"/> Nombre del Administrador</label>
                <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Ej: Lucas Tabares"
                    className="w-full bg-slate-900/40 border-2 border-slate-800 rounded-2xl p-4 text-center text-white font-bold tracking-wider focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <label className="flex items-start gap-4 cursor-pointer group">
                  <div className="relative mt-1">
                      <input 
                          type="checkbox" 
                          className="peer h-6 w-6 rounded-xl border-2 border-slate-700 checked:bg-emerald-600 checked:border-emerald-600 transition-all cursor-pointer appearance-none" 
                          checked={accepted} 
                          onChange={(e) => setAccepted(e.target.checked)} 
                      />
                      <CheckCircle2 className="absolute inset-0 w-6 h-6 text-white scale-0 peer-checked:scale-75 transition-transform pointer-events-none" />
                  </div>
                  <div className="flex-1">
                      <p className={`text-[10px] font-black uppercase tracking-tight transition-colors ${accepted ? 'text-emerald-400' : 'text-slate-500'}`}>
                          Acepto términos, política de privacidad y autoría de {AUTHOR}
                      </p>
                      <p className="text-[8px] text-slate-600 uppercase font-bold mt-1">
                          Cumplimiento Ley 1581 (Habeas Data) & Ley 23 de 1982
                      </p>
                  </div>
              </label>

              <div className="flex flex-col gap-3">
                  <button 
                      onClick={handleLogin} 
                      disabled={!canLogin} 
                      className={`w-full py-5 rounded-[2rem] font-black text-sm flex items-center justify-center gap-3 transition-all shadow-2xl active:scale-95 ${ canLogin ? 'bg-emerald-600 text-white shadow-emerald-900/40 hover:bg-emerald-500' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                  >
                      {isLoggingIn ? <Zap className="w-6 h-6 animate-pulse" /> : <><LogIn className="w-6 h-6" /> INICIAR ADMINISTRACIÓN</>}
                  </button>

                  <button 
                      onClick={onLoadDemoData}
                      className="w-full py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all active:scale-95"
                  >
                      <Sparkles className="w-4 h-4" /> Explorar con Datos de Demostración
                  </button>
              </div>

              <div className="flex justify-center gap-6 pt-4 border-t border-slate-900">
                  <button onClick={() => setShowLegal(true)} className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 hover:text-white transition-colors">
                      <Gavel className="w-3 h-3" /> Marco Jurídico
                  </button>
                  <button onClick={onShowManual} className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 hover:text-white transition-colors">
                      <FileText className="w-3 h-3" /> Manual Técnico
                  </button>
              </div>
          </div>
      </div>

      {showLegal && <LegalComplianceModal onClose={() => setShowLegal(false)} />}
    </div>
  );
};
