
import React, { useState, useMemo, useEffect } from 'react';
import { HarvestLog, CostCenter, Movement } from '../types';
import { formatCurrency, formatNumberInput, parseNumberInput } from '../services/inventoryService';
import { Sprout, Plus, Target, AlertTriangle, ShieldX, Clock, ShieldCheck, Info, Users, BarChart3, Scissors, Bug, Trash2, AlertCircle, MapPin, Calendar, DollarSign, Calculator, Percent, TrendingDown, Gauge, X, Save, Leaf, Coffee, HelpCircle, ArrowRight } from 'lucide-react';
import { HeaderCard, EmptyState, Modal } from './UIElements';

interface HarvestViewProps {
  harvests: HarvestLog[];
  costCenters: CostCenter[];
  onAddHarvest: (h: Omit<HarvestLog, 'id' | 'warehouseId'>) => void;
  onDeleteHarvest: (id: string) => void;
  onAddCostCenter: (name: string) => void;
  isAdmin: boolean;
  allMovements?: Movement[];
}

export const HarvestView: React.FC<HarvestViewProps> = ({ 
    harvests, costCenters, onAddHarvest, onDeleteHarvest, onAddCostCenter, isAdmin, allMovements = []
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showQualityTool, setShowQualityTool] = useState(false);
  
  // --- FORM STATES ---
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [costCenterId, setCostCenterId] = useState('');
  const [totalValue, setTotalValue] = useState('');
  
  // TIPO DE VENTA (CRÍTICO: Define qué campos se muestran)
  const [saleType, setSaleType] = useState<'COFFEE' | 'PLANTAIN_OTHER'>('COFFEE');
  const [customCropName, setCustomCropName] = useState(''); // Para cuando es "Otro"

  // CAMPOS ESPECÍFICOS: CAFÉ
  const [coffeeWeight, setCoffeeWeight] = useState(''); // Kg Totales
  const [yieldFactor, setYieldFactor] = useState(''); // Factor (Ej: 94)
  const [pestPct, setPestPct] = useState(''); // % Broca
  const [collectorsCount, setCollectorsCount] = useState('1'); // Nro Recolectores
  
  // CAMPOS ESPECÍFICOS: PLÁTANO / OTROS
  const [qtyQuality1, setQtyQuality1] = useState(''); // Primera
  const [qtyQuality2, setQtyQuality2] = useState(''); // Segunda
  const [qtyQuality3, setQtyQuality3] = useState(''); // Tercera/Rechazo
  
  // QUICK ADD STATE
  const [isCreatingLot, setIsCreatingLot] = useState(false);
  const [newLotName, setNewLotName] = useState('');

  const selectedLot = useMemo(() => costCenters.find(c => c.id === costCenterId), [costCenters, costCenterId]);
  
  // --- EFECTO: DETECTAR TIPO DE CULTIVO AUTOMÁTICO ---
  useEffect(() => {
      if (selectedLot) {
          const crop = selectedLot.cropType || '';
          // Si el lote dice Café, por defecto ponemos modo Café. Si dice Plátano, modo Plátano.
          if (crop.includes('Café') || crop.includes('Cafe')) {
              setSaleType('COFFEE');
          } else {
              setSaleType('PLANTAIN_OTHER');
              setCustomCropName(crop === 'Café' ? '' : crop); // Prellenar nombre si no es café
          }
      }
  }, [selectedLot]);

  // --- LÓGICA DE CÁLCULO ---
  const qualityAnalysis = useMemo(() => {
      // Solo relevante para café
      if (saleType !== 'COFFEE') return { totalLoss: 0 };

      const broca = parseFloat(pestPct) || 0;
      const kgs = parseFloat(coffeeWeight) || 0;
      const value = parseNumberInput(totalValue);
      
      // Estimación simple: si broca > 2%, castigo del precio base
      // Precio implícito por Kg
      const pricePerKg = kgs > 0 ? value / kgs : 0;
      const lossPerKg = broca > 1.5 ? pricePerKg * 0.02 * (broca - 1.5) : 0; // Modelo simplificado
      
      return { totalLoss: lossPerKg * kgs };
  }, [pestPct, totalValue, coffeeWeight, saleType]);

  const derivedTotalQty = useMemo(() => {
      if (saleType === 'COFFEE') return parseFloat(coffeeWeight) || 0;
      return (parseFloat(qtyQuality1)||0) + (parseFloat(qtyQuality2)||0) + (parseFloat(qtyQuality3)||0);
  }, [saleType, coffeeWeight, qtyQuality1, qtyQuality2, qtyQuality3]);

  // --- HANDLERS ---
  const handleCreateLot = (e: React.MouseEvent) => {
      e.preventDefault();
      if(newLotName.trim()) {
          onAddCostCenter(newLotName);
          setIsCreatingLot(false);
          setNewLotName('');
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLot) return;
    
    let finalCropName = saleType === 'COFFEE' ? 'Café CPS' : (customCropName || 'Plátano/Fruta');
    const value = parseNumberInput(totalValue);

    onAddHarvest({ 
        date, 
        costCenterId, 
        costCenterName: selectedLot.name, 
        cropName: finalCropName, 
        quantity: derivedTotalQty, 
        unit: saleType === 'COFFEE' ? 'Kg' : 'Und/Kg', 
        totalValue: value,
        // Campos condicionales
        yieldFactor: saleType === 'COFFEE' ? (parseFloat(yieldFactor) || undefined) : undefined,
        pestPercentage: saleType === 'COFFEE' ? (parseFloat(pestPct) || undefined) : undefined,
        collectorsCount: saleType === 'COFFEE' ? (parseInt(collectorsCount) || 1) : undefined,
        brocaLossValue: saleType === 'COFFEE' ? qualityAnalysis.totalLoss : undefined,
        // Campos Plátano
        quality1Qty: saleType !== 'COFFEE' ? (parseFloat(qtyQuality1) || 0) : undefined,
        quality2Qty: saleType !== 'COFFEE' ? (parseFloat(qtyQuality2) || 0) : undefined,
        wasteQty: saleType !== 'COFFEE' ? (parseFloat(qtyQuality3) || 0) : undefined,
    });

    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
      setTotalValue(''); setCoffeeWeight(''); setYieldFactor(''); setPestPct(''); 
      setQtyQuality1(''); setQtyQuality2(''); setQtyQuality3('');
  };

  // Quality Audit Tool States (Modal secundario)
  const [sampleTotal, setSampleTotal] = useState('100');
  const [sampleBroca, setSampleBroca] = useState('0');
  const [potentialPrice, setPotentialPrice] = useState('1850000');

  return (
    <div className="space-y-6 pb-20">
        <HeaderCard 
            title="Producción y Calidad"
            subtitle="Auditoría de Cosecha"
            valueLabel="Valor Ventas"
            value={formatCurrency(harvests.reduce((a,b)=>a+b.totalValue, 0))}
            gradientClass="bg-gradient-to-r from-emerald-600 to-teal-700"
            icon={Target}
            onAction={() => setShowForm(true)}
            actionLabel="Registrar Venta"
            actionIcon={Plus}
            secondaryAction={
                <button onClick={() => setShowQualityTool(true)} className="p-4 bg-white/20 rounded-xl text-white backdrop-blur-md border border-white/30 hover:bg-white/30 transition-all shadow-lg">
                    <Calculator className="w-5 h-5" />
                </button>
            }
        />

        {/* LISTA DE REGISTROS */}
        <div className="space-y-3">
            {harvests.length === 0 ? (
                <EmptyState icon={Sprout} message="No hay registros de cosecha." />
            ) : (
                harvests.slice().reverse().map(h => (
                    <div key={h.id} className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm relative group">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 font-black px-2 py-0.5 rounded-lg uppercase">{new Date(h.date).toLocaleDateString()}</span>
                                    <h4 className="font-black text-slate-800 dark:text-white text-sm uppercase">{h.cropName}</h4>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 ml-1">{h.costCenterName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-emerald-600 font-black text-sm">{formatCurrency(h.totalValue)}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">{h.quantity.toLocaleString()} {h.unit}</p>
                            </div>
                        </div>

                        {/* DETALLES ESPECÍFICOS SEGÚN TIPO EN LA LISTA */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 flex gap-4 overflow-x-auto scrollbar-hide">
                            {h.yieldFactor !== undefined ? (
                                <>
                                    <div className="shrink-0">
                                        <p className="text-[8px] text-slate-400 uppercase font-black">Factor</p>
                                        <p className={`text-xs font-bold ${h.yieldFactor > 94 ? 'text-red-500' : 'text-emerald-500'}`}>{h.yieldFactor}</p>
                                    </div>
                                    <div className="shrink-0">
                                        <p className="text-[8px] text-slate-400 uppercase font-black">Broca</p>
                                        <p className={`text-xs font-bold ${h.pestPercentage && h.pestPercentage > 2 ? 'text-red-500' : 'text-emerald-500'}`}>{h.pestPercentage || 0}%</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="shrink-0">
                                        <p className="text-[8px] text-slate-400 uppercase font-black">1ra</p>
                                        <p className="text-xs font-bold text-emerald-500">{h.quality1Qty || 0}</p>
                                    </div>
                                    <div className="shrink-0">
                                        <p className="text-[8px] text-slate-400 uppercase font-black">2da</p>
                                        <p className="text-xs font-bold text-amber-500">{h.quality2Qty || 0}</p>
                                    </div>
                                    <div className="shrink-0">
                                        <p className="text-[8px] text-slate-400 uppercase font-black">Rech.</p>
                                        <p className="text-xs font-bold text-red-500">{h.wasteQty || 0}</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {isAdmin && <button onClick={() => onDeleteHarvest(h.id)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-slate-800 text-slate-300 hover:text-red-500 shadow-lg rounded-full opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4"/></button>}
                    </div>
                ))
            )}
        </div>

        {/* MODAL PRINCIPAL */}
        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Registro de Venta" icon={Target} maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. SELECCIÓN DE LOTE Y FECHA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Fecha</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs font-bold" required />
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase">Lote Origen</label>
                            <button type="button" onClick={() => setIsCreatingLot(!isCreatingLot)} className="text-[10px] font-black text-indigo-400 uppercase">{isCreatingLot ? 'Cancelar' : '+ Nuevo'}</button>
                        </div>
                        {isCreatingLot ? (
                            <div className="flex gap-2">
                                <input type="text" value={newLotName} onChange={e => setNewLotName(e.target.value)} placeholder="Nombre Lote" className="flex-1 bg-indigo-900/20 border border-indigo-500 rounded-xl p-3 text-white text-xs" autoFocus />
                                <button type="button" onClick={handleCreateLot} disabled={!newLotName.trim()} className="bg-indigo-600 text-white p-3 rounded-xl"><Save className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <select value={costCenterId} onChange={e => setCostCenterId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs font-bold" required>
                                <option value="">Seleccione Lote...</option>
                                {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        )}
                    </div>
                </div>

                {selectedLot && (
                    <div className="animate-fade-in space-y-6">
                        
                        {/* 2. SELECTOR DE TIPO (SWITCH GRANDE) */}
                        <div className="bg-slate-950 p-1.5 rounded-2xl flex border border-slate-800">
                            <button 
                                type="button"
                                onClick={() => setSaleType('COFFEE')}
                                className={`flex-1 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase flex items-center justify-center gap-2 transition-all ${saleType === 'COFFEE' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-900'}`}
                            >
                                <Coffee className="w-4 h-4" /> Café
                            </button>
                            <button 
                                type="button"
                                onClick={() => setSaleType('PLANTAIN_OTHER')}
                                className={`flex-1 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase flex items-center justify-center gap-2 transition-all ${saleType === 'PLANTAIN_OTHER' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-900'}`}
                            >
                                <Leaf className="w-4 h-4" /> Plátano / Otro
                            </button>
                        </div>

                        {/* 3. FORMULARIOS CONDICIONALES */}
                        {saleType === 'COFFEE' ? (
                            <div className="bg-emerald-950/20 p-5 rounded-[2rem] border border-emerald-500/20 space-y-4 animate-slide-up">
                                <h5 className="text-[10px] text-emerald-400 font-black uppercase tracking-widest text-center">Ficha Técnica Café</h5>
                                
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Peso Total (Kg Café Pergamino/Cereza)</label>
                                    <input type="number" step="0.1" value={coffeeWeight} onChange={e => setCoffeeWeight(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white font-mono text-xl font-black text-center focus:border-emerald-500 outline-none" placeholder="0.0" required />
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-slate-500 uppercase block text-center">Factor Rend.</label>
                                        <input type="number" step="0.1" value={yieldFactor} onChange={e => setYieldFactor(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-center font-bold" placeholder="94" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-red-500 uppercase block text-center">% Broca</label>
                                        <input type="number" step="0.1" value={pestPct} onChange={e => setPestPct(e.target.value)} className="w-full bg-slate-900 border border-red-500/30 rounded-xl p-3 text-red-400 text-center font-bold" placeholder="0%" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-slate-500 uppercase block text-center">Recolectores</label>
                                        <input type="number" value={collectorsCount} onChange={e => setCollectorsCount(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-center font-bold" placeholder="1" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-amber-950/20 p-5 rounded-[2rem] border border-amber-500/20 space-y-4 animate-slide-up">
                                <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2 mb-2">
                                    <input type="text" value={customCropName} onChange={e => setCustomCropName(e.target.value)} placeholder="Nombre Producto (Ej: Plátano)" className="bg-transparent text-amber-400 font-black uppercase text-xs outline-none flex-1 placeholder-amber-700" />
                                    <Info className="w-4 h-4 text-amber-600" />
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-emerald-500 uppercase block text-center">1ra Calidad</label>
                                        <input type="number" value={qtyQuality1} onChange={e => setQtyQuality1(e.target.value)} className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl p-3 text-emerald-400 text-center font-bold text-lg" placeholder="0" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-amber-500 uppercase block text-center">2da Calidad</label>
                                        <input type="number" value={qtyQuality2} onChange={e => setQtyQuality2(e.target.value)} className="w-full bg-slate-900 border border-amber-500/30 rounded-xl p-3 text-amber-400 text-center font-bold text-lg" placeholder="0" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black text-red-500 uppercase block text-center">Rechazo</label>
                                        <input type="number" value={qtyQuality3} onChange={e => setQtyQuality3(e.target.value)} className="w-full bg-slate-900 border border-red-500/30 rounded-xl p-3 text-red-400 text-center font-bold text-lg" placeholder="0" />
                                    </div>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-[9px] text-slate-500 font-black uppercase">Total Unidades/Kg</p>
                                    <p className="text-2xl font-mono font-black text-white">{derivedTotalQty}</p>
                                </div>
                            </div>
                        )}

                        {/* 4. TOTAL DINERO (COMÚN) */}
                        <div className="space-y-2 pt-2 border-t border-slate-800">
                            <label className="text-[10px] font-black text-emerald-500 uppercase ml-2">Valor Venta Total ($)</label>
                            <input type="text" inputMode="decimal" value={formatNumberInput(totalValue)} onChange={e => setTotalValue(parseNumberInput(e.target.value).toString())} className="w-full bg-slate-900 border-2 border-emerald-500/20 focus:border-emerald-500 rounded-3xl p-6 text-3xl sm:text-4xl font-black text-emerald-500 font-mono outline-none transition-colors" placeholder="$ 0" required />
                        </div>

                        <button type="submit" className="w-full py-5 rounded-[2rem] bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                            GUARDAR VENTA
                        </button>
                    </div>
                )}
            </form>
        </Modal>

        {/* MODAL CALC BROCA (Sin Cambios Visuales Mayores, solo integración) */}
        <Modal isOpen={showQualityTool} onClose={() => setShowQualityTool(false)} title="Calculadora Broca" icon={Bug}>
             <div className="space-y-6">
                <p className="text-xs text-slate-400 italic">Herramienta rápida para estimar el porcentaje de afectación en una muestra.</p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase">Granos Totales</label>
                        <input type="number" value={sampleTotal} onChange={e => setSampleTotal(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-center font-bold" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-red-500 uppercase">Granos Brocados</label>
                        <input type="number" value={sampleBroca} onChange={e => setSampleBroca(e.target.value)} className="w-full bg-slate-900 border border-red-900/50 rounded-xl p-3 text-red-400 text-center font-bold" />
                    </div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl text-center">
                    <p className="text-[10px] text-slate-500 font-black uppercase">Resultado</p>
                    <p className="text-3xl font-black text-white">{((parseFloat(sampleBroca)/parseFloat(sampleTotal || '1'))*100).toFixed(2)}%</p>
                </div>
             </div>
        </Modal>
    </div>
  );
};
