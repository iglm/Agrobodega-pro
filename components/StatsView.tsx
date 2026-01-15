
import React, { useMemo, useState } from 'react';
import { Movement, Supplier, CostCenter, LaborLog, HarvestLog, MaintenanceLog, RainLog, FinanceLog, Machine, BudgetPlan, PlannedLabor } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { 
  PieChart, TrendingUp, BarChart3, MapPin, Users, Ruler, Sprout, Pickaxe, Package, Wrench, Wallet, CalendarRange, 
  Filter, Calendar, Percent, TrendingDown, Target, Layers, CloudRain, Zap, Landmark, MousePointer2, Scale, 
  AlertCircle, AlertTriangle, Leaf, Info, HelpCircle, Gauge, Timer, Globe, Tractor, ZapOff, CheckCircle, 
  Calculator, ChevronRight, PieChart as PieIcon, ArrowRight, Activity as ActivityIcon, Split, Coffee, 
  ClipboardList, ShieldAlert, ShieldX, Lightbulb, TrendingUp as TrendUpIcon, Scissors, ScatterChart
} from 'lucide-react';
import { Modal } from './UIElements';

interface StatsViewProps {
  laborFactor: number;
  movements: Movement[];
  suppliers: Supplier[];
  costCenters: CostCenter[];
  laborLogs?: LaborLog[];
  harvests?: HarvestLog[]; 
  maintenanceLogs?: MaintenanceLog[]; 
  rainLogs?: RainLog[];
  financeLogs?: FinanceLog[]; 
  machines?: Machine[];
  budgets?: BudgetPlan[];
  plannedLabors?: PlannedLabor[];
}

export const StatsView: React.FC<StatsViewProps> = ({ 
    laborFactor,
    movements, 
    suppliers, 
    costCenters,
    laborLogs = [],
    harvests = [],
    maintenanceLogs = [],
    rainLogs = [],
    financeLogs = [],
    machines = [],
    budgets = [],
    plannedLabors = []
}) => {
  const today = new Date();
  const firstDayOfYear = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
  const lastDayOfYear = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
  const currentYear = today.getFullYear();

  const [startDate, setStartDate] = useState<string>(firstDayOfYear);
  const [endDate, setEndDate] = useState<string>(lastDayOfYear);
  const [useDateFilter, setUseDateFilter] = useState(true);
  const [reportMode, setReportMode] = useState<'bi' | 'economics' | 'global'>('bi');
  const [showDensityAnalysis, setShowDensityAnalysis] = useState(false);

  const filterByDate = (dateString: string) => {
      if (!useDateFilter) return true;
      const date = new Date(dateString);
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
  };

  const filteredMovements = useMemo(() => movements.filter(m => filterByDate(m.date)), [movements, startDate, endDate, useDateFilter]);
  const filteredLabor = useMemo(() => laborLogs.filter(l => filterByDate(l.date)), [laborLogs, startDate, endDate, useDateFilter]);
  const filteredHarvests = useMemo(() => harvests.filter(h => filterByDate(h.date)), [harvests, startDate, endDate, useDateFilter]);

  // --- KPI: COSTO POR ARROBA CPS (CENICAFÉ) ---
  const economicAudit = useMemo(() => {
      const totalSupplies = filteredMovements.filter(m => m.type === 'OUT').reduce((a, b) => a + b.calculatedCost, 0);
      const totalLabor = filteredLabor.reduce((a, b) => a + b.value, 0) * laborFactor;
      const totalExpenses = totalSupplies + totalLabor;
      
      const totalKgCPS = filteredHarvests.reduce((a, b) => a + b.quantity, 0);
      const totalRevenue = filteredHarvests.reduce((a, b) => a + b.totalValue, 0);
      
      const costPerKg = totalKgCPS > 0 ? totalExpenses / totalKgCPS : 0;
      const costPerArroba = costPerKg * 12.5;
      const avgPricePerArroba = totalKgCPS > 0 ? (totalRevenue / totalKgCPS) * 12.5 : 0;
      
      const isCrisis = totalKgCPS > 0 && costPerArroba > avgPricePerArroba;

      return { totalExpenses, totalKgCPS, totalRevenue, costPerKg, costPerArroba, avgPricePerArroba, isCrisis };
  }, [filteredMovements, filteredLabor, filteredHarvests, laborFactor]);

  // --- MOTOR DE BI: EFICIENCIA DE RECOLECCIÓN (Kg/Hombre/Día) ---
  const collectionEfficiency = useMemo(() => {
      const logs = filteredHarvests.filter(h => h.collectorsCount && h.collectorsCount > 0);
      if (logs.length === 0) return { avgKgManDay: 0, status: 'N/A', suggestion: 'Inicie el registro de recolectores en Ventas para ver métricas.' };
      
      const totalKg = logs.reduce((a, b) => a + b.quantity, 0);
      const totalCollectors = logs.reduce((a, b) => a + (b.collectorsCount || 0), 0);
      const avg = totalKg / totalCollectors;
      
      let status = 'Óptimo';
      let suggestion = 'Mantener ritmo actual. Rendimiento competitivo.';
      if (avg < 80) {
          status = 'Bajo';
          suggestion = 'Sugerencia Táctica: Implementar Lonas de Cosecha Asistida o Retener pases por baja oferta de fruto.';
      } else if (avg < 120) {
          status = 'Normal';
          suggestion = 'Rendimiento estándar del sector. Evaluar incentivos.';
      }

      return { avgKgManDay: avg, status, suggestion };
  }, [filteredHarvests]);

  // --- ANÁLISIS DE PARETO (DISTRIBUCIÓN REAL DE COSTOS) ---
  const paretoAnalysis = useMemo(() => {
      const costs = {
          'Recolección': 0,
          'Fertilización': 0,
          'Mantenimiento': 0,
          'Otros': 0
      };

      filteredLabor.forEach(l => {
          const val = l.value * laborFactor;
          if (l.activityName.toLowerCase().includes('recol')) costs['Recolección'] += val;
          else if (l.activityName.toLowerCase().includes('fert')) costs['Fertilización'] += val;
          else costs['Mantenimiento'] += val;
      });

      filteredMovements.filter(m => m.type === 'OUT').forEach(m => {
          if (m.itemName.toLowerCase().includes('abono') || m.itemName.toLowerCase().includes('fert')) costs['Fertilización'] += m.calculatedCost;
          else costs['Otros'] += m.calculatedCost;
      });

      const total = Object.values(costs).reduce((a, b) => a + b, 0) || 1;
      return Object.entries(costs).map(([label, value]) => ({
          label,
          value,
          percent: (value / total) * 100
      })).sort((a, b) => b.value - a.value);
  }, [filteredLabor, filteredMovements, laborFactor]);

  // --- CORRELACIÓN DENSIDAD VS RENTABILIDAD ---
  const densityAnalysis = useMemo(() => {
    const results = costCenters.map(lot => {
        if (!lot.area || lot.area === 0) {
            return { ...lot, density: 0, productivityKgHa: 0, profitabilityHa: 0, isLowDensity: false, totalCost: 0, totalIncome: 0 };
        }
        
        const density = (lot.plantCount || 0) / lot.area;

        const lotHarvests = filteredHarvests.filter(h => h.costCenterId === lot.id);
        const totalKg = lotHarvests.reduce((sum, h) => sum + h.quantity, 0);
        const productivityKgHa = totalKg / lot.area;
        const totalIncome = lotHarvests.reduce((sum, h) => sum + h.totalValue, 0);

        const lotLabor = filteredLabor.filter(l => l.costCenterId === lot.id).reduce((sum, l) => sum + l.value, 0) * laborFactor;
        const lotInputs = filteredMovements.filter(m => m.costCenterId === lot.id && m.type === 'OUT').reduce((sum, m) => sum + m.calculatedCost, 0);
        const totalCost = lotLabor + lotInputs;

        const profitabilityHa = (totalIncome - totalCost) / lot.area;

        return { ...lot, density, productivityKgHa, profitabilityHa, isLowDensity: density < 6000, totalCost, totalIncome };
    }).sort((a,b) => b.profitabilityHa - a.profitabilityHa);

    const lowDensityLots = results.filter(r => r.isLowDensity);
    const optimalLots = results.filter(r => !r.isLowDensity);

    const avgProfitLow = lowDensityLots.length > 0 ? lowDensityLots.reduce((sum, l) => sum + l.profitabilityHa, 0) / lowDensityLots.length : 0;
    const avgProfitOptimal = optimalLots.length > 0 ? optimalLots.reduce((sum, l) => sum + l.profitabilityHa, 0) / optimalLots.length : 0;
    
    const profitDifference = avgProfitOptimal > 0 && avgProfitLow < avgProfitOptimal ? ((avgProfitOptimal - avgProfitLow) / avgProfitOptimal) * 100 : 0;

    return { lots: results, avgProfitLow, avgProfitOptimal, profitDifference };
  }, [costCenters, filteredHarvests, filteredLabor, filteredMovements, laborFactor]);

  const renderScatterPlot = () => {
    const dataPoints = densityAnalysis.lots.filter(d => d.density > 0 && d.productivityKgHa > 0);
    if (dataPoints.length === 0) return <div className="text-center text-xs text-slate-500 py-4">Faltan datos de área o producción para generar la gráfica.</div>;

    const padding = 30;
    const width = 500;
    const height = 250;
    
    const maxDensity = Math.max(...dataPoints.map(d => d.density), 8000) * 1.1;
    const maxProd = Math.max(...dataPoints.map(d => d.productivityKgHa), 1000) * 1.1;
    
    const xScale = (d: number) => padding + (d / maxDensity) * (width - 2 * padding);
    const yScale = (p: number) => height - padding - (p / maxProd) * (height - 2 * padding);

    return (
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-4 overflow-hidden">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-4 text-center flex items-center justify-center gap-2"><ActivityIcon className="w-3 h-3"/> Correlación Visual (Dispersión)</p>
            <div className="w-full overflow-x-auto scrollbar-hide">
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="mx-auto">
                    {/* Axes */}
                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#475569" strokeWidth="1" />
                    <line x1={padding} y1={height - padding} x2={padding} y2={padding} stroke="#475569" strokeWidth="1" />
                    
                    {/* Threshold Line 6000 */}
                    <line x1={xScale(6000)} y1={padding} x2={xScale(6000)} y2={height - padding} stroke="#ef4444" strokeWidth="1" strokeDasharray="4 4" />
                    <text x={xScale(6000)} y={padding - 5} fill="#ef4444" fontSize="9" textAnchor="middle" fontWeight="bold">6.000 Árb/Ha (Límite)</text>

                    {/* Points */}
                    {dataPoints.map((point, i) => (
                        <g key={i} className="group/point">
                            <circle 
                                cx={xScale(point.density)} 
                                cy={yScale(point.productivityKgHa)} 
                                r="5" 
                                fill={point.isLowDensity ? "#ef4444" : "#10b981"} 
                                stroke="#1e293b"
                                strokeWidth="2"
                                className="hover:r-7 transition-all cursor-pointer opacity-80 hover:opacity-100"
                            />
                            {/* Tooltip Simulation via SVG */}
                            <g className="opacity-0 group-hover/point:opacity-100 transition-opacity">
                                <rect x={Math.min(xScale(point.density), width - 90)} y={yScale(point.productivityKgHa) - 35} width="90" height="30" rx="4" fill="#0f172a" stroke="#334155" />
                                <text x={Math.min(xScale(point.density) + 45, width - 45)} y={yScale(point.productivityKgHa) - 20} fill="white" fontSize="9" textAnchor="middle" fontWeight="bold">
                                    {point.name}
                                </text>
                                <text x={Math.min(xScale(point.density) + 45, width - 45)} y={yScale(point.productivityKgHa) - 10} fill="#94a3b8" fontSize="8" textAnchor="middle">
                                    {point.density.toFixed(0)} árb/Ha
                                </text>
                            </g>
                        </g>
                    ))}
                    
                    {/* Axis Labels */}
                    <text x={width / 2} y={height - 5} fill="#94a3b8" fontSize="9" textAnchor="middle" fontWeight="bold">Densidad de Siembra (Árboles/Ha)</text>
                    <text x={10} y={height / 2} fill="#94a3b8" fontSize="9" textAnchor="middle" fontWeight="bold" transform={`rotate(-90, 10, ${height/2})`}>Prod (Kg/Ha)</text>
                </svg>
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
       {/* FILTRO DE FECHAS */}
       <div className="bg-white dark:bg-slate-800 p-5 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between sticky top-[120px] z-30">
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="p-2 bg-indigo-600 rounded-xl shrink-0"><Calendar className="w-4 h-4 text-white" /></div>
                <div className="text-left">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Analítica de Negocio</p>
                    <p className="text-xs font-black text-slate-800 dark:text-white mt-1">Hacienda Tabares Franco</p>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-slate-100 dark:bg-slate-900 p-2 rounded-2xl border dark:border-slate-700 w-full md:w-auto">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent border-none text-[10px] font-black text-slate-600 dark:text-emerald-400 outline-none p-1 w-full sm:w-auto text-center" />
                <ArrowRight className="w-3 h-3 text-slate-400 hidden sm:block" />
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent border-none text-[10px] font-black text-slate-600 dark:text-emerald-400 outline-none p-1 w-full sm:w-auto text-center" />
            </div>
       </div>

       {/* ALERTA DE CRISIS ECONÓMICA */}
       {economicAudit.isCrisis && (
           <div className="bg-red-950 border-4 border-red-500 p-6 md:p-8 rounded-[3rem] shadow-2xl animate-shake relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldX className="w-32 h-32 text-white" /></div>
               <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                   <div className="p-5 bg-red-600 rounded-3xl shadow-xl shadow-red-900/50"><AlertTriangle className="w-12 h-12 text-white" /></div>
                   <div className="text-center md:text-left flex-1">
                       <h3 className="text-white font-black text-2xl uppercase tracking-tighter mb-1">¡Sobrecosto de Producción!</h3>
                       <p className="text-red-200 text-sm font-bold leading-snug">
                           El costo por arroba (<span className="text-white font-mono">{formatCurrency(economicAudit.costPerArroba)}</span>) supera el precio de venta. Revise la eficiencia de recolección.
                       </p>
                   </div>
               </div>
           </div>
       )}

       <div className="flex p-1.5 bg-slate-200 dark:bg-slate-900 rounded-2xl gap-1 overflow-x-auto scrollbar-hide">
           <button onClick={() => setReportMode('bi')} className={`flex-1 min-w-[80px] py-3 text-[10px] font-black uppercase rounded-xl transition-all ${reportMode === 'bi' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Monitor BI</button>
           <button onClick={() => setReportMode('economics')} className={`flex-1 min-w-[80px] py-3 text-[10px] font-black uppercase rounded-xl transition-all ${reportMode === 'economics' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Costo/@ CPS</button>
           <button onClick={() => setReportMode('global')} className={`flex-1 min-w-[80px] py-3 text-[10px] font-black uppercase rounded-xl transition-all ${reportMode === 'global' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Balance Real</button>
       </div>

       {reportMode === 'bi' && (
           <div className="space-y-6 animate-slide-up">
                {/* MONITOR EFICIENCIA RECOLECCIÓN */}
                <div className="bg-slate-900 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><ActivityIcon className="w-40 h-40 text-white" /></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-center md:text-left">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Rendimiento Cosecha (K/H/D)</p>
                            <h4 className="text-4xl md:text-5xl font-black text-white font-mono tracking-tighter">{collectionEfficiency.avgKgManDay.toFixed(1)} <span className="text-xl">Kg</span></h4>
                            <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${collectionEfficiency.status === 'Bajo' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-emerald-500/10 border-emerald-500 text-emerald-500'}`}>
                                {collectionEfficiency.status === 'Bajo' ? <ZapOff className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                                Estatus: {collectionEfficiency.status}
                            </div>
                        </div>
                        <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 flex-1 max-w-sm w-full">
                            <div className="flex items-start gap-3">
                                <Lightbulb className="w-6 h-6 text-yellow-400 shrink-0" />
                                <div>
                                    <p className="text-xs font-black text-white uppercase mb-1 italic">Análisis Táctico</p>
                                    <p className="text-[11px] text-slate-400 leading-snug">{collectionEfficiency.suggestion}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* PARETO COSTOS */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <PieIcon className="w-4 h-4 text-emerald-500" /> Pareto de Costos (Ley 80/20)
                        </h4>
                        <div className="space-y-4">
                            {paretoAnalysis.map(p => (
                                <div key={p.label}>
                                    <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                                        <span className="text-slate-400">{p.label}</span>
                                        <span className="text-white">{p.percent.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                                        <div className={`h-full ${p.label === 'Recolección' ? 'bg-indigo-500' : 'bg-emerald-500'}`} style={{ width: `${p.percent}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* NUEVA TARJETA DE ANÁLISIS DE DENSIDAD */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Split className="w-4 h-4 text-indigo-500" /> Densidad vs. Rentabilidad
                        </h4>
                        <div className="flex-1 flex flex-col items-center justify-center text-center bg-slate-100 dark:bg-slate-900/50 rounded-2xl p-6 border dark:border-slate-800">
                            <p className="text-3xl font-black text-white font-mono">
                                {densityAnalysis.profitDifference.toFixed(1)}<span className="text-lg text-red-500">%</span>
                            </p>
                            <p className="text-[10px] text-red-400 font-black uppercase mt-1">Menos Rentables</p>
                            <p className="text-[10px] text-slate-500 mt-2 max-w-xs">
                                Lotes con menos de 6,000 árb/Ha están subutilizando el área y diluyendo menos los costos fijos.
                            </p>
                        </div>
                        <button onClick={() => setShowDensityAnalysis(true)} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl text-xs uppercase flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95">
                            <BarChart3 className="w-4 h-4" /> Correlación Densidad/Prod.
                        </button>
                    </div>
                </div>
           </div>
       )}

       {reportMode === 'economics' && (
            <div className="space-y-6 animate-slide-up">
                <div className="bg-slate-900 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-slate-800 shadow-2xl space-y-8">
                    <div className="flex justify-between items-center">
                        <h4 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-3">
                            <Calculator className="w-5 h-5 text-emerald-500" /> Auditoría de Costo Unitario
                        </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="text-center md:text-left space-y-2">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Costo por Arroba CPS (12.5 Kg)</p>
                            <p className={`text-4xl md:text-5xl font-black font-mono tracking-tighter ${economicAudit.isCrisis ? 'text-red-500' : 'text-white'}`}>
                                {formatCurrency(economicAudit.costPerArroba)}
                            </p>
                        </div>
                        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col justify-center">
                            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase mb-2"><span>Referencia Mercado</span><span>{formatCurrency(economicAudit.avgPricePerArroba)} / @</span></div>
                            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                                <div className={`h-full transition-all duration-1000 ${economicAudit.isCrisis ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min((economicAudit.costPerArroba / (economicAudit.avgPricePerArroba || 1)) * 100, 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
       )}

       {reportMode === 'global' && (
           <div className="bg-white dark:bg-slate-800 rounded-[2rem] md:rounded-[3rem] border border-slate-200 dark:border-slate-700 p-6 md:p-8 shadow-xl space-y-6 animate-slide-up">
                <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-500 uppercase flex items-center gap-2 tracking-widest"><Scale className="w-4 h-4" /> Utilidad Real del Período</h3>
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-end"><span className="text-slate-500 font-bold text-sm">Ventas Brutas</span><span className="font-mono font-black text-emerald-600 text-lg md:text-xl">+ {formatCurrency(economicAudit.totalRevenue)}</span></div>
                    <div className="flex justify-between items-end"><span className="text-slate-500 font-bold text-sm">Gastos Operativos (Costo Real)</span><span className="font-mono font-black text-red-500 text-lg md:text-xl">- {formatCurrency(economicAudit.totalExpenses)}</span></div>
                    <div className="w-full h-px bg-slate-100 dark:bg-slate-700 my-4"></div>
                    <div className="flex justify-between items-center"><span className="text-slate-800 dark:text-white font-black text-lg uppercase tracking-tighter">Utilidad Neta</span><span className={`text-2xl md:text-3xl font-black font-mono ${economicAudit.totalRevenue - economicAudit.totalExpenses >= 0 ? 'text-indigo-500' : 'text-red-500'}`}>{formatCurrency(economicAudit.totalRevenue - economicAudit.totalExpenses)}</span></div>
                </div>
           </div>
       )}

       <div className="p-8 text-center bg-slate-900/10 rounded-[3rem] border border-slate-800/30">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">Propiedad Intelectual de Lucas Mateo Tabares Franco</p>
            <p className="text-[8px] text-slate-600 mt-1">Software de Gestión Local Offline | DatosFinca Viva PRO</p>
       </div>

        <Modal isOpen={showDensityAnalysis} onClose={() => setShowDensityAnalysis(false)} title="Análisis Densidad vs. Productividad" icon={Split} maxWidth="max-w-3xl">
            <div className="space-y-4">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex items-start gap-3">
                    <Info className="w-5 h-5 text-indigo-400 shrink-0" />
                    <p className="text-[11px] text-slate-400 italic">
                        Este análisis cruza la densidad de siembra con los costos y ventas reales para identificar lotes sub-óptimos que impactan la rentabilidad global al no cubrir los costos fijos por hectárea.
                    </p>
                </div>

                {renderScatterPlot()}

                <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-inner max-h-80 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-[10px] text-left">
                        <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-tighter sticky top-0">
                            <tr>
                                <th className="p-3">Lote</th>
                                <th className="p-3 text-center">Densidad<br/>(á/Ha)</th>
                                <th className="p-3 text-center">Productividad<br/>(Kg/Ha)</th>
                                <th className="p-3 text-right">Rentabilidad<br/>($/Ha)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {densityAnalysis.lots.map(lot => (
                                <tr key={lot.id} className={`${lot.isLowDensity ? 'bg-red-900/10 hover:bg-red-900/20' : 'hover:bg-slate-800/50'}`}>
                                    <td className="p-3 font-bold text-slate-200">{lot.name}</td>
                                    <td className={`p-3 text-center font-mono font-black ${lot.isLowDensity ? 'text-red-400' : 'text-slate-300'}`}>
                                        {lot.density.toLocaleString(undefined, {maximumFractionDigits: 0})}
                                    </td>
                                    <td className="p-3 text-center font-mono font-black text-slate-300">
                                        {lot.productivityKgHa.toLocaleString(undefined, {maximumFractionDigits: 0})}
                                    </td>
                                    <td className={`p-3 text-right font-mono font-black ${lot.profitabilityHa > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {formatCurrency(lot.profitabilityHa)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="bg-emerald-900/10 p-4 rounded-xl border border-emerald-500/20 flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-emerald-400 shrink-0" />
                    <p className="text-[11px] text-emerald-200">
                        <strong className="uppercase">Recomendación Estratégica:</strong> Los lotes con densidades bajas muestran menor rentabilidad. Considere renovarlos con arreglos espaciales más intensivos (7,500-8,000 árb/Ha) para maximizar el uso de la tierra y diluir costos fijos.
                    </p>
                </div>
            </div>
        </Modal>

    </div>
  );
};
