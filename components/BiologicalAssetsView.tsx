
import React, { useMemo, useState } from 'react';
import { CostCenter, Movement, LaborLog } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { Sprout, TrendingUp, DollarSign, ArrowRight, Activity, Calendar, Calculator, Leaf, CheckCircle2, AlertTriangle, Layers, Info } from 'lucide-react';
import { HeaderCard, Modal } from './UIElements';

interface BiologicalAssetsViewProps {
  costCenters: CostCenter[];
  movements: Movement[];
  laborLogs: LaborLog[];
  laborFactor: number;
  onUpdateLot: (updatedLot: CostCenter) => void;
}

export const BiologicalAssetsView: React.FC<BiologicalAssetsViewProps> = ({
  costCenters,
  movements,
  laborLogs,
  laborFactor,
  onUpdateLot
}) => {
  const [selectedLot, setSelectedLot] = useState<CostCenter | null>(null);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [amortizationYears, setAmortizationYears] = useState('7'); // Default 7 years for coffee/fruit trees

  // --- CALCULATION ENGINE ---
  const activeAssets = useMemo(() => {
    return costCenters.map(lot => {
      // 1. Calculate Historical Capex (Only relevant if in Levante or just transitioned)
      // We filter logs and movements that belong to this lot
      const lotLaborCost = laborLogs
        .filter(l => l.costCenterId === lot.id)
        .reduce((sum, l) => sum + (l.value * laborFactor), 0);
      
      const lotInputCost = movements
        .filter(m => m.costCenterId === lot.id && m.type === 'OUT')
        .reduce((sum, m) => sum + m.calculatedCost, 0);

      const totalInvestment = lotLaborCost + lotInputCost;

      // 2. Amortization Logic (For Production Lots)
      let annualAmortization = 0;
      let bookValue = 0;
      let yearsElapsed = 0;

      if (lot.stage === 'Produccion' && lot.assetValue && lot.activationDate && lot.amortizationDuration) {
          const activationYear = new Date(lot.activationDate).getFullYear();
          const currentYear = new Date().getFullYear();
          yearsElapsed = currentYear - activationYear;
          
          annualAmortization = lot.assetValue / lot.amortizationDuration;
          const accumulatedDepreciation = Math.min(annualAmortization * yearsElapsed, lot.assetValue);
          bookValue = Math.max(lot.assetValue - accumulatedDepreciation, 0);
      }

      return {
        ...lot,
        calculatedCapex: totalInvestment, // Dynamic calculation
        annualAmortization,
        bookValue,
        yearsElapsed
      };
    });
  }, [costCenters, movements, laborLogs, laborFactor]);

  const levanteLots = activeAssets.filter(l => l.stage === 'Levante');
  const productionLots = activeAssets.filter(l => l.stage === 'Produccion');

  const handleOpenActivation = (lot: CostCenter) => {
      setSelectedLot(lot);
      setShowActivationModal(true);
  };

  const handleActivateAsset = () => {
      if (!selectedLot) return;
      
      // Find the calculated CAPEX for this lot
      const lotData = activeAssets.find(l => l.id === selectedLot.id);
      const finalCapex = lotData?.calculatedCapex || 0;

      const updatedLot: CostCenter = {
          ...selectedLot,
          stage: 'Produccion',
          accumulatedCapex: finalCapex,
          assetValue: finalCapex, // Freeze the value as Asset Value
          activationDate: new Date().toISOString(),
          amortizationDuration: parseInt(amortizationYears)
      };

      onUpdateLot(updatedLot);
      setShowActivationModal(false);
      setSelectedLot(null);
  };

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
        <HeaderCard 
            title="Activos Biológicos"
            subtitle="Gestión de Inversión y Activos"
            valueLabel="Valor en Libros"
            value={formatCurrency(activeAssets.reduce((sum, l) => sum + (l.assetValue || l.calculatedCapex), 0))}
            gradientClass="bg-gradient-to-r from-emerald-700 to-teal-900"
            icon={Leaf}
            onAction={() => {}} 
            actionLabel="Ver Normativa NIC 41"
            actionIcon={Info}
            actionColorClass="hidden" // Hide button for now, just info
        />

        {/* --- SECTION 1: CAPEX (INVERSIÓN EN PROCESO) --- */}
        <div className="space-y-4">
            <h3 className="font-black text-slate-500 uppercase text-xs flex items-center gap-2 tracking-widest px-2">
                <Sprout className="w-4 h-4 text-emerald-500" /> Etapa de Levante (Inversión CAPEX)
            </h3>
            
            {levanteLots.length === 0 ? (
                <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                    <p className="text-xs text-slate-500">No hay lotes en etapa de levante.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {levanteLots.map(lot => (
                        <div key={lot.id} className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <TrendingUp className="w-16 h-16 text-emerald-500" />
                            </div>
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-1 rounded-full uppercase">En Crecimiento</span>
                                        <h4 className="font-black text-lg text-slate-800 dark:text-white mt-1">{lot.name}</h4>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">{lot.cropType} • {lot.area} Ha</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-slate-400 font-black uppercase">Costo Acumulado</p>
                                        <p className="text-xl font-mono font-black text-emerald-600">{formatCurrency(lot.calculatedCapex)}</p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 mb-4">
                                    <p className="text-[10px] text-slate-500 italic">
                                        Este valor se considera <strong>Inversión (Activo)</strong>, no Gasto. Al iniciar producción, se activará para amortización.
                                    </p>
                                </div>

                                <button 
                                    onClick={() => handleOpenActivation(lot)}
                                    className="w-full bg-slate-900 dark:bg-slate-700 hover:bg-emerald-600 text-white font-black py-3 rounded-xl text-xs uppercase flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                                >
                                    <Activity className="w-4 h-4" /> Cerrar Inversión (Activar)
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* --- SECTION 2: OPEX + AMORTIZATION (PRODUCCIÓN) --- */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="font-black text-slate-500 uppercase text-xs flex items-center gap-2 tracking-widest px-2">
                <Layers className="w-4 h-4 text-indigo-500" /> Activos en Producción (Amortización)
            </h3>

            {productionLots.filter(l => l.assetValue && l.assetValue > 0).length === 0 ? (
                <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                    <p className="text-xs text-slate-500">No hay lotes productivos con amortización activa.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {productionLots.filter(l => l.assetValue && l.assetValue > 0).map(lot => (
                        <div key={lot.id} className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-6 items-center">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                    <h4 className="font-black text-slate-800 dark:text-white text-sm">{lot.name}</h4>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase mb-3">Valor Activado: {formatCurrency(lot.assetValue || 0)}</p>
                                
                                <div className="flex gap-4">
                                    <div>
                                        <p className="text-[9px] text-slate-400 uppercase font-black">Amortización Anual</p>
                                        <p className="text-sm font-mono font-bold text-red-500">- {formatCurrency(lot.annualAmortization)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-slate-400 uppercase font-black">Valor en Libros</p>
                                        <p className="text-sm font-mono font-bold text-indigo-500">{formatCurrency(lot.bookValue)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full md:w-48 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                                    <span>Año {lot.yearsElapsed}</span>
                                    <span>Meta: {lot.amortizationDuration} Años</span>
                                </div>
                                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-indigo-500 rounded-full" 
                                        style={{ width: `${Math.min(((lot.yearsElapsed || 0) / (lot.amortizationDuration || 1)) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* --- MODAL ACTIVATION --- */}
        <Modal isOpen={showActivationModal} onClose={() => setShowActivationModal(false)} title="Activar Lote Productivo" icon={CheckCircle2}>
            <div className="space-y-6">
                <div className="bg-amber-100 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 flex gap-3">
                    <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500 shrink-0" />
                    <div className="text-xs text-amber-800 dark:text-amber-200">
                        <p className="font-bold mb-1">Cambio de Estado Contable</p>
                        <p>Al pasar a Producción, el costo acumulado ({formatCurrency(selectedLot && activeAssets.find(l => l.id === selectedLot.id)?.calculatedCapex || 0)}) se congelará como <strong>Activo Biológico</strong> y comenzará a amortizarse anualmente como un gasto.</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="block text-xs font-black text-slate-500 uppercase">Vida Útil del Cultivo (Años)</label>
                    <div className="grid grid-cols-3 gap-3">
                        {['5', '7', '10'].map(year => (
                            <button 
                                key={year}
                                onClick={() => setAmortizationYears(year)}
                                className={`py-3 rounded-xl font-black text-sm border transition-all ${amortizationYears === year ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                            >
                                {year} Años
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Personalizado:</span>
                        <input 
                            type="number" 
                            value={amortizationYears} 
                            onChange={e => setAmortizationYears(e.target.value)} 
                            className="w-16 bg-slate-100 dark:bg-slate-800 border-none rounded-lg p-2 text-center text-sm font-bold text-slate-800 dark:text-white" 
                        />
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-bold">Gasto Anual Estimado:</span>
                        <span className="font-mono font-black text-indigo-600">
                            {formatCurrency((selectedLot && activeAssets.find(l => l.id === selectedLot.id)?.calculatedCapex || 0) / parseInt(amortizationYears || '1'))} / Año
                        </span>
                    </div>
                </div>

                <button 
                    onClick={handleActivateAsset}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition-all uppercase text-xs tracking-widest"
                >
                    Confirmar Transición
                </button>
            </div>
        </Modal>
    </div>
  );
};
