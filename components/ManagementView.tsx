
import React, { useState, useMemo } from 'react';
import { Machine, MaintenanceLog, RainLog, CostCenter, Personnel, Activity, SoilAnalysis, PPELog, WasteLog, Asset, PhenologyLog, PestLog } from '../types';
import { Plus, Droplets, Leaf, Signature, Fingerprint, Lock, Gavel, ShieldAlert, Timer, Recycle, CheckCircle } from 'lucide-react';

interface ManagementViewProps {
  machines: Machine[];
  maintenanceLogs: MaintenanceLog[];
  rainLogs: RainLog[];
  costCenters: CostCenter[];
  personnel: Personnel[];
  activities: Activity[];
  soilAnalyses: SoilAnalysis[];
  ppeLogs: PPELog[];
  wasteLogs: WasteLog[];
  assets: Asset[];
  bpaChecklist: Record<string, boolean>;
  phenologyLogs: PhenologyLog[];
  pestLogs: PestLog[];
  onAddMachine: (m: Omit<Machine, 'id' | 'warehouseId'>) => void;
  onUpdateMachine: (machine: Machine) => void;
  onAddMaintenance: (m: Omit<MaintenanceLog, 'id' | 'warehouseId'>) => void;
  onDeleteMachine: (id: string) => void;
  onAddRain: (r: Omit<RainLog, 'id' | 'warehouseId'>) => void;
  onDeleteRain: (id: string) => void;
  onAddSoilAnalysis: (s: Omit<SoilAnalysis, 'id' | 'warehouseId'>) => void;
  onDeleteSoilAnalysis: (id: string) => void;
  onAddPPE: (p: Omit<PPELog, 'id' | 'warehouseId'>) => void;
  onDeletePPE: (id: string) => void;
  onAddWaste: (w: Omit<WasteLog, 'id' | 'warehouseId'>) => void;
  onDeleteWaste: (id: string) => void;
  onAddAsset: (a: Omit<Asset, 'id' | 'warehouseId'>) => void;
  onDeleteAsset: (id: string) => void;
  onToggleBpa: (code: string) => void;
  onAddPhenologyLog: (log: Omit<PhenologyLog, 'id' | 'warehouseId'>) => void;
  onDeletePhenologyLog: (id: string) => void;
  onAddPestLog: (log: Omit<PestLog, 'id' | 'warehouseId'>) => void;
  onDeletePestLog: (id: string) => void;
  isAdmin: boolean;
}

export const ManagementView: React.FC<ManagementViewProps> = ({
    machines, maintenanceLogs, rainLogs, costCenters, personnel, activities,
    soilAnalyses, ppeLogs, wasteLogs, assets, bpaChecklist, phenologyLogs, pestLogs,
    onAddRain, onDeleteRain,
    onAddPPE, onDeletePPE,
    onAddWaste, onDeleteWaste,
    onAddPhenologyLog, onDeletePhenologyLog,
    onAddPestLog, onDeletePestLog,
    isAdmin
}) => {
  const [subTab, setSubTab] = useState<'integrity' | 'agronomy' | 'sst'>('integrity');
  
  // Forms State
  const [rainMm, setRainMm] = useState('');
  const [phenoLotId, setPhenoLotId] = useState('');
  const [phenoStage, setPhenoStage] = useState<'Floración' | 'Cuajado' | 'Llenado' | 'Maduración'>('Floración');
  const [ppePersonnelId, setPpePersonnelId] = useState('');
  const [ppeItems, setPpeItems] = useState('');
  const [wasteDescription, setWasteDescription] = useState('');
  const [wasteQty, setWasteQty] = useState('');
  const [wasteTripleWashed, setWasteTripleWashed] = useState(true);

  // --- MODELO PREDICTIVO: COSECHA POR FLORACIÓN (8 Meses) ---
  const harvestPredictions = useMemo(() => {
      return phenologyLogs.filter(p => p.stage === 'Floración').map(log => {
          const dateObj = new Date(log.date);
          const prediction = new Date(dateObj);
          prediction.setMonth(prediction.getMonth() + 8);
          const lot = costCenters.find(c => c.id === log.costCenterId);
          return {
              id: log.id,
              lotName: lot?.name || 'Lote desconocido',
              predictionDate: prediction.toISOString().split('T')[0],
              originDate: log.date.split('T')[0]
          };
      }).sort((a,b) => new Date(a.predictionDate).getTime() - new Date(b.predictionDate).getTime());
  }, [phenologyLogs, costCenters]);

  const handleAddRain = (e: React.FormEvent) => { e.preventDefault(); if(rainMm) { onAddRain({date: new Date().toISOString(), millimeters: parseFloat(rainMm)}); setRainMm(''); } };
  const handleAddPheno = (e: React.FormEvent) => { e.preventDefault(); if(phenoLotId) { onAddPhenologyLog({date: new Date().toISOString(), costCenterId: phenoLotId, stage: phenoStage}); setPhenoLotId(''); } };
  const handleAddPPEsubmit = (e: React.FormEvent) => { e.preventDefault(); if (!ppePersonnelId || !ppeItems) return; const person = personnel.find(p => p.id === ppePersonnelId); if (!person) return; onAddPPE({ date: new Date().toISOString(), personnelId: ppePersonnelId, personnelName: person.name, items: ppeItems.split(',').map(s => s.trim()) }); setPpePersonnelId(''); setPpeItems(''); };
  const handleAddWasteSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!wasteDescription || !wasteQty) return; onAddWaste({ date: new Date().toISOString(), itemDescription: wasteDescription, quantity: parseFloat(wasteQty), tripleWashed: wasteTripleWashed }); setWasteDescription(''); setWasteQty(''); setWasteTripleWashed(true); };

  return (
    <div className="space-y-8 pb-24 animate-fade-in">
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1.5 rounded-2xl overflow-x-auto scrollbar-hide gap-1 sticky top-[120px] z-30 shadow-md">
            <button onClick={() => setSubTab('integrity')} className={`shrink-0 px-6 py-3 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all ${subTab === 'integrity' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}><Fingerprint className="w-4 h-4" /> Blindaje Legal</button>
            <button onClick={() => setSubTab('agronomy')} className={`shrink-0 px-6 py-3 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all ${subTab === 'agronomy' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}><Leaf className="w-4 h-4" /> Fenología</button>
            <button onClick={() => setSubTab('sst')} className={`shrink-0 px-6 py-3 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all ${subTab === 'sst' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500'}`}><Signature className="w-4 h-4" /> SST/Ambiental</button>
        </div>

        {subTab === 'integrity' && (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-slate-900 p-8 rounded-[3rem] border border-slate-700 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><Lock className="w-40 h-40 text-indigo-500" /></div>
                    <div className="relative z-10 space-y-5">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg"><Fingerprint className="w-8 h-8 text-white" /></div>
                            <h3 className="text-white font-black text-2xl uppercase italic">Marco Legal y Auditoría</h3>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed font-medium">
                            Este software de inteligencia agrícola es propiedad intelectual protegida de <strong>Lucas Mateo Tabares Franco</strong>. Su diseño BI integra normativas vigentes del sector caficultor colombiano.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
                            <div className="bg-slate-950 p-6 rounded-[2rem] border border-slate-800 space-y-4">
                                <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2"><Gavel className="w-5 h-5"/> Normativa Aplicable</h4>
                                <ul className="space-y-3">
                                    <li className="text-[10px] text-slate-500 font-bold flex items-start gap-3">
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1 shrink-0"/> 
                                        <span>Ley 23 de 1982: Protección de Derechos de Autor y Software.</span>
                                    </li>
                                    <li className="text-[10px] text-slate-500 font-bold flex items-start gap-3">
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1 shrink-0"/> 
                                        <span>Ley 1581 de 2012: Habeas Data y Protección de Datos Locales.</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-slate-950 p-6 rounded-[2rem] border border-slate-800 space-y-4">
                                <h4 className="text-xs font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2"><ShieldAlert className="w-5 h-5"/> Seguridad de Datos</h4>
                                <p className="text-[10px] text-slate-400 leading-relaxed">
                                    La arquitectura "Local-First" garantiza que los registros contables y tácticos residan exclusivamente en su dispositivo. El desarrollador no posee acceso remoto a su información financiera.
                                </p>
                                <div className="p-4 bg-indigo-900/10 rounded-xl border border-indigo-500/20 text-center">
                                    <span className="text-[9px] text-indigo-400 font-black font-mono">AUTORÍA: LUCAS MATEO TABARES FRANCO</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {subTab === 'agronomy' && (
            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <form onSubmit={handleAddRain} className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-700">
                        <h4 className="text-blue-400 text-sm uppercase font-black flex items-center gap-2 mb-5"><Droplets className="w-5 h-5"/> Registro Lluvias (mm)</h4>
                        <div className="flex gap-3">
                            <input type="number" value={rainMm} onChange={e=>setRainMm(e.target.value)} placeholder="mm" className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl p-4 text-white font-mono text-xl" required />
                            <button type="submit" className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg"><Plus className="w-6 h-6"/></button>
                        </div>
                    </form>
                    <form onSubmit={handleAddPheno} className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-700 space-y-5">
                        <h4 className="text-emerald-400 text-sm uppercase font-black flex items-center gap-2"><Leaf className="w-5 h-5"/> Hito Fenológico</h4>
                        <select value={phenoLotId} onChange={e=>setPhenoLotId(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-sm text-white font-bold" required>
                            <option value="">Seleccionar Lote...</option>
                            {costCenters.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <div className="flex gap-3">
                            <select value={phenoStage} onChange={e=>setPhenoStage(e.target.value as any)} className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl p-4 text-xs font-black uppercase text-emerald-400">
                                <option value="Floración">Floración (Hito BI)</option>
                                <option value="Cuajado">Cuajado</option>
                                <option value="Llenado">Llenado</option>
                                <option value="Maduración">Maduración</option>
                            </select>
                            <button type="submit" className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg"><Plus className="w-6 h-6"/></button>
                        </div>
                    </form>
                </div>

                {harvestPredictions.length > 0 && (
                    <div className="bg-indigo-950/20 p-8 rounded-[3rem] border border-indigo-500/20 space-y-6">
                        <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                            <Timer className="w-5 h-5" /> Proyección de Cosecha (T+8 Meses)
                        </h4>
                        <div className="grid gap-4">
                            {harvestPredictions.slice(0, 5).map(p => (
                                <div key={p.id} className="bg-slate-900/80 p-5 rounded-3xl border border-slate-700 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-black text-white uppercase italic">{p.lotName}</p>
                                        <p className="text-[10px] text-slate-500 font-bold mt-1">Floración: {p.originDate}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-indigo-400 font-black uppercase">Cosecha Estimada</p>
                                        <p className="text-lg font-black text-emerald-500 font-mono">{p.predictionDate}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-500 text-center italic">Basado en el referente técnico Cenicafé. Programe su mano de obra para estas fechas.</p>
                    </div>
                )}
            </div>
        )}

        {subTab === 'sst' && (
            <div className="space-y-6 animate-fade-in">
                <form onSubmit={handleAddPPEsubmit} className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-700 space-y-5">
                    <h4 className="text-red-400 text-sm uppercase font-black mb-2 flex items-center gap-2"><Signature className="w-5 h-5" /> Registro de EPP</h4>
                    <select value={ppePersonnelId} onChange={e => setPpePersonnelId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-base text-white font-bold"><option value="">Seleccionar Trabajador</option>{personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                    <input type="text" value={ppeItems} onChange={e => setPpeItems(e.target.value)} placeholder="Items (Ej: Guantes, Careta, Overol)" className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-base text-white" required />
                    <button type="submit" className="w-full bg-red-600 text-white font-black py-4 rounded-2xl text-sm uppercase shadow-lg">Registrar Entrega</button>
                </form>
                <form onSubmit={handleAddWasteSubmit} className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-700 space-y-5">
                    <h4 className="text-emerald-400 text-sm uppercase font-black mb-2 flex items-center gap-2"><Recycle className="w-5 h-5" /> Trazabilidad de Residuos</h4>
                    <input type="text" value={wasteDescription} onChange={e => setWasteDescription(e.target.value)} placeholder="Descripción (Ej: Envases Amistar 1L)" className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-base text-white" required />
                    <input type="number" value={wasteQty} onChange={e => setWasteQty(e.target.value)} placeholder="Cantidad" className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-base text-white" required />
                    <label className="flex items-center gap-4 p-4 bg-slate-900 rounded-2xl border border-slate-700 cursor-pointer">
                        <input type="checkbox" checked={wasteTripleWashed} onChange={e => setWasteTripleWashed(e.target.checked)} className="h-6 w-6 rounded-lg text-emerald-500 bg-slate-800 border-slate-600 focus:ring-emerald-500"/>
                        <span className="text-sm font-bold text-white flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500"/> ¿Triple Lavado y Perforado?</span>
                    </label>
                    <button type="submit" className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl text-sm uppercase shadow-lg">Registrar Disposición</button>
                </form>
            </div>
        )}
    </div>
  );
};
