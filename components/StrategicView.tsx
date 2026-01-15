
import React, { useMemo, useState } from 'react';
import { AppState, SWOT, CostCenter, Activity } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { InvestmentCalculatorView } from './InvestmentCalculatorView';
// Added Sun to the imports from lucide-react
import { Target, TrendingUp, DollarSign, PieChart, Landmark, Timer, ArrowRightLeft, Lightbulb, ShieldCheck, Briefcase, Activity as ActivityIcon, Info, Users, AlertTriangle, Scale, Database, BarChart3, Search, Zap, CheckCircle, BrainCircuit, Sprout, Split, BookOpen, ArrowDown, ArrowUp, LayoutGrid, Layers, Percent, Coffee, AlertCircle, TrendingDown, Target as TargetIcon, ShieldX, CloudSun, Sun } from 'lucide-react';

interface StrategicViewProps {
  data: AppState;
  onUpdateSWOT: (swot: SWOT) => void;
}

interface CropStats {
  area: number;
  income: number;
  directLabor: number;
  directInputs: number;
  totalDirectCost: number;
  margin: number;
  marginPerHa: number;
  operatingRatio: number;
  totalQtyKg: number;
  costPerKg: number;
  breakevenLoad?: number; 
  plantainDensity?: number; // Para diagnóstico de sombra
}

export const StrategicView: React.FC<StrategicViewProps> = ({ data, onUpdateSWOT }) => {
  const laborFactor = data.laborFactor || 1.0;

  const polyAnalytics = useMemo(() => {
    const crops: Record<string, CropStats> = {
      'Café': { area: 0, income: 0, directLabor: 0, directInputs: 0, totalDirectCost: 0, margin: 0, marginPerHa: 0, operatingRatio: 0, totalQtyKg: 0, costPerKg: 0, breakevenLoad: 0 },
      'Plátano': { area: 0, income: 0, directLabor: 0, directInputs: 0, totalDirectCost: 0, margin: 0, marginPerHa: 0, operatingRatio: 0, totalQtyKg: 0, costPerKg: 0 }
    };

    let jointLabor = 0;
    let totalPlantainInFinca = 0;

    data.costCenters.forEach(c => {
        if (crops[c.cropType]) crops[c.cropType].area += c.area;
        if (c.cropType === 'Plátano' || c.associatedCrop === 'Plátano') {
            totalPlantainInFinca += (c.plantCount || 0);
        }
    });

    data.harvests.forEach(h => {
        const lot = data.costCenters.find(c => c.id === h.costCenterId);
        if (lot && crops[lot.cropType]) {
            crops[lot.cropType].income += h.totalValue;
            crops[lot.cropType].totalQtyKg += h.quantity;
        }
    });

    data.laborLogs.forEach(l => {
        const act = data.activities.find(a => a.id === l.activityId);
        const cost = l.value * laborFactor;
        if (act?.costClassification === 'COFFEE') crops['Café'].directLabor += cost;
        else if (act?.costClassification === 'PLANTAIN') crops['Plátano'].directLabor += cost;
        else jointLabor += cost;
    });

    data.movements.filter(m => m.type === 'OUT').forEach(m => {
        const lot = data.costCenters.find(c => c.id === m.costCenterId);
        if (lot && crops[lot.cropType]) crops[lot.cropType].directInputs += m.calculatedCost;
    });

    Object.keys(crops).forEach(key => {
        const c = crops[key];
        c.totalDirectCost = c.directLabor + c.directInputs;
        const weight = c.income / (Object.values(crops).reduce((acc, curr) => acc + curr.income, 0) || 1);
        const allocatedJoint = jointLabor * weight;
        const totalEconomicCost = c.totalDirectCost + allocatedJoint;
        c.margin = c.income - totalEconomicCost;
        c.marginPerHa = c.area > 0 ? c.margin / c.area : 0;
        c.operatingRatio = c.income > 0 ? (totalEconomicCost / c.income) * 100 : 0;
        c.costPerKg = c.totalQtyKg > 0 ? totalEconomicCost / c.totalQtyKg : 0;
        if (key === 'Café') {
            c.breakevenLoad = c.costPerKg * 125;
            c.plantainDensity = totalPlantainInFinca / (c.area || 1);
        }
    });

    return { crops, jointLabor };
  }, [data, laborFactor]);

  return (
    <div className="space-y-8 pb-32 animate-fade-in">
        <div className="bg-slate-900 p-8 rounded-[3.5rem] border border-slate-700 shadow-2xl text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 p-10 opacity-5"><LayoutGrid className="w-64 h-64 text-white" /></div>
             <div className="relative z-10">
                 <div className="flex items-center justify-center gap-3 mb-2">
                     <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg"><BrainCircuit className="w-6 h-6 text-white" /></div>
                     <h2 className="text-white font-black text-2xl uppercase tracking-tighter italic">Estrategia Agronómica</h2>
                 </div>
                 <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.3em] bg-emerald-500/10 inline-block px-4 py-1 rounded-full border border-emerald-500/20">Monitor de Sinergia y Sombra</p>
             </div>
        </div>

        {/* --- DIAGNÓSTICO DE POLICULTIVO BASADO EN DATOS TÉCNICOS --- */}
        <div className="bg-slate-900 p-8 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><CloudSun className="w-40 h-40 text-yellow-500" /></div>
            <div className="relative z-10 space-y-6">
                <h3 className="text-white font-black text-xs uppercase flex items-center gap-3 tracking-[0.2em]">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" /> Auditoría de Sombrío (Cenicafé 2025)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] text-slate-500 font-black uppercase">Densidad de Plátano</span>
                                <span className="text-[10px] text-indigo-400 font-black uppercase">Filtro de Luz</span>
                            </div>
                            <p className="text-3xl font-black text-white font-mono">{polyAnalytics.crops['Café'].plantainDensity?.toFixed(0)} <span className="text-xs text-slate-500">sitios/Ha</span></p>
                        </div>
                        
                        {(polyAnalytics.crops['Café'].plantainDensity || 0) > 300 ? (
                            <div className="bg-red-950/40 border border-red-500/40 p-5 rounded-3xl flex gap-4 animate-pulse">
                                <ShieldX className="w-8 h-8 text-red-500 shrink-0" />
                                <div>
                                    <h5 className="text-xs font-black text-red-400 uppercase tracking-widest">Alerta: Viciamiento Crítico</h5>
                                    <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                                        Su densidad de sombra excede los 300 sitios/Ha. La planta de café está priorizando crecimiento vegetativo (vicio) sobre el reproductivo. <strong>Producción en riesgo de caída drástica.</strong>
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-emerald-950/40 border border-emerald-500/40 p-5 rounded-3xl flex gap-4">
                                <CheckCircle className="w-8 h-8 text-emerald-500 shrink-0" />
                                <div>
                                    <h5 className="text-xs font-black text-emerald-400 uppercase tracking-widest">Sombrío Regulado</h5>
                                    <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                                        Su arreglo espacial permite la intercepción de luz lateral óptima. Siga con deshojes agresivos de plátano para mantener el equilibrio lumínico.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-950/50 p-6 rounded-[2.5rem] border border-slate-800 flex flex-col justify-center text-center space-y-4">
                        {/* Fix: Added Sun import above to satisfy this component */}
                        <div className="p-3 bg-slate-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto border border-slate-700"><Sun className="w-8 h-8 text-yellow-500" /></div>
                        <div>
                            <h5 className="text-white font-black text-sm italic">Estrategia de Ciclo Corto</h5>
                            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                                Recuerde: Lotes con más de 7.000 cafetos requieren **Zoca al 5to año**. No intente alargar el ciclo si el IAF ya superó el tope, el costo de recolección en bajeras paloteadas destruirá su margen.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* --- BREAKEVEN ANALYSIS PANEL --- */}
        <div className="bg-indigo-950/20 p-8 rounded-[3rem] border border-indigo-500/30 space-y-6">
            <h3 className="text-indigo-400 font-black text-xs uppercase flex items-center gap-3 tracking-[0.2em]">
                <TargetIcon className="w-5 h-5" /> Soporte de Decisión Comercial (Breakeven)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(polyAnalytics.crops).map(([name, s]) => {
                    const stats = s as CropStats;
                    return (
                        <div key={`be-${name}`} className="bg-slate-900/80 p-6 rounded-3xl border border-slate-700 space-y-4">
                            <div className="flex justify-between items-center">
                                <p className="text-white font-black uppercase text-sm italic">{name}</p>
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Base Producción Real</span>
                            </div>
                            <div className="flex items-end justify-between border-b border-slate-800 pb-4">
                                <div>
                                    <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Costo de Producción / Kg</p>
                                    <p className="text-2xl font-mono font-black text-white">{formatCurrency(stats.costPerKg, 2)}</p>
                                </div>
                                {name === 'Café' && (
                                    <div className="text-right">
                                        <p className="text-[9px] text-emerald-500 font-black uppercase mb-1">Breakeven / Carga</p>
                                        <p className="text-2xl font-mono font-black text-emerald-500">{formatCurrency(stats.breakevenLoad || 0)}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* --- CALCULADORA DE INVERSIÓN --- */}
        <div className="space-y-4 pt-4">
            <h3 className="font-black text-white flex items-center gap-2 uppercase text-sm tracking-widest">
                <DollarSign className="w-5 h-5 text-emerald-500" /> Evaluación de Nuevos Proyectos
            </h3>
            <InvestmentCalculatorView />
        </div>
    </div>
  );
};
