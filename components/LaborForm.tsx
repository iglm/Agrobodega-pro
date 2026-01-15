
import React, { useState, useMemo, useEffect } from 'react';
import { Personnel, CostCenter, Activity, LaborLog } from '../types';
import { X, Save, DollarSign, Calendar, User, MapPin, Pickaxe, AlertCircle, Users, CheckSquare, Square, Ruler, Clock, Calculator, Zap, Wand2, Gauge, Percent, TrendingUp, Plus } from 'lucide-react';
import { formatNumberInput, parseNumberInput, formatCurrency } from '../services/inventoryService';

interface LaborFormProps {
  personnel: Personnel[];
  costCenters: CostCenter[];
  activities: Activity[];
  onSave: (log: Omit<LaborLog, 'id' | 'warehouseId' | 'paid'>) => void;
  onCancel: () => void;
  onOpenSettings: () => void;
  onAddPersonnel: (name: string) => void;
  onAddCostCenter: (name: string) => void;
  onAddActivity: (name: string) => void;
}

export const LaborForm: React.FC<LaborFormProps> = ({ 
  personnel, 
  costCenters, 
  activities, 
  onSave, 
  onCancel,
  onOpenSettings,
  onAddPersonnel,
  onAddCostCenter,
  onAddActivity
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPersonnelIds, setSelectedPersonnelIds] = useState<string[]>([]);
  const [costCenterId, setCostCenterId] = useState('');
  const [activityId, setActivityId] = useState('');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  
  // CAMPOS TECNICOS Y RENDIMIENTO
  const [areaWorked, setAreaWorked] = useState('');
  const [timeUnit, setTimeUnit] = useState<'JORNAL' | 'HORA'>('JORNAL');
  const [timeQuantity, setTimeQuantity] = useState('1');
  const [efficiency, setEfficiency] = useState('100');
  
  const [techYield, setTechYield] = useState('');
  const [yieldUnit, setYieldUnit] = useState<'Ha/Jornal' | 'Ha/Hora'>('Ha/Jornal');

  // STATES PARA CREACIÓN RÁPIDA
  const [isCreatingLot, setIsCreatingLot] = useState(false);
  const [newLotName, setNewLotName] = useState('');

  const [isCreatingActivity, setIsCreatingActivity] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');

  const [isCreatingPerson, setIsCreatingPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');

  const togglePerson = (id: string) => {
    setSelectedPersonnelIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedPersonnelIds.length === personnel.length) {
      setSelectedPersonnelIds([]);
    } else {
      setSelectedPersonnelIds(personnel.map(p => p.id));
    }
  };

  // HANDLERS CREACIÓN RÁPIDA
  const handleCreateLot = (e: React.MouseEvent) => {
      e.preventDefault();
      if(newLotName.trim()) {
          onAddCostCenter(newLotName);
          setIsCreatingLot(false);
          setNewLotName('');
      }
  };

  const handleCreateActivity = (e: React.MouseEvent) => {
      e.preventDefault();
      if(newActivityName.trim()) {
          onAddActivity(newActivityName);
          setIsCreatingActivity(false);
          setNewActivityName('');
      }
  };

  const handleCreatePerson = (e: React.MouseEvent) => {
      e.preventDefault();
      if(newPersonName.trim()) {
          onAddPersonnel(newPersonName);
          setIsCreatingPerson(false);
          setNewPersonName('');
      }
  };

  // Función Proyectar: Tiempo = Area / (Rendimiento * Eficiencia)
  const handleProjectTime = () => {
      const area = parseNumberInput(areaWorked);
      const yieldVal = parseNumberInput(techYield);
      const effFactor = parseNumberInput(efficiency) / 100 || 1;
      const peopleCount = selectedPersonnelIds.length;

      if (area > 0 && yieldVal > 0 && peopleCount > 0) {
          const adjustedYield = yieldVal * effFactor;
          const totalTimeRequired = area / adjustedYield;
          const timePerPerson = totalTimeRequired / peopleCount;
          
          if (yieldUnit === 'Ha/Jornal') {
              setTimeUnit('JORNAL');
              setTimeQuantity(timePerPerson.toFixed(2).replace('.', ','));
          } else {
              setTimeUnit('HORA');
              setTimeQuantity(timePerPerson.toFixed(2).replace('.', ','));
          }
      }
  };

  const stats = useMemo(() => {
    const area = parseNumberInput(areaWorked);
    const timePerPerson = parseNumberInput(timeQuantity);
    const costPerPerson = parseNumberInput(value);
    const nPeople = selectedPersonnelIds.length;
    
    if (timePerPerson <= 0 || nPeople === 0) return { totalHours: 0, totalJornales: 0, yield: 0, totalValue: 0, costPerHa: 0 };

    // Días/Hombre totales del equipo
    const jEquivalentPerPerson = timeUnit === 'JORNAL' ? timePerPerson : timePerPerson / 8;
    const totalJornalesTeam = jEquivalentPerPerson * nPeople;
    const totalHoursTeam = totalJornalesTeam * 8;
    
    // Rendimiento real obtenido
    const yieldHaJornal = totalJornalesTeam > 0 ? area / totalJornalesTeam : 0;
    
    // Costos
    const totalCost = costPerPerson * nPeople;
    const costPerHa = area > 0 ? totalCost / area : 0;

    return { totalHours: totalHoursTeam, totalJornales: totalJornalesTeam, yield: yieldHaJornal, totalValue: totalCost, costPerHa };
  }, [areaWorked, timeQuantity, timeUnit, value, selectedPersonnelIds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalValue = parseNumberInput(value);
    if (selectedPersonnelIds.length === 0 || !costCenterId || !activityId || finalValue <= 0) return;

    const selectedCenter = costCenters.find(c => c.id === costCenterId);
    const selectedActivity = activities.find(a => a.id === activityId);

    if (!selectedCenter || !selectedActivity) return;

    selectedPersonnelIds.forEach(personId => {
        const person = personnel.find(p => p.id === personId);
        if (person) {
            onSave({
                date,
                personnelId: personId,
                personnelName: person.name,
                costCenterId,
                costCenterName: selectedCenter.name,
                activityId,
                activityName: selectedActivity.name,
                value: finalValue,
                notes: notes.trim(),
                areaWorked: parseNumberInput(areaWorked) / selectedPersonnelIds.length,
                hoursWorked: timeUnit === 'HORA' ? parseNumberInput(timeQuantity) : parseNumberInput(timeQuantity) * 8,
                jornalesEquivalent: timeUnit === 'JORNAL' ? parseNumberInput(timeQuantity) : parseNumberInput(timeQuantity) / 8,
                performanceYieldHaJornal: stats.yield
            });
        }
    });
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[95vh]">
        
        <div className="bg-amber-50 dark:bg-amber-900/20 p-6 border-b border-amber-200 dark:border-amber-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             <div className="bg-amber-500 p-2.5 rounded-xl shadow-lg">
                <Users className="w-5 h-5 text-white" />
             </div>
             <div>
                <h3 className="text-slate-800 dark:text-white font-black text-xl leading-none">Registrar Jornales</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-1">Ingeniería de Mano de Obra</p>
             </div>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1"><Calendar className="w-3 h-3" /> Fecha</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-white font-bold text-xs" required />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><MapPin className="w-3 h-3" /> Lote</label>
                    <button type="button" onClick={() => setIsCreatingLot(!isCreatingLot)} className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase flex items-center gap-1 transition-colors">
                        {isCreatingLot ? <X className="w-3 h-3"/> : <Plus className="w-3 h-3"/>} {isCreatingLot ? 'Cancelar' : 'Crear'}
                    </button>
                </div>
                {isCreatingLot ? (
                    <div className="flex gap-2 animate-fade-in-down">
                        <input type="text" value={newLotName} onChange={e => setNewLotName(e.target.value)} placeholder="Nuevo Lote" className="flex-1 bg-indigo-900/20 border border-indigo-500/50 rounded-xl p-3 text-white text-sm font-bold outline-none" autoFocus />
                        <button type="button" onClick={handleCreateLot} disabled={!newLotName.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl shadow-lg transition-all"><Save className="w-4 h-4" /></button>
                    </div>
                ) : (
                    <select value={costCenterId} onChange={e => setCostCenterId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-white text-xs font-bold" required>
                      <option value="">Seleccionar...</option>
                      {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                )}
              </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><Pickaxe className="w-3 h-3" /> Labor Realizada</label>
                <button type="button" onClick={() => setIsCreatingActivity(!isCreatingActivity)} className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase flex items-center gap-1 transition-colors">
                    {isCreatingActivity ? <X className="w-3 h-3"/> : <Plus className="w-3 h-3"/>} {isCreatingActivity ? 'Cancelar' : 'Crear'}
                </button>
            </div>
            {isCreatingActivity ? (
                <div className="flex gap-2 animate-fade-in-down">
                    <input type="text" value={newActivityName} onChange={e => setNewActivityName(e.target.value)} placeholder="Nueva Labor" className="flex-1 bg-indigo-900/20 border border-indigo-500/50 rounded-xl p-3 text-white text-sm font-bold outline-none" autoFocus />
                    <button type="button" onClick={handleCreateActivity} disabled={!newActivityName.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl shadow-lg transition-all"><Save className="w-4 h-4" /></button>
                </div>
            ) : (
                <select value={activityId} onChange={e => setActivityId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-4 text-slate-800 dark:text-white text-sm font-bold" required>
                    <option value="">Seleccionar Labor...</option>
                    {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
            )}
          </div>

          {/* CALCULADORA TÉCNICA DE DÍAS/HOMBRE */}
          <div className="bg-indigo-950/20 p-6 rounded-[2.5rem] border border-indigo-500/20 space-y-4">
              <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                      <Calculator className="w-4 h-4" /> Cálculo de Jornales
                  </h4>
                  <div className="bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Precisión D/H</div>
              </div>

              <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1"><Ruler className="w-3 h-3" /> Área Trab. (Ha)</label>
                        <input type="text" inputMode="decimal" value={areaWorked} onChange={e => setAreaWorked(formatNumberInput(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-black text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0,0" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-black text-indigo-400 uppercase ml-1 flex items-center gap-1"><Gauge className="w-3 h-3" /> Rend. Técnico</label>
                        <div className="flex">
                            <input type="text" inputMode="decimal" value={techYield} onChange={e => setTechYield(formatNumberInput(e.target.value))} className="w-full bg-slate-900 border-y border-l border-indigo-900/50 rounded-l-xl p-3 text-white font-black text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0,0" />
                            <button type="button" onClick={() => setYieldUnit(yieldUnit === 'Ha/Jornal' ? 'Ha/Hora' : 'Ha/Jornal')} className="bg-indigo-900/40 border border-indigo-900/50 px-2 rounded-r-xl text-[8px] font-black text-indigo-300 uppercase whitespace-nowrap">{yieldUnit}</button>
                        </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-end">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1"><Percent className="w-3 h-3" /> Eficiencia Lote (%)</label>
                        <input type="number" value={efficiency} onChange={e => setEfficiency(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-black text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="100" />
                      </div>
                      <button type="button" onClick={handleProjectTime} disabled={!areaWorked || !techYield || selectedPersonnelIds.length === 0} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"><Wand2 className="w-3.5 h-3.5" /> Proyectar D/H</button>
                  </div>

                  <div className="h-px bg-slate-800 my-4"></div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-black text-amber-500 uppercase ml-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Tiempo Real x Persona</label>
                    <div className="flex">
                        <input type="text" inputMode="decimal" value={timeQuantity} onChange={e => setTimeQuantity(formatNumberInput(e.target.value))} className="w-full bg-slate-900 border-y border-l border-slate-700 rounded-l-xl p-4 text-white font-black text-lg outline-none" />
                        <button type="button" onClick={() => setTimeUnit(timeUnit === 'JORNAL' ? 'HORA' : 'JORNAL')} className="bg-slate-800 border border-slate-700 px-4 rounded-r-xl text-[9px] font-black text-amber-500 uppercase">{timeUnit}S</button>
                    </div>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                   <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex flex-col items-center">
                        <span className="text-[8px] text-slate-500 font-black uppercase">Rendimiento Ha/Jor</span>
                        <span className="text-base font-black text-emerald-500 font-mono">{stats.yield.toFixed(3)}</span>
                   </div>
                   <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex flex-col items-center">
                        <span className="text-[8px] text-slate-500 font-black uppercase">Costo por Hectárea</span>
                        <span className="text-base font-black text-indigo-400 font-mono">{formatCurrency(stats.costPerHa)}</span>
                   </div>
              </div>
          </div>

          <div className="space-y-2">
             <div className="flex justify-between items-center px-1">
                 <label className="block text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><Users className="w-3 h-3" /> Equipo de Trabajo ({selectedPersonnelIds.length})</label>
                 <div className="flex gap-2">
                    <button type="button" onClick={() => setIsCreatingPerson(!isCreatingPerson)} className="text-[10px] text-emerald-500 font-black uppercase hover:text-emerald-400 tracking-tighter flex items-center gap-1">
                        {isCreatingPerson ? <X className="w-3 h-3"/> : <Plus className="w-3 h-3"/>} {isCreatingPerson ? 'Cancelar' : 'Nuevo'}
                    </button>
                    <button type="button" onClick={selectAll} className="text-[10px] text-amber-500 font-black uppercase hover:text-amber-400 tracking-tighter">{selectedPersonnelIds.length === personnel.length ? 'Limpiar' : 'Todos'}</button>
                 </div>
             </div>
             
             {isCreatingPerson && (
                <div className="flex gap-2 animate-fade-in-down mb-2">
                    <input type="text" value={newPersonName} onChange={e => setNewPersonName(e.target.value)} placeholder="Nombre Nuevo Trabajador" className="flex-1 bg-indigo-900/20 border border-indigo-500/50 rounded-xl p-3 text-white text-sm font-bold outline-none" autoFocus />
                    <button type="button" onClick={handleCreatePerson} disabled={!newPersonName.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl shadow-lg transition-all"><Save className="w-4 h-4" /></button>
                </div>
             )}

             <div className="max-h-40 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 space-y-1">
                 {personnel.map(p => {
                     const isSelected = selectedPersonnelIds.includes(p.id);
                     return (
                         <div key={p.id} onClick={() => togglePerson(p.id)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-amber-100 dark:bg-amber-900/30' : 'hover:bg-slate-200 dark:hover:bg-slate-900'}`}>
                             {isSelected ? <CheckSquare className="w-4 h-4 text-amber-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                             <span className={`text-xs font-bold ${isSelected ? 'text-amber-900 dark:text-amber-100' : 'text-slate-600'}`}>{p.name}</span>
                         </div>
                     )
                 })}
                 {personnel.length === 0 && !isCreatingPerson && <p className="text-center text-[10px] text-slate-400 py-4">No hay personal registrado.</p>}
             </div>
          </div>

          <div className="space-y-4">
             <div>
                <label className="block text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Valor Pago Neto x Persona</label>
                <input type="text" inputMode="decimal" value={value} onChange={e => setValue(formatNumberInput(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-3xl font-black" placeholder="$ 0" required />
             </div>

             <div className="p-5 bg-indigo-900/20 rounded-[2rem] border border-indigo-500/20 flex items-center justify-between">
                <div>
                    <p className="text-[10px] text-indigo-300 font-black uppercase">Liquidación Total</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">{stats.totalJornales.toFixed(2)} Días/Hombre totales</p>
                </div>
                <p className="text-2xl font-mono font-black text-white">{formatCurrency(stats.totalValue)}</p>
             </div>

             <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-slate-800 dark:text-white outline-none text-xs font-medium resize-none" placeholder="Observaciones de la labor (opcional)..." rows={2} />
          </div>

        </form>

        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 shrink-0">
            <button onClick={handleSubmit} disabled={!value || selectedPersonnelIds.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:bg-slate-600 text-white font-black py-5 px-4 rounded-[2rem] flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-900/40 active:scale-95">
                <Zap className="w-5 h-5" /> REGISTRAR {selectedPersonnelIds.length > 1 ? `(${selectedPersonnelIds.length}) JORNALES` : 'LABOR'}
            </button>
        </div>

      </div>
    </div>
  );
};
