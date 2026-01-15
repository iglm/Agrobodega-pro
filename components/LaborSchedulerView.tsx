
import React, { useState, useMemo } from 'react';
import { PlannedLabor, CostCenter, Activity, BudgetPlan, LaborLog, Personnel } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { CalendarRange, Plus, Calendar, Pickaxe, MapPin, Users, DollarSign, Calculator, Filter, CheckCircle2, Circle, Trash2, ArrowRight, AlertTriangle, AlertCircle, Clock, Percent, Gauge, UserCheck, Square, CheckSquare, Save, X, Wand2, Sprout, Settings2 } from 'lucide-react';
import { HeaderCard, EmptyState, Modal } from './UIElements';

interface LaborSchedulerViewProps {
  plannedLabors: PlannedLabor[];
  costCenters: CostCenter[];
  activities: Activity[];
  personnel: Personnel[]; 
  onAddPlannedLabor: (labor: Omit<PlannedLabor, 'id' | 'warehouseId' | 'completed'>) => void;
  onDeletePlannedLabor: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onAddActivity: (name: string, classification?: 'JOINT' | 'COFFEE' | 'PLANTAIN' | 'OTHER') => void;
  onAddCostCenter: (name: string) => void;
  onAddPersonnel: (name: string) => void;
  budgets?: BudgetPlan[];
  laborLogs?: LaborLog[];
  laborFactor?: number;
}

export const LaborSchedulerView: React.FC<LaborSchedulerViewProps> = ({
  plannedLabors,
  costCenters,
  activities,
  personnel,
  onAddPlannedLabor,
  onDeletePlannedLabor,
  onToggleComplete,
  onAddActivity,
  onAddCostCenter,
  onAddPersonnel,
  budgets = [],
  laborLogs = [],
  laborFactor = 1.0
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<'day' | 'week' | 'month' | 'all'>('all');
  
  // Form States
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [activityId, setActivityId] = useState('');
  const [costCenterId, setCostCenterId] = useState('');
  const [targetArea, setTargetArea] = useState('');
  const [technicalYield, setTechnicalYield] = useState(''); 
  const [unitCost, setUnitCost] = useState('');
  const [efficiency, setEfficiency] = useState('100');
  const [selectedPersonnelIds, setSelectedPersonnelIds] = useState<string[]>([]);

  // Generator States (Option A)
  const [genLotId, setGenLotId] = useState('');
  const [genStartDate, setGenStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [genWeedFreq, setGenWeedFreq] = useState('45'); // Default 1.5 months
  const [genFertFreq, setGenFertFreq] = useState('60'); // Default 2 months
  const [genWeedActId, setGenWeedActId] = useState('');
  const [genFertActId, setGenFertActId] = useState('');

  // Inline Creation States
  const [isCreatingActivity, setIsCreatingActivity] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  
  const [isCreatingLot, setIsCreatingLot] = useState(false);
  const [newLotName, setNewLotName] = useState('');

  const [isCreatingPerson, setIsCreatingPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  
  const projection = useMemo(() => {
      const area = parseFloat(targetArea) || 0;
      const yieldBase = parseFloat(technicalYield) || 0; 
      const cost = parseFloat(unitCost) || 0;
      const eff = parseFloat(efficiency) || 100;
      
      if (area <= 0 || yieldBase <= 0) return { jornales: 0, totalCost: 0, people: 0, hours: 0, costPerHa: 0 };

      const realYield = yieldBase * (eff / 100);
      const totalJornales = area / realYield;
      const totalHours = totalJornales * 8;
      const totalCost = totalJornales * cost;
      const costPerHa = area > 0 ? totalCost / area : 0;
      const people = Math.ceil(totalJornales); 

      return { jornales: totalJornales, totalCost, people, hours: totalHours, costPerHa };
  }, [targetArea, technicalYield, unitCost, efficiency]);

  const togglePerson = (id: string) => {
    setSelectedPersonnelIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleCreateActivity = (e: React.MouseEvent) => {
      e.preventDefault();
      if(newActivityName.trim()) {
          onAddActivity(newActivityName, 'JOINT');
          setIsCreatingActivity(false);
          setNewActivityName('');
      }
  };

  const handleCreateLot = (e: React.MouseEvent) => {
      e.preventDefault();
      if(newLotName.trim()) {
          onAddCostCenter(newLotName);
          setIsCreatingLot(false);
          setNewLotName('');
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

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const activity = activities.find(a => a.id === activityId);
      const lot = costCenters.find(c => c.id === costCenterId);
      if (!activity || !lot) return;

      onAddPlannedLabor({
          date,
          activityId,
          activityName: activity.name,
          costCenterId,
          costCenterName: lot.name,
          targetArea: parseFloat(targetArea),
          technicalYield: parseFloat(technicalYield),
          unitCost: parseFloat(unitCost),
          efficiency: parseFloat(efficiency),
          calculatedPersonDays: projection.jornales,
          calculatedHours: projection.hours,
          calculatedTotalCost: projection.totalCost,
          assignedPersonnelIds: selectedPersonnelIds
      });
      setShowForm(false);
      setTargetArea('');
      setTechnicalYield('');
      setSelectedPersonnelIds([]);
  };

  // --- GENERATOR LOGIC ---
  const handleGeneratePlan = () => {
      if (!genLotId || !genWeedActId || !genFertActId) return;
      
      const lot = costCenters.find(c => c.id === genLotId);
      const weedAct = activities.find(a => a.id === genWeedActId);
      const fertAct = activities.find(a => a.id === genFertActId);
      
      if (!lot || !weedAct || !fertAct) return;

      const weedFreq = parseInt(genWeedFreq) || 45;
      const fertFreq = parseInt(genFertFreq) || 60;
      const area = lot.area || 1;
      
      // Default Assumptions for Levante (Can be edited later by user in the list)
      const weedYield = 0.5; // Ha/Jornal (Plateo)
      const fertYield = 1.0; // Ha/Jornal (Abonada)
      const estCost = 60000; // Estimated cost per jornal

      const tasksToAdd: any[] = [];
      const startDateObj = new Date(genStartDate);
      const limitDate = new Date(startDateObj);
      limitDate.setMonth(limitDate.getMonth() + 6); // 6 Months projection

      // Generate Weed Control Tasks
      let currentDate = new Date(startDateObj);
      currentDate.setDate(currentDate.getDate() + weedFreq); // First one after X days
      
      while (currentDate <= limitDate) {
          tasksToAdd.push({
              date: currentDate.toISOString().split('T')[0],
              activityId: weedAct.id, activityName: weedAct.name,
              costCenterId: lot.id, costCenterName: lot.name,
              targetArea: area, technicalYield: weedYield, unitCost: estCost, efficiency: 100,
              calculatedPersonDays: area / weedYield, calculatedTotalCost: (area / weedYield) * estCost
          });
          currentDate.setDate(currentDate.getDate() + weedFreq);
      }

      // Generate Fert Tasks
      currentDate = new Date(startDateObj);
      currentDate.setDate(currentDate.getDate() + fertFreq); 

      while (currentDate <= limitDate) {
          tasksToAdd.push({
              date: currentDate.toISOString().split('T')[0],
              activityId: fertAct.id, activityName: fertAct.name,
              costCenterId: lot.id, costCenterName: lot.name,
              targetArea: area, technicalYield: fertYield, unitCost: estCost, efficiency: 100,
              calculatedPersonDays: area / fertYield, calculatedTotalCost: (area / fertYield) * estCost
          });
          currentDate.setDate(currentDate.getDate() + fertFreq);
      }

      // Add all
      tasksToAdd.forEach(task => onAddPlannedLabor(task));
      setShowGenerator(false);
      alert(`✅ Se han generado ${tasksToAdd.length} labores automáticas para el lote ${lot.name}.`);
  };

  const filteredLabors = useMemo(() => {
      const today = new Date();
      today.setHours(0,0,0,0);
      return plannedLabors.filter(l => {
          const lDate = new Date(l.date);
          lDate.setHours(0,0,0,0);
          if (filterPeriod === 'day') return lDate.getTime() === today.getTime();
          if (filterPeriod === 'week') {
              const nextWeek = new Date(today);
              nextWeek.setDate(today.getDate() + 7);
              return lDate >= today && lDate <= nextWeek;
          }
          if (filterPeriod === 'month') return lDate.getMonth() === today.getMonth() && lDate.getFullYear() === today.getFullYear();
          return true;
      }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [plannedLabors, filterPeriod]);

  const totals = useMemo(() => {
      return filteredLabors.reduce((acc, l) => ({
          hectares: acc.hectares + l.targetArea,
          jornales: acc.jornales + l.calculatedPersonDays,
          hours: acc.hours + (l.calculatedHours || 0),
          cost: acc.cost + l.calculatedTotalCost
      }), { hectares: 0, jornales: 0, hours: 0, cost: 0 });
  }, [filteredLabors]);

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
        <HeaderCard 
            title="Programador de Labores"
            subtitle="Gestión Táctica de Campo"
            valueLabel="Costo Proyectado"
            value={formatCurrency(totals.cost)}
            gradientClass="bg-gradient-to-r from-violet-600 to-fuchsia-700"
            icon={CalendarRange}
            onAction={() => setShowForm(true)}
            actionLabel="Programar Labor"
            actionIcon={Plus}
            secondaryAction={
                <button onClick={() => setShowGenerator(true)} className="p-4 bg-white/20 rounded-xl text-white backdrop-blur-md border border-white/30 hover:bg-white/30 transition-all shadow-lg active:scale-95" title="Asistente de Levante Automático">
                    <Wand2 className="w-5 h-5" />
                </button>
            }
        />

        <div className="flex gap-1 bg-slate-200 dark:bg-slate-900 p-1 rounded-2xl">
            {['day', 'week', 'month', 'all'].map(p => (
                <button key={p} onClick={() => setFilterPeriod(p as any)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${filterPeriod === p ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-500'}`}>
                    {p === 'day' ? 'Hoy' : p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Todo'}
                </button>
            ))}
        </div>

        <div className="space-y-4">
            {filteredLabors.length === 0 ? (
                <EmptyState icon={Calendar} message="No hay labores programadas." />
            ) : (
                filteredLabors.map(l => (
                    <div key={l.id} className={`p-5 rounded-[2rem] border shadow-sm transition-all ${l.completed ? 'bg-slate-100 dark:bg-slate-900/50 opacity-60' : 'bg-white dark:bg-slate-800 border-violet-200 dark:border-violet-900/30'}`}>
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs ${l.completed ? 'bg-slate-400' : 'bg-violet-600'}`}>
                                    {new Date(l.date).getDate()}
                                </div>
                                <div>
                                    <h4 className={`font-black text-sm ${l.completed ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-white'}`}>{l.activityName}</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {l.costCenterName} • {l.targetArea} Ha
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-mono font-black text-slate-700 dark:text-white text-sm">{formatCurrency(l.calculatedTotalCost)}</p>
                                <p className="text-[10px] text-violet-500 font-bold uppercase">{l.calculatedPersonDays.toFixed(1)} Jor</p>
                            </div>
                        </div>

                        {l.assignedPersonnelIds && l.assignedPersonnelIds.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {l.assignedPersonnelIds.map(pid => {
                                    const p = personnel.find(x => x.id === pid);
                                    return <span key={pid} className="text-[8px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-black uppercase">{p?.name || '...'}</span>;
                                })}
                            </div>
                        )}
                        
                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3 mt-3">
                            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium">
                                <span>Rend: {l.technicalYield} Ha/Jor</span>
                                <span className="text-indigo-400">Eficiencia: {l.efficiency}%</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => onToggleComplete(l.id)} className={`p-2 rounded-lg transition-colors ${l.completed ? 'text-emerald-500 bg-emerald-100' : 'text-slate-400 hover:text-emerald-500'}`}>
                                    {l.completed ? <CheckCircle2 className="w-5 h-5"/> : <Circle className="w-5 h-5"/>}
                                </button>
                                <button onClick={() => onDeletePlannedLabor(l.id)} className="p-2 text-slate-400 hover:text-red-500">
                                    <Trash2 className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* MODAL: PROGRAMAR LABOR MANUAL */}
        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Programar Labor Manual" icon={Calendar}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Fecha Estimada</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-xs font-bold" required />
                    </div>
                    
                    {/* LOTE SELECTOR + QUICK ADD */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Lote</label>
                            <button type="button" onClick={() => setIsCreatingLot(!isCreatingLot)} className="text-[10px] font-black text-indigo-400 hover:text-white uppercase flex items-center gap-1 transition-colors">
                                {isCreatingLot ? <X className="w-3 h-3"/> : <Plus className="w-3 h-3"/>} 
                                {isCreatingLot ? 'Cancelar' : 'Crear'}
                            </button>
                        </div>
                        {isCreatingLot ? (
                            <div className="flex gap-2 animate-fade-in-down">
                                <input type="text" value={newLotName} onChange={e => setNewLotName(e.target.value)} placeholder="Nuevo Lote" className="flex-1 bg-indigo-900/20 border border-indigo-500/50 rounded-xl p-3 text-white text-sm font-bold outline-none" autoFocus />
                                <button type="button" onClick={handleCreateLot} disabled={!newLotName.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl shadow-lg transition-all"><Save className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <select value={costCenterId} onChange={e => setCostCenterId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-xs font-bold" required>
                                <option value="">Seleccionar...</option>
                                {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        )}
                    </div>
                </div>

                {/* ACTIVITY SELECTOR + QUICK ADD */}
                <div className="space-y-1">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Labor / Actividad</label>
                        <button type="button" onClick={() => setIsCreatingActivity(!isCreatingActivity)} className="text-[10px] font-black text-indigo-400 hover:text-white uppercase flex items-center gap-1 transition-colors">
                            {isCreatingActivity ? <X className="w-3 h-3"/> : <Plus className="w-3 h-3"/>} 
                            {isCreatingActivity ? 'Cancelar' : 'Crear'}
                        </button>
                    </div>
                    {isCreatingActivity ? (
                        <div className="flex gap-2 animate-fade-in-down">
                            <input type="text" value={newActivityName} onChange={e => setNewActivityName(e.target.value)} placeholder="Nueva Labor (Ej: Poda)" className="flex-1 bg-indigo-900/20 border border-indigo-500/50 rounded-xl p-3 text-white text-sm font-bold outline-none" autoFocus />
                            <button type="button" onClick={handleCreateActivity} disabled={!newActivityName.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl shadow-lg transition-all"><Save className="w-4 h-4" /></button>
                        </div>
                    ) : (
                        <select value={activityId} onChange={e => setActivityId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-xs font-bold" required>
                            <option value="">Seleccionar...</option>
                            {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    )}
                </div>

                {/* TECH PARAMS */}
                <div className="grid grid-cols-2 gap-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Área Meta (Ha)</label>
                        <input type="number" step="0.1" value={targetArea} onChange={e => setTargetArea(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm" required placeholder="0.0" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Rend. (Ha/Jornal)</label>
                        <input type="number" step="0.1" value={technicalYield} onChange={e => setTechnicalYield(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm" required placeholder="0.0" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Costo Unit. Est.</label>
                        <input type="number" value={unitCost} onChange={e => setUnitCost(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-emerald-400 font-mono text-sm" required placeholder="$" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Eficiencia %</label>
                        <input type="number" value={efficiency} onChange={e => setEfficiency(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm" required placeholder="100" />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                        <label className="block text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><Users className="w-3 h-3" /> Asignar Personal (Opcional)</label>
                        <button type="button" onClick={() => setIsCreatingPerson(!isCreatingPerson)} className="text-[10px] font-black text-indigo-400 hover:text-white uppercase flex items-center gap-1 transition-colors">
                            {isCreatingPerson ? <X className="w-3 h-3"/> : <Plus className="w-3 h-3"/>} {isCreatingPerson ? 'Cancelar' : 'Crear'}
                        </button>
                    </div>
                    {isCreatingPerson ? (
                        <div className="flex gap-2 animate-fade-in-down mb-2">
                            <input type="text" value={newPersonName} onChange={e => setNewPersonName(e.target.value)} placeholder="Nuevo Trabajador" className="flex-1 bg-indigo-900/20 border border-indigo-500/50 rounded-xl p-3 text-white text-sm font-bold outline-none" autoFocus />
                            <button type="button" onClick={handleCreatePerson} disabled={!newPersonName.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl shadow-lg transition-all"><Save className="w-4 h-4" /></button>
                        </div>
                    ) : (
                        <div className="max-h-32 overflow-y-auto custom-scrollbar bg-slate-900 border border-slate-700 rounded-xl p-2 space-y-1">
                            {personnel.map(p => {
                                const isSelected = selectedPersonnelIds.includes(p.id);
                                return (
                                    <div key={p.id} onClick={() => togglePerson(p.id)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-violet-900/40 border border-violet-500/50' : 'hover:bg-slate-800'}`}>
                                        {isSelected ? <CheckSquare className="w-4 h-4 text-violet-400" /> : <Square className="w-4 h-4 text-slate-500" />}
                                        <span className={`text-xs font-bold ${isSelected ? 'text-violet-200' : 'text-slate-400'}`}>{p.name}</span>
                                    </div>
                                )
                            })}
                            {personnel.length === 0 && <p className="text-center text-[10px] text-slate-500 py-2">Sin personal registrado.</p>}
                        </div>
                    )}
                </div>

                <div className="bg-emerald-900/20 p-4 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-emerald-400 font-black uppercase">Costo Estimado</p>
                        <p className="text-[9px] text-slate-400 font-bold">{projection.jornales.toFixed(1)} Jornales</p>
                    </div>
                    <p className="text-xl font-mono font-black text-white">{formatCurrency(projection.totalCost)}</p>
                </div>

                <button type="submit" className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                    Guardar Planificación
                </button>
            </form>
        </Modal>

        {/* MODAL: GENERADOR AUTOMÁTICO DE LEVANTE (OPTION A) */}
        <Modal isOpen={showGenerator} onClose={() => setShowGenerator(false)} title="Asistente de Planificación" icon={Sprout} maxWidth="max-w-lg">
            <div className="space-y-6">
                <div className="bg-indigo-900/20 p-4 rounded-2xl border border-indigo-500/30 flex gap-3">
                    <Wand2 className="w-8 h-8 text-indigo-400 shrink-0" />
                    <div>
                        <h4 className="text-sm font-bold text-white mb-1">Piloto Automático de Levante</h4>
                        <p className="text-[10px] text-indigo-200 leading-relaxed">
                            Genere automáticamente el cronograma de <strong>Control de Arvenses</strong> y <strong>Fertilización</strong> para los próximos 6 meses, siguiendo las mejores prácticas técnicas.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Lote Objetivo (Levante)</label>
                        <select value={genLotId} onChange={e => setGenLotId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-xs font-bold" required>
                            <option value="">Seleccionar Lote...</option>
                            {costCenters.map(c => <option key={c.id} value={c.id}>{c.name} ({c.stage})</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Fecha de Inicio / Siembra</label>
                        <input type="date" value={genStartDate} onChange={e => setGenStartDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-xs font-bold" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                        <div className="space-y-3">
                            <h5 className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1"><Settings2 className="w-3 h-3"/> Arvenses</h5>
                            <div className="space-y-1">
                                <label className="text-[9px] text-slate-400 uppercase font-bold">Frecuencia (Días)</label>
                                <input type="number" value={genWeedFreq} onChange={e => setGenWeedFreq(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-sm font-bold text-center" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] text-slate-400 uppercase font-bold">Labor</label>
                                <select value={genWeedActId} onChange={e => setGenWeedActId(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-[10px]">
                                    <option value="">Seleccionar...</option>
                                    {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h5 className="text-[10px] font-black text-blue-500 uppercase flex items-center gap-1"><Settings2 className="w-3 h-3"/> Fertilización</h5>
                            <div className="space-y-1">
                                <label className="text-[9px] text-slate-400 uppercase font-bold">Frecuencia (Días)</label>
                                <input type="number" value={genFertFreq} onChange={e => setGenFertFreq(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-sm font-bold text-center" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] text-slate-400 uppercase font-bold">Labor</label>
                                <select value={genFertActId} onChange={e => setGenFertActId(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-[10px]">
                                    <option value="">Seleccionar...</option>
                                    {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <button onClick={handleGeneratePlan} disabled={!genLotId || !genWeedActId || !genFertActId} className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Wand2 className="w-4 h-4" /> Generar Ciclo de Levante
                </button>
            </div>
        </Modal>
    </div>
  );
};
