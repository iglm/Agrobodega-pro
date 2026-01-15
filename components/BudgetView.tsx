
import React, { useState, useMemo, useEffect } from 'react';
import { BudgetPlan, CostCenter, Activity, InventoryItem, BudgetItem, LaborLog, Movement } from '../types';
import { formatCurrency, generateId } from '../services/inventoryService';
import { Calculator, Plus, Trash2, Save, Calendar, TrendingUp, Pickaxe, Package, ArrowRight, BarChart3, AlertCircle, CheckCircle2, Target, Gauge, MousePointer2, TrendingDown, Info, DollarSign, ChevronRight, X } from 'lucide-react';
import { HeaderCard, Modal } from './UIElements';

interface BudgetViewProps {
  budgets: BudgetPlan[];
  costCenters: CostCenter[];
  activities: Activity[];
  inventory: InventoryItem[];
  warehouseId: string;
  onSaveBudget: (budget: BudgetPlan) => void;
  onAddCostCenter: (name: string) => void;
  laborLogs?: LaborLog[];
  movements?: Movement[];
  laborFactor?: number;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  budgets,
  costCenters,
  activities,
  inventory,
  warehouseId,
  onSaveBudget,
  onAddCostCenter,
  laborLogs = [],
  movements = [],
  laborFactor = 1.0
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedLotId, setSelectedLotId] = useState(costCenters[0]?.id || '');
  const [viewMode, setViewMode] = useState<'plan' | 'control'>('plan');
  const [activeBudget, setActiveBudget] = useState<BudgetPlan | null>(null);
  
  // UI States
  const [showAddItem, setShowAddItem] = useState(false);
  const [addItemType, setAddItemType] = useState<'LABOR' | 'SUPPLY'>('LABOR');
  const [selectedConceptId, setSelectedConceptId] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [qtyPerHa, setQtyPerHa] = useState('');
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);

  // Quick Create Lot State
  const [isCreatingLot, setIsCreatingLot] = useState(false);
  const [newLotName, setNewLotName] = useState('');

  useEffect(() => {
    if (!selectedLotId && costCenters.length > 0) {
        setSelectedLotId(costCenters[0].id);
    }
  }, [costCenters, selectedLotId]);

  useEffect(() => {
    if (!selectedLotId) return;
    const existing = budgets.find(b => b.warehouseId === warehouseId && b.year === selectedYear && b.costCenterId === selectedLotId);
    if (existing) {
        setActiveBudget(JSON.parse(JSON.stringify(existing)));
    } else {
        setActiveBudget({ id: generateId(), warehouseId, year: selectedYear, costCenterId: selectedLotId, items: [] });
    }
  }, [selectedYear, selectedLotId, budgets, warehouseId]);

  const selectedLot = costCenters.find(c => c.id === selectedLotId);
  const lotArea = selectedLot?.area || 1;
  const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

  const handleCreateLot = () => {
      if (newLotName.trim()) {
          onAddCostCenter(newLotName);
          setIsCreatingLot(false);
          setNewLotName('');
      }
  };

  // --- ENGINE DE CÁLCULO MENSUAL (PLAN vs REAL) ---
  const financialData = useMemo(() => {
      const planFlow = Array(12).fill(0);
      const realFlow = Array(12).fill(0);
      let totalLaborPlan = 0;
      let totalSupplyPlan = 0;

      // 1. Proyectar Plan
      if (activeBudget) {
          activeBudget.items.forEach(item => {
              const costPerEvent = item.unitCost * item.quantityPerHa * lotArea;
              item.months.forEach(mIdx => {
                  planFlow[mIdx] += costPerEvent;
                  if (item.type === 'LABOR') totalLaborPlan += costPerEvent;
                  else totalSupplyPlan += costPerEvent;
              });
          });
      }

      // 2. Calcular Ejecución Real (Mensualizada)
      laborLogs.filter(l => l.costCenterId === selectedLotId && new Date(l.date).getFullYear() === selectedYear)
          .forEach(l => {
              const mIdx = new Date(l.date).getMonth();
              realFlow[mIdx] += (l.value * laborFactor);
          });

      movements.filter(m => m.costCenterId === selectedLotId && m.type === 'OUT' && new Date(m.date).getFullYear() === selectedYear)
          .forEach(m => {
              const mIdx = new Date(m.date).getMonth();
              realFlow[mIdx] += m.calculatedCost;
          });

      const maxVal = Math.max(...planFlow, ...realFlow, 1);

      return { planFlow, realFlow, totalLaborPlan, totalSupplyPlan, maxVal };
  }, [activeBudget, lotArea, laborLogs, movements, selectedLotId, selectedYear, laborFactor]);

  // --- RENDERIZADO DE GRÁFICAS SVG ---
  const renderFlowChart = () => {
      const { planFlow, maxVal } = financialData;
      const width = 1000;
      const height = 200;
      const padding = 40;
      const chartWidth = width - padding * 2;
      const chartHeight = height - padding * 2;

      // Generar puntos para el área del gráfico
      const points = planFlow.map((amount, i) => {
          const x = padding + (i * (chartWidth / 11));
          const y = height - padding - (amount / maxVal * chartHeight);
          return { x, y, amount };
      });

      const pathData = points.reduce((acc, p, i) => 
          i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, "");

      const areaData = `${pathData} L ${points[11].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

      return (
          <div className="bg-slate-900/80 p-8 rounded-[3rem] border border-slate-700 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5"><TrendingUp className="w-40 h-40 text-emerald-500" /></div>
              <div className="relative z-10">
                  <div className="flex justify-between items-center mb-8">
                      <h4 className="text-white font-black text-xs uppercase tracking-[0.3em] flex items-center gap-3">
                         <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Flujo de Inversión Proyectado {selectedYear}
                      </h4>
                      <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2"><div className="w-3 h-1 bg-emerald-500 rounded-full"/> <span className="text-[9px] text-slate-400 font-black uppercase">Presupuesto</span></div>
                      </div>
                  </div>
                  
                  <div className="w-full overflow-x-auto scrollbar-hide">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[800px] overflow-visible">
                        <defs>
                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        
                        {/* Ejes y líneas de guía */}
                        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" strokeWidth="1" />
                        {[0, 0.25, 0.5, 0.75, 1].map(v => (
                            <line key={v} x1={padding} y1={height - padding - (v * chartHeight)} x2={width - padding} y2={height - padding - (v * chartHeight)} stroke="#1e293b" strokeDasharray="4 4" />
                        ))}

                        {/* Área y Línea */}
                        <path d={areaData} fill="url(#areaGradient)" className="transition-all duration-1000" />
                        <path d={pathData} fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-1000" />

                        {/* Puntos y Etiquetas */}
                        {points.map((p, i) => (
                            <g key={i} className="group/point">
                                <circle cx={p.x} cy={p.y} r="6" fill="#10b981" className={`transition-all ${p.amount > 0 ? 'opacity-100' : 'opacity-0'}`} />
                                <text x={p.x} y={height - 15} textAnchor="middle" className="text-[12px] font-black fill-slate-500">{months[i]}</text>
                                {p.amount > 0 && (
                                    <g className="opacity-0 group-hover/point:opacity-100 transition-opacity">
                                        <rect x={p.x - 40} y={p.y - 45} width="80" height="30" rx="8" fill="#1e293b" stroke="#334155" />
                                        <text x={p.x} y={p.y - 25} textAnchor="middle" className="text-[10px] font-mono font-bold fill-emerald-400">{formatCurrency(p.amount)}</text>
                                    </g>
                                )}
                            </g>
                        ))}
                    </svg>
                  </div>
              </div>
          </div>
      );
  };

  const renderControlChart = () => {
      const { planFlow, realFlow, maxVal } = financialData;
      return (
          <div className="bg-slate-900/80 p-8 rounded-[3rem] border border-slate-700 shadow-2xl space-y-8 animate-fade-in">
              <div className="flex justify-between items-center">
                  <h4 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-indigo-400" /> Monitor Mensual de Ejecución
                  </h4>
                  <div className="flex gap-4">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-700 rounded-sm"/> <span className="text-[9px] text-slate-400 font-black uppercase">Plan</span></div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500 rounded-sm"/> <span className="text-[9px] text-slate-400 font-black uppercase">Real</span></div>
                  </div>
              </div>

              <div className="flex items-end justify-between gap-2 h-48 overflow-x-auto pb-4 scrollbar-hide">
                  {months.map((m, i) => {
                      const pHeight = (planFlow[i] / maxVal) * 100;
                      const rHeight = (realFlow[i] / maxVal) * 100;
                      const isOver = realFlow[i] > planFlow[i] && planFlow[i] > 0;
                      return (
                          <div key={m} className="flex-1 flex flex-col items-center gap-3 min-w-[50px] group relative">
                              <div className="w-full flex items-end justify-center gap-1 h-32">
                                  {/* Barra Plan */}
                                  <div className="w-3 bg-slate-800 rounded-t-sm transition-all duration-700" style={{ height: `${pHeight}%` }} />
                                  {/* Barra Real */}
                                  <div className={`w-3 rounded-t-sm transition-all duration-700 ${isOver ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-indigo-500'}`} style={{ height: `${rHeight}%` }} />
                              </div>
                              <span className="text-[9px] font-black text-slate-500">{m}</span>
                              
                              {/* Tooltip comparativo */}
                              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all z-20 pointer-events-none whitespace-nowrap shadow-2xl">
                                  <p className="text-[8px] text-slate-400 font-bold uppercase">Plan: {formatCurrency(planFlow[i])}</p>
                                  <p className={`text-[9px] font-black ${isOver ? 'text-red-400' : 'text-indigo-400'}`}>Real: {formatCurrency(realFlow[i])}</p>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      );
  };

  const handleAddItem = (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeBudget || !selectedConceptId || !qtyPerHa || !unitCost || selectedMonths.length === 0) return;
      const conceptName = addItemType === 'LABOR' 
          ? activities.find(a => a.id === selectedConceptId)?.name 
          : inventory.find(i => i.id === selectedConceptId)?.name;

      const newItem: BudgetItem = {
          id: generateId(), type: addItemType, conceptId: selectedConceptId,
          conceptName: conceptName || 'Desconocido', unitCost: parseFloat(unitCost),
          quantityPerHa: parseFloat(qtyPerHa), months: selectedMonths
      };

      setActiveBudget({ ...activeBudget, items: [...activeBudget.items, newItem] });
      setShowAddItem(false); setUnitCost(''); setQtyPerHa(''); setSelectedMonths([]); setSelectedConceptId('');
  };

  const handleRemoveItem = (itemId: string) => {
      if (!activeBudget) return;
      setActiveBudget({ ...activeBudget, items: activeBudget.items.filter(i => i.id !== itemId) });
  };

  const toggleMonth = (idx: number) => {
      setSelectedMonths(prev => prev.includes(idx) ? prev.filter(m => m !== idx) : [...prev, idx]);
  };

  const handleSaveChanges = () => {
      if (activeBudget) { onSaveBudget(activeBudget); alert('Presupuesto guardado exitosamente.'); }
  };

  if (!selectedLot && !isCreatingLot && costCenters.length === 0) {
      // Allow creation if no lots exist
      // We handle this via the main conditional rendering below which will show creation UI
  }

  const grandTotalPlanned = financialData.totalLaborPlan + financialData.totalSupplyPlan;
  const executionTotalReal = financialData.realFlow.reduce((a, b) => a + b, 0);
  const percentExecuted = grandTotalPlanned > 0 ? (executionTotalReal / grandTotalPlanned) * 100 : 0;

  return (
    <div className="space-y-8 pb-32 animate-fade-in">
        <HeaderCard 
            title={viewMode === 'plan' ? "Presupuesto Anual" : "Control Financiero"}
            subtitle={`Hacienda Tabares Franco • ${selectedLot?.name || 'Nuevo Lote'}`}
            valueLabel={viewMode === 'plan' ? "Inversión Planeada" : "Ejecución Real"}
            value={viewMode === 'plan' ? formatCurrency(grandTotalPlanned) : formatCurrency(executionTotalReal)}
            gradientClass="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950"
            icon={Calculator}
            onAction={viewMode === 'plan' ? handleSaveChanges : () => {}}
            actionLabel={viewMode === 'plan' ? "Guardar Estructura" : `${percentExecuted.toFixed(1)}% Ejecutado`}
            actionIcon={viewMode === 'plan' ? Save : Gauge}
        />

        {/* CONTROLS BAR */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex gap-4 items-center w-full md:w-auto">
                <div className="bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-2xl flex items-center gap-2 border dark:border-slate-700">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="bg-transparent font-black text-sm text-slate-700 dark:text-white border-none outline-none cursor-pointer"><option value={currentYear}>{currentYear}</option><option value={currentYear + 1}>{currentYear + 1}</option></select>
                </div>
                <div className="h-10 w-px bg-slate-200 dark:bg-slate-700"></div>
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase block">Lote / Unidad de Costo</label>
                        <button 
                            onClick={() => setIsCreatingLot(!isCreatingLot)} 
                            className="text-[9px] font-black text-indigo-500 uppercase hover:text-indigo-400 transition-colors flex items-center gap-1"
                        >
                            {isCreatingLot ? <X className="w-3 h-3"/> : <Plus className="w-3 h-3"/>}
                            {isCreatingLot ? 'Cancelar' : 'Crear Nuevo'}
                        </button>
                    </div>
                    
                    {isCreatingLot ? (
                        <div className="flex gap-2 items-center animate-fade-in-down">
                            <input 
                                type="text" 
                                value={newLotName} 
                                onChange={e => setNewLotName(e.target.value)} 
                                placeholder="Nombre Nuevo Lote" 
                                className="flex-1 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/30 rounded-lg px-3 py-2 text-sm font-bold outline-none text-slate-800 dark:text-white placeholder-indigo-300"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateLot()}
                            />
                            <button 
                                onClick={handleCreateLot} 
                                disabled={!newLotName.trim()}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg shadow-md disabled:opacity-50 transition-colors"
                            >
                                <Save className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <select value={selectedLotId} onChange={e => setSelectedLotId(e.target.value)} className="w-full bg-transparent font-black text-xl text-slate-800 dark:text-white border-none outline-none cursor-pointer">
                            {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    )}
                </div>
            </div>
            
            <div className="flex p-1.5 bg-slate-100 dark:bg-slate-900 rounded-[1.5rem] shadow-inner border dark:border-slate-800">
                <button onClick={() => setViewMode('plan')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'plan' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-lg' : 'text-slate-500'}`}><Target className="w-4 h-4" /> Planeación</button>
                <button onClick={() => setViewMode('control')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'control' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}><Gauge className="w-4 h-4" /> Control Real</button>
            </div>
        </div>

        {/* --- DYNAMIC CHARTS AREA --- */}
        <div className="animate-slide-up">
            {viewMode === 'plan' ? renderFlowChart() : renderControlChart()}
        </div>

        {/* --- DETAILS SECTION --- */}
        {viewMode === 'plan' && selectedLot && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-4">
                        <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs flex items-center gap-2"><Pickaxe className="w-5 h-5 text-amber-500" /> Nómina Presupuestada</h3>
                        <button onClick={() => { setAddItemType('LABOR'); setShowAddItem(true); }} className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20 active:scale-90 transition-all"><Plus className="w-5 h-5" /></button>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xl">
                        {activeBudget?.items.filter(i => i.type === 'LABOR').map(item => (
                            <div key={item.id} className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group">
                                <div>
                                    <p className="font-black text-slate-800 dark:text-white text-base">{item.conceptName}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{item.quantityPerHa} Jornales/Ha • {formatCurrency(item.unitCost)}</p>
                                    <div className="flex flex-wrap gap-1 mt-3">{item.months.sort((a,b)=>a-b).map(m => <span key={m} className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 text-[8px] font-black rounded-lg">{months[m]}</span>)}</div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <p className="font-black font-mono text-slate-900 dark:text-white text-lg">{formatCurrency(item.unitCost * item.quantityPerHa * lotArea * item.months.length)}</p>
                                    <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600 mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center px-4">
                        <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs flex items-center gap-2"><Package className="w-5 h-5 text-emerald-500" /> Insumos Presupuestados</h3>
                        <button onClick={() => { setAddItemType('SUPPLY'); setShowAddItem(true); }} className="p-2.5 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-90 transition-all"><Plus className="w-5 h-5" /></button>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xl">
                        {activeBudget?.items.filter(i => i.type === 'SUPPLY').map(item => (
                            <div key={item.id} className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group">
                                <div>
                                    <p className="font-black text-slate-800 dark:text-white text-base">{item.conceptName}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{item.quantityPerHa} Unidades/Ha • {formatCurrency(item.unitCost)}</p>
                                    <div className="flex flex-wrap gap-1 mt-3">{item.months.sort((a,b)=>a-b).map(m => <span key={m} className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-[8px] font-black rounded-lg">{months[m]}</span>)}</div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <p className="font-black font-mono text-slate-900 dark:text-white text-lg">{formatCurrency(item.unitCost * item.quantityPerHa * lotArea * item.months.length)}</p>
                                    <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600 mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* MODAL PARA AGREGAR ITEMS */}
        <Modal isOpen={showAddItem} onClose={() => setShowAddItem(false)} title={addItemType === 'LABOR' ? 'Planificar Labor' : 'Planificar Insumo'} icon={addItemType === 'LABOR' ? Pickaxe : Package}>
            <form onSubmit={handleAddItem} className="space-y-6">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Concepto Táctico</label>
                    <select value={selectedConceptId} onChange={e => setSelectedConceptId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white font-bold text-sm" required>
                        <option value="">Seleccionar...</option>
                        {addItemType === 'LABOR' ? activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>) : inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Dosis/Densidad por Ha</label>
                        <input type="number" step="0.01" value={qtyPerHa} onChange={e => setQtyPerHa(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white font-black" placeholder="Ej: 4" required />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Costo Unitario Proyectado</label>
                        <input type="number" value={unitCost} onChange={e => setUnitCost(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-emerald-400 font-mono font-black" placeholder="$" required />
                    </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-700 shadow-inner">
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-4 block text-center tracking-[0.2em]">Frecuencia de Aplicación (Meses)</label>
                    <div className="grid grid-cols-4 gap-2">
                        {months.map((m, idx) => (
                            <button key={idx} type="button" onClick={() => toggleMonth(idx)} className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${selectedMonths.includes(idx) ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-600 hover:text-white'}`}>{m}</button>
                        ))}
                    </div>
                </div>
                <div className="p-5 bg-indigo-900/20 rounded-[2rem] border border-indigo-500/20 flex items-center justify-between">
                    <div><p className="text-[10px] text-indigo-300 font-black uppercase">Subtotal del Item</p><p className="text-[9px] text-slate-500 font-bold uppercase">{lotArea} Ha • {selectedMonths.length} Eventos/Año</p></div>
                    <p className="text-2xl font-mono font-black text-white">{formatCurrency((parseFloat(unitCost) || 0) * (parseFloat(qtyPerHa) || 0) * lotArea * selectedMonths.length)}</p>
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-[2rem] shadow-xl active:scale-95 transition-all uppercase tracking-widest text-xs">Integrar al Presupuesto</button>
            </form>
        </Modal>
    </div>
  );
};
