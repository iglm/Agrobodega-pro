
import React, { useState } from 'react';
import { X, Medal, Shield, Star, Check, Crown, Zap, Rocket, Calendar, CreditCard, Server, Cpu, HardDrive } from 'lucide-react';
import { useData } from '../contexts/DataContext'; // Import context to get real data
import { SystemHealth } from './SystemHealth'; // Import the new component

interface SupportModalProps {
  onClose: () => void;
  onUpgrade: () => void;
  isSupporter?: boolean;
}

export const SupportModal: React.FC<SupportModalProps> = ({ onClose, onUpgrade, isSupporter }) => {
  const [loading, setLoading] = useState(false);
  const { data } = useData(); // Access real data

  // Calculate total logs for health check
  const totalLogs = (data.laborLogs?.length || 0) + (data.movements?.length || 0) + (data.harvests?.length || 0);

  const handleUpgrade = () => {
    setLoading(true);
    // Simulación de pasarela de suscripciones Play Store
    setTimeout(() => {
      onUpgrade();
      setLoading(false);
      alert("¡BIENVENIDO A PRO! 🚀 Tu suscripción mensual de DatosFinca Viva ha sido activada.");
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-700 animate-slide-up flex flex-col md:flex-row h-auto max-h-[95vh] overflow-y-auto custom-scrollbar">
        
        {/* Lado Izquierdo: Beneficios Premium */}
        <div className="md:w-5/12 bg-gradient-to-br from-indigo-700 via-indigo-900 to-slate-950 p-8 text-white relative overflow-hidden flex-shrink-0">
            <div className="absolute -right-10 -bottom-10 opacity-10">
                <Crown className="w-48 h-48" />
            </div>
            
            <div className="relative z-10">
                <div className="w-12 h-12 bg-indigo-500/30 rounded-2xl flex items-center justify-center mb-6 border border-indigo-400/30">
                    <Star className="w-7 h-7 text-yellow-400 animate-pulse" />
                </div>
                <h3 className="text-2xl font-black leading-tight mb-4">Plan<br/>Profesional</h3>
                
                <ul className="space-y-4">
                    {[
                        "Reportes PDF/Excel Gerenciales",
                        "Gestión de Múltiples Fincas",
                        "Exportación de Nómina Masiva",
                        "Soporte Técnico Prioritario",
                        "Sin Anuncios Publicitarios"
                    ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-[11px] font-bold text-indigo-100">
                            <div className="mt-0.5 p-0.5 bg-yellow-500 rounded-full"><Check className="w-2.5 h-2.5 text-indigo-900" /></div>
                            {item}
                        </li>
                    ))}
                </ul>

                <div className="mt-10 pt-6 border-t border-white/10">
                    <p className="text-[9px] uppercase font-black tracking-widest text-indigo-300 flex items-center gap-1.5 mb-1">
                        <Calendar className="w-3 h-3" /> Suscripción Mensual
                    </p>
                    <p className="text-3xl font-black">$ 4.99 <span className="text-xs font-normal text-indigo-300">/ mes</span></p>
                </div>
            </div>
        </div>

        {/* Lado Derecho: Contenido Técnico y Acción */}
        <div className="md:w-7/12 p-8 flex flex-col gap-6 bg-slate-900">
          
          {/* Header Derecho */}
          <div className="flex justify-between items-start">
              <div className="space-y-1">
                  <h4 className="text-slate-100 font-bold text-xl">Centro de Soporte</h4>
                  <p className="text-xs text-slate-400">Estado del sistema y plan de facturación.</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-500">
                <X className="w-6 h-6" />
              </button>
          </div>

          {/* --- NUEVA SECCIÓN: ESTADO Y CAPACIDAD --- */}
          <div className="border border-amber-500/20 rounded-3xl p-1 bg-slate-900/50">
              <div className="bg-slate-800/50 p-4 rounded-[1.3rem] mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                          <Server className="w-5 h-5" />
                      </div>
                      <div>
                          <h5 className="text-white text-xs font-black uppercase">Estado y Capacidad</h5>
                          <p className="text-[9px] text-slate-400">Arquitectura Local-First</p>
                      </div>
                  </div>
                  <Cpu className="w-4 h-4 text-slate-600" />
              </div>

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Monitor en Tiempo Real */}
                  <SystemHealth 
                      costCentersCount={data.costCenters.length}
                      personnelCount={data.personnel.length}
                      logsCount={totalLogs}
                  />

                  {/* Tabla de Referencia SLA */}
                  <div className="space-y-3">
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">
                          <HardDrive className="w-3 h-3" /> Límites Recomendados
                      </p>
                      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                          <div className="grid grid-cols-2 text-[9px] font-bold text-slate-400 border-b border-slate-800 bg-slate-900/50 p-2">
                              <span>Recurso</span>
                              <span className="text-right">Capacidad Óptima</span>
                          </div>
                          {[
                              { label: 'Fincas', val: '1 - 3 Sedes' },
                              { label: 'Lotes', val: '20 - 50 Bloques' },
                              { label: 'Trabajadores', val: '10 - 50 Personas' },
                              { label: 'Historial', val: '< 20k Registros' }
                          ].map((row, idx) => (
                              <div key={idx} className="grid grid-cols-2 text-[9px] text-slate-300 p-2 border-b border-slate-800 last:border-0 hover:bg-slate-800/30">
                                  <span>{row.label}</span>
                                  <span className="text-right font-mono text-emerald-500">{row.val}</span>
                              </div>
                          ))}
                      </div>
                      <p className="text-[8px] text-slate-600 leading-tight italic">
                          * El rendimiento depende de la RAM de su dispositivo. Se recomienda purgar datos antiguos anualmente.
                      </p>
                  </div>
              </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800">
              <button 
                onClick={handleUpgrade}
                disabled={isSupporter || loading}
                className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-xl ${isSupporter ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-500/30' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40'}`}
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : isSupporter ? <><Medal className="w-5 h-5"/> SUSCRIPCIÓN ACTIVA</> : <><Rocket className="w-5 h-5"/> SUSCRIBIRME POR $4.99 / MES</>}
              </button>
              
              {!isSupporter && (
                  <div className="flex items-center gap-3 justify-center text-[9px] text-slate-500">
                      <Shield className="w-3 h-3" />
                      <p>Transacción segura procesada por Google Play</p>
                  </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
