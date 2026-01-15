
import React, { useState, useMemo, useEffect } from 'react';
import { CostCenter, PestLog } from '../types';
import { Bug, CheckCircle2, AlertTriangle, ShieldAlert, Sprout, Save, RotateCcw, Scale, Leaf, Target, Info, ThermometerSun, AlertOctagon } from 'lucide-react';
import { formatNumberInput, parseNumberInput } from '../services/inventoryService';
import { HeaderCard, Modal } from './UIElements';

interface SanitaryViewProps {
  costCenters: CostCenter[];
  onSaveLog: (log: Omit<PestLog, 'id' | 'warehouseId'>) => void;
  pestLogs: PestLog[];
}

export const SanitaryView: React.FC<SanitaryViewProps> = ({ costCenters, onSaveLog, pestLogs }) => {
  const [activeTab, setActiveTab] = useState<'MONITOR' | 'QUALITY'>('MONITOR');
  
  // --- STATE: MONITOR DE PLAGAS (BROCA/ROYA) ---
  const [selectedLotId, setSelectedLotId] = useState('');
  const [pestType, setPestType] = useState<'Broca' | 'Roya'>('Broca');
  
  // Contadores de Sesión
  const [countHealthy, setCountHealthy] = useState(0);
  const [countAffected, setCountAffected] = useState(0);
  const [sitesSampled, setSitesSampled] = useState(0);

  // --- STATE: CALIDAD DE COSECHA (MEDIVERDES) ---
  const [sampleWeight, setSampleWeight] = useState('');
  const [greenWeight, setGreenWeight] = useState('');

  // --- LÓGICA CIENTÍFICA ---
  const totalFruits = countHealthy + countAffected;
  const infestationRate = totalFruits > 0 ? (countAffected / totalFruits) * 100 : 0;

  const qualityPct = useMemo(() => {
      const total = parseNumberInput(sampleWeight);
      const green = parseNumberInput(greenWeight);
      if (total <= 0) return 0;
      return (green / total) * 100;
  }, [sampleWeight, greenWeight]);

  // --- FEEDBACK HÁPTICO ---
  const triggerHaptic = (pattern: number | number[]) => {
      if (navigator.vibrate) navigator.vibrate(pattern);
  };

  const handleCount = (type: 'HEALTHY' | 'AFFECTED') => {
      if (type === 'HEALTHY') {
          setCountHealthy(prev => prev + 1);
          triggerHaptic(50); // Vibración corta
      } else {
          setCountAffected(prev => prev + 1);
          triggerHaptic([50, 50, 50]); // Vibración doble advertencia
      }
  };

  const handleNextSite = () => {
      setSitesSampled(prev => prev + 1);
      triggerHaptic(100);
  };

  const handleReset = () => {
      if(confirm("¿Reiniciar conteo actual? Se perderán los datos no guardados.")) {
          setCountHealthy(0);
          setCountAffected(0);
          setSitesSampled(0);
      }
  };

  const handleSaveMonitor = () => {
      if (!selectedLotId) { alert("Seleccione un lote"); return; }
      
      let incidenceLevel: 'Baja' | 'Media' | 'Alta' = 'Baja';
      if (infestationRate >= 5) incidenceLevel = 'Alta';
      else if (infestationRate >= 2) incidenceLevel = 'Media';

      const lotName = costCenters.find(c => c.id === selectedLotId)?.name;

      onSaveLog({
          date: new Date().toISOString(),
          costCenterId: selectedLotId,
          pestOrDisease: pestType,
          incidence: incidenceLevel,
          notes: `Muestreo Digital: ${infestationRate.toFixed(2)}% Infestación. ${sitesSampled} sitios evaluados. Total Frutos: ${totalFruits}.`
      });

      alert("Monitoreo Guardado. Se ha generado el registro histórico.");
      setCountHealthy(0);
      setCountAffected(0);
      setSitesSampled(0);
  };

  // --- DIAGNÓSTICO SEMÁFORO (CENICAFÉ) ---
  const getDiagnosis = () => {
      if (infestationRate < 2) return { 
          color: 'bg-emerald-500', 
          text: 'text-emerald-500', 
          bgSoft: 'bg-emerald-500/10',
          title: 'Control Bajo', 
          desc: 'Nivel seguro. Continuar monitoreo mensual.' 
      };
      if (infestationRate < 5) return { 
          color: 'bg-amber-500', 
          text: 'text-amber-500', 
          bgSoft: 'bg-amber-500/10',
          title: 'Alerta Temprana', 
          desc: 'Focos detectados. Evaluar control cultural (RE-RE).' 
      };
      return { 
          color: 'bg-red-600', 
          text: 'text-red-600', 
          bgSoft: 'bg-red-600/10',
          title: 'Daño Económico', 
          desc: '¡URGENTE! Realizar repase inmediato y evaluar control químico/biológico.' 
      };
  };

  const diagnosis = getDiagnosis();

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
        <HeaderCard 
            title="Sanidad y Calidad"
            subtitle="Laboratorio de Campo"
            valueLabel="Estado Fitosanitario"
            value={pestType === 'Broca' ? `${infestationRate.toFixed(1)}% Broca` : "Monitoreo"}
            gradientClass="bg-gradient-to-br from-teal-800 to-slate-900"
            icon={Bug}
            onAction={() => setActiveTab(activeTab === 'MONITOR' ? 'QUALITY' : 'MONITOR')}
            actionLabel={activeTab === 'MONITOR' ? "Ir a Calidad Cosecha" : "Ir a Monitoreo Plagas"}
            actionIcon={activeTab === 'MONITOR' ? Scale : Bug}
        />

        {/* --- SELECTOR DE MÓDULO --- */}
        <div className="flex bg-slate-200 dark:bg-slate-900 p-1.5 rounded-2xl gap-1">
            <button onClick={() => setActiveTab('MONITOR')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'MONITOR' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-500'}`}>
                <Bug className="w-4 h-4" /> Monitor Plagas
            </button>
            <button onClick={() => setActiveTab('QUALITY')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${activeTab === 'QUALITY' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>
                <Scale className="w-4 h-4" /> Calidad Grano
            </button>
        </div>

        {activeTab === 'MONITOR' && (
            <div className="space-y-4 animate-slide-up">
                {/* 1. CONFIGURACIÓN DE MUESTREO */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full">
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-2 mb-1 block">Lote a Evaluar</label>
                        <select value={selectedLotId} onChange={e => setSelectedLotId(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl p-3 text-sm font-bold text-slate-800 dark:text-white outline-none">
                            <option value="">Seleccionar Lote...</option>
                            {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full md:w-auto">
                        <button onClick={() => setPestType('Broca')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${pestType === 'Broca' ? 'bg-white dark:bg-slate-700 text-red-500 shadow-sm' : 'text-slate-500'}`}>Broca</button>
                        <button onClick={() => setPestType('Roya')} className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${pestType === 'Roya' ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-sm' : 'text-slate-500'}`}>Roya</button>
                    </div>
                </div>

                {selectedLotId ? (
                    <>
                        {/* 2. TABLERO DE RESULTADOS EN VIVO */}
                        <div className={`p-6 rounded-[2.5rem] border-2 transition-all duration-500 ${diagnosis.color.replace('bg-', 'border-')} bg-slate-900 relative overflow-hidden shadow-2xl`}>
                            <div className="relative z-10 flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertOctagon className={`w-5 h-5 ${diagnosis.text}`} />
                                        <span className={`text-xs font-black uppercase tracking-widest ${diagnosis.text}`}>{diagnosis.title}</span>
                                    </div>
                                    <p className="text-4xl font-black text-white font-mono tracking-tighter">
                                        {infestationRate.toFixed(1)}<span className="text-xl">%</span>
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-2 max-w-[200px] leading-tight">{diagnosis.desc}</p>
                                </div>
                                <div className="text-right space-y-2">
                                    <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-700">
                                        <p className="text-[8px] text-slate-500 font-black uppercase">Muestra Total</p>
                                        <p className="text-xl font-mono font-bold text-white">{totalFruits}</p>
                                    </div>
                                    <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-700">
                                        <p className="text-[8px] text-slate-500 font-black uppercase">Sitios / Árboles</p>
                                        <p className="text-xl font-mono font-bold text-white">{sitesSampled}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Visual Progress Bar Background */}
                            <div className="absolute bottom-0 left-0 h-2 bg-slate-800 w-full">
                                <div className={`h-full ${diagnosis.color} transition-all duration-300`} style={{ width: `${Math.min(infestationRate * 10, 100)}%` }}></div>
                            </div>
                        </div>

                        {/* 3. INTERFAZ "CLICKER" GIGANTE */}
                        <div className="grid grid-cols-2 gap-4 h-64">
                            <button 
                                onClick={() => handleCount('HEALTHY')}
                                className="bg-emerald-600 active:bg-emerald-700 active:scale-95 transition-all rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center gap-2 group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                                <Sprout className="w-16 h-16 text-emerald-200 group-hover:scale-110 transition-transform" />
                                <span className="text-2xl font-black text-white uppercase tracking-wider">SANO</span>
                                <span className="text-sm font-mono font-bold text-emerald-200 opacity-80">({countHealthy})</span>
                            </button>

                            <button 
                                onClick={() => handleCount('AFFECTED')}
                                className="bg-red-600 active:bg-red-700 active:scale-95 transition-all rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center gap-2 group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                                <Bug className="w-16 h-16 text-red-200 group-hover:scale-110 transition-transform" />
                                <span className="text-2xl font-black text-white uppercase tracking-wider">{pestType.toUpperCase()}</span>
                                <span className="text-sm font-mono font-bold text-red-200 opacity-80">({countAffected})</span>
                            </button>
                        </div>

                        {/* 4. CONTROLES DE SESIÓN */}
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={handleNextSite} className="bg-slate-200 dark:bg-slate-800 p-4 rounded-2xl font-black text-xs uppercase text-slate-600 dark:text-slate-300 active:scale-95 transition-all flex items-center justify-center gap-2">
                                <Target className="w-4 h-4" /> Siguiente Sitio (+1)
                            </button>
                            <button onClick={handleReset} className="bg-slate-200 dark:bg-slate-800 p-4 rounded-2xl font-black text-xs uppercase text-slate-600 dark:text-slate-300 active:scale-95 transition-all flex items-center justify-center gap-2">
                                <RotateCcw className="w-4 h-4" /> Reiniciar
                            </button>
                        </div>

                        <button 
                            onClick={handleSaveMonitor}
                            disabled={totalFruits === 0}
                            className="w-full bg-slate-900 dark:bg-slate-700 hover:bg-teal-600 text-white font-black py-5 rounded-[2rem] shadow-xl text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-5 h-5" /> Guardar Monitoreo
                        </button>
                    </>
                ) : (
                    <div className="p-10 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl opacity-50">
                        <ThermometerSun className="w-12 h-12 mx-auto mb-2" />
                        <p className="font-bold uppercase text-xs">Seleccione un lote para iniciar</p>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'QUALITY' && (
            <div className="space-y-6 animate-slide-up">
                <div className="bg-indigo-900/20 p-6 rounded-[2.5rem] border border-indigo-500/30 text-center space-y-2">
                    <h4 className="text-indigo-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"><Scale className="w-4 h-4" /> Análisis Mediverdes</h4>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                        Mida el porcentaje de granos verdes en la masa recolectada para evitar castigos en el precio de venta.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-700 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Peso Muestra (g)</label>
                            <input type="number" value={sampleWeight} onChange={e => setSampleWeight(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl p-4 text-center text-xl font-black text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: 500" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Peso Verdes (g)</label>
                            <input type="number" value={greenWeight} onChange={e => setGreenWeight(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl p-4 text-center text-xl font-black text-green-600 outline-none focus:ring-2 focus:ring-green-500" placeholder="Ej: 10" />
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Porcentaje de Verdes</p>
                        <p className={`text-5xl font-black font-mono tracking-tighter ${qualityPct > 2.5 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {qualityPct.toFixed(2)}%
                        </p>
                        
                        <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase ${qualityPct > 2.5 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {qualityPct > 2.5 ? <ShieldAlert className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            {qualityPct > 2.5 ? 'Penalización Probable' : 'Calidad Óptima'}
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-500/20 flex gap-3">
                        <Info className="w-5 h-5 text-blue-500 shrink-0" />
                        <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">
                            <strong>Estándar:</strong> Se tolera hasta un 2.5% de verdes en masa. Por encima de este valor, el factor de rendimiento se ve afectado drásticamente.
                        </p>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
