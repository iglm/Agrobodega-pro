
import React, { useState, useMemo } from 'react';
import { 
  Calculator, Sprout, TrendingUp, DollarSign, Clock, Layers, Zap, 
  Target, Wallet, Pickaxe, ArrowRight, Percent, Scale, 
  BarChart3, Lightbulb, Coffee, Info, AlertTriangle, 
  CheckCircle2, Timer, FileDown, Rocket, TreePine, Map,
  ChevronDown, ChevronUp, Minus, Plus, Users, Beaker,
  TrendingDown, ShieldAlert, BarChart, Landmark, Scissors, Wand2,
  Home, Leaf, RefreshCw, Briefcase, BadgeDollarSign, Table, AlertOctagon, Search
} from 'lucide-react';
import { formatCurrency, formatNumberInput, parseNumberInput } from '../services/inventoryService';
import { generateSimulationPDF } from '../services/reportService';

interface SimulationYear {
    year: number;
    totalProductionKg: number;
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
    cumulativeFlow: number;
    label: string;
    
    // Cost Structure
    fixedCost: number; // Maintenance, Admin, Inputs (IPC Inflation)
    variableCost: number; // Harvest (Labor Inflation)
    
    // Metrics
    costPerCarga: number; // The golden metric
    marginPercent: number;
    laborUnitCost: number; // Cost per Kg of harvest this year
    
    isLiquidityCrisis: boolean;
    opex: number;
    capex: number;
}

type PriceTrend = 'Stable' | 'Optimistic' | 'Pessimistic';

export const SimulatorView: React.FC = () => {
    // 1. INVENTARIO (BIOLÓGICO)
    const [treesInRenovation, setTreesInRenovation] = useState('2000'); 
    const [treesInLevante, setTreesInLevante] = useState('3000');     
    const [treesInProduction, setTreesInProduction] = useState('5000'); 
    const [density, setDensity] = useState('6000'); 

    // 2. PARÁMETROS MACROECONÓMICOS (FINANCIERO)
    const [currentMarketPrice, setCurrentMarketPrice] = useState('1900000'); // Precio Carga Hoy
    const [expectedPriceTrend, setExpectedPriceTrend] = useState<PriceTrend>('Stable');
    const [harvestCostPerKg, setHarvestCostPerKg] = useState('850'); // Recolección manual hoy
    
    const [laborInflation, setLaborInflation] = useState('10'); // Inflación Mano de Obra (Alta)
    const [generalInflation, setGeneralInflation] = useState('5'); // IPC (Insumos/Admin)
    
    const [baseMaintenanceCost, setBaseMaintenanceCost] = useState('12000000'); // Costo fijo por Ha/Año (Sostenimiento)
    const [initialCapital, setInitialCapital] = useState('20000000');

    const [expandedYear, setExpandedYear] = useState<number | null>(null);

    const simulation = useMemo(() => {
        const qRenov = parseNumberInput(treesInRenovation);
        const qLev = parseNumberInput(treesInLevante);
        const qProd = parseNumberInput(treesInProduction);
        const totalTrees = qRenov + qLev + qProd;
        const dens = parseNumberInput(density) || 1;
        const totalHectares = totalTrees / dens;
        
        const basePriceCarga = parseNumberInput(currentMarketPrice);
        const baseHarvestCost = parseNumberInput(harvestCostPerKg);
        const baseMaintHa = parseNumberInput(baseMaintenanceCost);
        const laborInfRate = parseNumberInput(laborInflation) / 100;
        const generalInfRate = parseNumberInput(generalInflation) / 100;
        const initCap = parseNumberInput(initialCapital);
        
        // Base price per Kg for fallback/calculation
        const basePriceKg = basePriceCarga / 125;

        // --- MOTOR BIOLÓGICO ---
        const getProductionPotential = (age: number) => {
            // Curva de Producción (Kg Cereza/Arbol/Año aprox)
            // Asumiendo 1 Ha = 6000 arb = ~15.000 Kg Cereza (25 Cargas) en pico
            const peakYieldPerTree = 2.5; // Kg Cereza
            
            if (age <= 2) return 0;
            if (age === 3) return peakYieldPerTree * 0.4; // Graneo
            if (age >= 4 && age <= 6) return peakYieldPerTree; // Pico
            if (age >= 7) return peakYieldPerTree * 0.75; // Declive
            return 0;
        };

        const yearlyData: SimulationYear[] = [];
        let cumulative = initCap;
        let paybackYear: number | null = null;
        let totalCapexCalc = 0;
        let firstMonthCrisis: number | null = null;

        for (let year = 1; year <= 6; year++) {
            // A. INFLACIONADORES (INTERÉS COMPUESTO)
            const laborIndex = Math.pow(1 + laborInfRate, year - 1);
            const generalIndex = Math.pow(1 + generalInfRate, year - 1);
            
            // B. PRECIO DE VENTA (SCENARIO)
            let priceModifier = 1;
            if (expectedPriceTrend === 'Optimistic') priceModifier = Math.pow(1.05, year - 1);
            if (expectedPriceTrend === 'Pessimistic') priceModifier = Math.pow(0.95, year - 1);
            
            const currentPriceCarga = basePriceCarga * priceModifier;
            const currentPriceKg = currentPriceCarga / 125; // Precio venta Kg

            // C. COSTOS UNITARIOS DEL AÑO
            const currentHarvestCost = baseHarvestCost * laborIndex; // Costo recolección inflado
            const currentMaintPerHa = baseMaintHa * generalIndex; // Costo sostenimiento inflado

            // D. CÁLCULO POR LOTE (COHORTES)
            // Lote 1: Renovación (Empieza edad 1)
            const prodRenov = qRenov * getProductionPotential(year);
            // Lote 2: Levante (Empieza edad 2)
            const prodLev = qLev * getProductionPotential(year + 1);
            // Lote 3: Producción (Empieza edad 4)
            const prodProd = qProd * getProductionPotential(year + 3);

            const totalProductionKg = prodRenov + prodLev + prodProd;
            
            // E. INGRESOS
            const totalIncome = totalProductionKg * currentPriceKg;

            // F. EGRESOS
            // 1. Variable (Recolección): Directamente proporcional a la producción
            const variableCost = totalProductionKg * currentHarvestCost;

            // 2. Fijo (Sostenimiento): Fertilizante, Limpias, Admin. Proporcional a Hectáreas.
            // Ajustamos factor de intensidad por etapa
            const haRenov = qRenov / dens;
            const haLev = qLev / dens;
            const haProd = qProd / dens;

            const fixedCost = (
                (haRenov * currentMaintPerHa * 1.5) + 
                (haLev * currentMaintPerHa * 0.8) + 
                (haProd * currentMaintPerHa)
            );

            const totalExpenses = variableCost + fixedCost;
            const netCashFlow = totalIncome - totalExpenses;
            
            cumulative += netCashFlow;
            
            // Metrics
            const totalCargas = totalProductionKg / 125;
            const costPerCarga = totalCargas > 0 ? totalExpenses / totalCargas : 0;
            const marginPercent = totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : -100;

            if (cumulative < 0 && firstMonthCrisis === null) firstMonthCrisis = year;
            if (paybackYear === null && cumulative > initCap) paybackYear = year;

            yearlyData.push({
                year,
                label: `Año ${year}`,
                totalProductionKg,
                totalIncome,
                totalExpenses,
                fixedCost,
                variableCost,
                netCashFlow,
                cumulativeFlow: cumulative,
                costPerCarga,
                marginPercent,
                laborUnitCost: currentHarvestCost,
                isLiquidityCrisis: netCashFlow < 0,
                opex: totalExpenses, 
                capex: 0 // Integrated
            });
        }

        const vpn = yearlyData.reduce((acc, y) => acc + (y.netCashFlow / Math.pow(1.12, y.year)), 0);
        const roi = (vpn / (initCap || 1)) * 100;

        // --- CÁLCULO UNITARIO (PER TREE) - AÑO 5 (MADUREZ) ---
        const refYear = yearlyData[4]; // Año 5
        const safeTotalTrees = totalTrees || 1;
        const perTreeAnalysis = {
            maintenance: refYear ? refYear.fixedCost / safeTotalTrees : 0,
            harvest: refYear ? refYear.variableCost / safeTotalTrees : 0,
            totalCost: refYear ? refYear.totalExpenses / safeTotalTrees : 0,
            revenue: refYear ? refYear.totalIncome / safeTotalTrees : 0,
            profit: refYear ? refYear.netCashFlow / safeTotalTrees : 0,
            totalTrees
        };

        // --- ANÁLISIS DE SENSIBILIDAD (STRESS TEST AÑO 5) ---
        const stableYear = yearlyData[4]; 
        
        // Determinar el precio de referencia usado en el año 5 (incluyendo tendencia)
        const refPriceKg = stableYear && stableYear.totalProductionKg > 0 
            ? stableYear.totalIncome / stableYear.totalProductionKg 
            : basePriceKg;

        const baseScenario = {
            label: "Base",
            price: stableYear?.totalIncome || 0,
            cost: stableYear?.totalExpenses || 0,
            margin: stableYear?.netCashFlow || 0,
            icon: Minus, color: 'text-blue-500'
        };

        // Escenario Ácido: Precio cae 15%, Costo Mano de Obra sube 5% extra
        const acidIncome = (stableYear?.totalProductionKg || 0) * (refPriceKg * 0.85); // Usando precio referencia ajustado
        // Recálculo aproximado de costo ácido
        const acidVarCost = (stableYear?.variableCost || 0) * 1.05; 
        const acidExp = (stableYear?.fixedCost || 0) + acidVarCost;
        const acidScenario = {
            label: "Pesimista (-15% Precio)",
            price: acidIncome,
            cost: acidExp,
            margin: acidIncome - acidExp,
            icon: TrendingDown, color: 'text-red-500'
        };

        // Escenario Ideal: Precio sube 15%
        const optIncome = (stableYear?.totalProductionKg || 0) * (refPriceKg * 1.15);
        const optScenario = {
            label: "Optimista (+15% Precio)",
            price: optIncome,
            cost: stableYear?.totalExpenses || 0, // Costos base
            margin: optIncome - (stableYear?.totalExpenses || 0),
            icon: TrendingUp, color: 'text-emerald-500'
        };

        return {
            hectares: totalHectares, yearlyData, vpn, paybackYear, roi,
            firstMonthCrisis, initCap, 
            year5LaborCost: yearlyData[4]?.laborUnitCost || 0,
            avgCostPerCarga: yearlyData.reduce((a,b)=>a+b.costPerCarga,0)/6,
            sensitivity: [acidScenario, baseScenario, optScenario],
            breakevenPrice: stableYear ? stableYear.costPerCarga : 0,
            perTreeAnalysis // Nuevo objeto de análisis
        };
    }, [treesInRenovation, treesInLevante, treesInProduction, density, currentMarketPrice, harvestCostPerKg, laborInflation, generalInflation, baseMaintenanceCost, initialCapital, expectedPriceTrend]);

    return (
        <div className="space-y-6 pb-40 animate-fade-in">
            
            {/* ENCABEZADO Y PARAMETROS ECONÓMICOS */}
            <div className="bg-slate-900 p-6 md:p-8 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5"><TrendingUp className="w-64 h-64 text-emerald-500" /></div>
                
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                        <div className="p-3 bg-emerald-600 rounded-2xl shadow-lg"><Briefcase className="w-8 h-8 text-white" /></div>
                        <div>
                            <h2 className="text-white font-black text-xl md:text-2xl uppercase tracking-tighter">Simulador Financiero</h2>
                            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Estructura de Costos Café Colombia</p>
                        </div>
                    </div>

                    <div className="bg-slate-950/50 p-5 rounded-[2rem] border border-slate-800">
                        <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Scale className="w-4 h-4"/> Variables Macroeconómicas</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Precio Mercado / Carga</label>
                                <input type="text" value={formatNumberInput(currentMarketPrice)} onChange={e => setCurrentMarketPrice(parseNumberInput(e.target.value).toString())} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-black text-sm outline-none focus:border-emerald-500 text-center" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Tendencia Precio</label>
                                <select value={expectedPriceTrend} onChange={e => setExpectedPriceTrend(e.target.value as PriceTrend)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-bold text-xs outline-none">
                                    <option value="Stable">Estable (IPC)</option>
                                    <option value="Optimistic">Optimista (+5% Anual)</option>
                                    <option value="Pessimistic">Pesimista (-5% Anual)</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-red-400 uppercase ml-1 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Inflación Laboral %</label>
                                <input type="number" value={laborInflation} onChange={e => setLaborInflation(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-black text-sm outline-none focus:border-red-500 text-center" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Costo Recolección / Kg</label>
                                <input type="text" value={formatNumberInput(harvestCostPerKg)} onChange={e => setHarvestCostPerKg(parseNumberInput(e.target.value).toString())} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-black text-sm outline-none text-center" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-2">
                            <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Capital Inicial (Caja)</label>
                            <input type="text" value={formatNumberInput(initialCapital)} onChange={e => setInitialCapital(parseNumberInput(e.target.value).toString())} className="w-full bg-slate-900 border-none rounded-xl p-3 text-emerald-400 font-mono font-black text-lg outline-none" />
                        </div>
                        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-2">
                            <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Costo Sostenimiento Base / Ha</label>
                            <input type="text" value={formatNumberInput(baseMaintenanceCost)} onChange={e => setBaseMaintenanceCost(parseNumberInput(e.target.value).toString())} className="w-full bg-slate-900 border-none rounded-xl p-3 text-white font-mono font-bold text-lg outline-none" />
                            <p className="text-[9px] text-slate-600">Incluye: Fertilizantes, limpias, administración (Sin recolección).</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* INPUTS DE INVENTARIO */}
            <div className="grid grid-cols-3 gap-3 bg-white dark:bg-slate-800 p-4 rounded-[2rem] shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                    <label className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1 mb-1"><Sprout className="w-3 h-3" /> Renovación</label>
                    <input type="text" value={formatNumberInput(treesInRenovation)} onChange={e => setTreesInRenovation(parseNumberInput(e.target.value).toString())} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-center text-slate-800 dark:text-white font-mono font-bold outline-none" />
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                    <label className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase flex items-center gap-1 mb-1"><Leaf className="w-3 h-3" /> Levante</label>
                    <input type="text" value={formatNumberInput(treesInLevante)} onChange={e => setTreesInLevante(parseNumberInput(e.target.value).toString())} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-center text-slate-800 dark:text-white font-mono font-bold outline-none" />
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                    <label className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase flex items-center gap-1 mb-1"><TreePine className="w-3 h-3" /> Producción</label>
                    <input type="text" value={formatNumberInput(treesInProduction)} onChange={e => setTreesInProduction(parseNumberInput(e.target.value).toString())} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-center text-slate-800 dark:text-white font-mono font-bold outline-none" />
                </div>
            </div>

            {/* KPIS FINANCIEROS ESTRATÉGICOS */}
            <div className="space-y-4">
                <h3 className="text-slate-800 dark:text-white font-black text-sm uppercase flex items-center gap-3 px-4 tracking-widest">
                    <Target className="w-5 h-5 text-emerald-500" /> Tablero de Rentabilidad
                </h3>

                {/* Strategic Row (3 Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* ROI */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-lg relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2">
                            <div className={`p-2 rounded-xl ${simulation.roi >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">Rendimiento (TIR)</p>
                        </div>
                        <p className={`text-3xl font-black font-mono ${simulation.roi >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                            {simulation.roi.toFixed(1)}%
                        </p>
                        <p className="text-[10px] text-slate-500 mt-2 leading-tight">Rendimiento global del capital a 6 años.</p>
                    </div>

                    {/* Payback */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-lg relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                                <Timer className="w-5 h-5" />
                            </div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">Retorno Inversión</p>
                        </div>
                        <p className="text-3xl font-black text-slate-800 dark:text-white font-mono">
                            {simulation.paybackYear ? `Año ${simulation.paybackYear}` : "N/A"}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-2 leading-tight">Momento en que recuperas tu capital inicial.</p>
                    </div>

                    {/* VPN */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-lg relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600">
                                <Landmark className="w-5 h-5" />
                            </div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">Valor Presente Neto</p>
                        </div>
                        <p className="text-3xl font-black text-slate-800 dark:text-white font-mono truncate">
                            {formatCurrency(simulation.vpn)}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-2 leading-tight">Ganancia real descontando inflación hoy.</p>
                    </div>
                </div>

                {/* Operational Row (Secondary) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase">Costo Prod. (@)</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Promedio ciclo</p>
                        </div>
                        <p className="text-lg font-black font-mono text-slate-800 dark:text-white">{formatCurrency(simulation.avgCostPerCarga)}</p>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase">Punto Equilibrio (@)</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Año 5 (Pico)</p>
                        </div>
                        <p className="text-lg font-black font-mono text-slate-800 dark:text-white">{formatCurrency(simulation.breakevenPrice)}</p>
                    </div>
                </div>
            </div>

            {/* UNIT ANALYSIS SECTION (NUEVO) */}
            <div className="space-y-4 animate-slide-up">
                <h3 className="text-slate-800 dark:text-white font-black text-sm uppercase flex items-center gap-3 px-4 tracking-widest">
                    <Search className="w-5 h-5 text-indigo-400" /> Análisis Unitario: ¿Cuánto vale cada Árbol?
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Card 1: Cost */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-lg relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-xl">
                                <Pickaxe className="w-5 h-5" />
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Inversión Anual</p>
                        </div>
                        <p className="text-2xl font-black text-slate-800 dark:text-white font-mono">
                            {formatCurrency(simulation.perTreeAnalysis.totalCost)}
                        </p>
                        <div className="mt-3 space-y-1 text-[10px] text-slate-500 font-medium border-t border-slate-100 dark:border-slate-700 pt-2">
                            <div className="flex justify-between">
                                <span>Sostenimiento:</span>
                                <span className="font-bold">{formatCurrency(simulation.perTreeAnalysis.maintenance)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Recolección:</span>
                                <span className="font-bold">{formatCurrency(simulation.perTreeAnalysis.harvest)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Revenue */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-lg">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                                <BadgeDollarSign className="w-5 h-5" />
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Producción Bruta</p>
                        </div>
                        <p className="text-2xl font-black text-slate-800 dark:text-white font-mono">
                            {formatCurrency(simulation.perTreeAnalysis.revenue)}
                        </p>
                        <p className="mt-3 text-[10px] text-slate-400 italic">
                            Base: Precio de mercado proyectado al año 5.
                        </p>
                    </div>

                    {/* Card 3: Profit */}
                    <div className={`p-5 rounded-[2rem] border shadow-lg flex flex-col justify-center ${simulation.perTreeAnalysis.profit >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-500/30' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-500/30'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className={`p-2 rounded-xl ${simulation.perTreeAnalysis.profit >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                <Wallet className="w-5 h-5" />
                            </div>
                            <p className={`text-[10px] font-bold uppercase ${simulation.perTreeAnalysis.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>Utilidad Neta</p>
                        </div>
                        <p className={`text-2xl font-black font-mono ${simulation.perTreeAnalysis.profit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(simulation.perTreeAnalysis.profit)}
                        </p>
                        <p className="mt-2 text-[10px] font-bold text-slate-500 uppercase">
                            ¿Cuánto te queda libre?
                        </p>
                    </div>
                </div>

                {/* Explanation Note */}
                <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex gap-3">
                    <Lightbulb className="w-5 h-5 text-yellow-500 shrink-0" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        <strong>¿Por qué este valor?</strong> Este cálculo toma los costos fijos (fertilizantes, limpias) y los divide entre tus <strong>{simulation.perTreeAnalysis.totalTrees.toLocaleString()} árboles</strong>, sumando lo que pagas por recolectar el café de cada uno en su etapa de máxima producción (Año 5).
                    </p>
                </div>
            </div>

            {/* TABLA DE FLUJO CON DESGLOSE */}
            <div className="space-y-4">
                <h3 className="text-slate-800 dark:text-white font-black text-sm uppercase flex items-center gap-3 px-4 tracking-widest"><Clock className="w-5 h-5 text-indigo-400" /> Proyección de Flujo de Caja</h3>
                <div className="space-y-3">
                    {simulation.yearlyData.map(y => {
                        const isProfit = y.netCashFlow >= 0;
                        const isExpanded = expandedYear === y.year;
                        
                        // Bar calculation
                        const maxBar = y.totalExpenses * 1.2;
                        const fixedPct = (y.fixedCost / maxBar) * 100;
                        const varPct = (y.variableCost / maxBar) * 100;

                        return (
                            <div key={y.year} className={`bg-white dark:bg-slate-900 rounded-[2.5rem] border transition-all overflow-hidden ${y.isLiquidityCrisis ? 'border-red-500/50' : isExpanded ? 'ring-2 ring-emerald-500 shadow-2xl' : 'border-slate-200 dark:border-slate-700 shadow-sm'}`}>
                                <button onClick={() => setExpandedYear(isExpanded ? null : y.year)} className="w-full text-left p-6 flex flex-col gap-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-lg transition-transform ${isExpanded ? 'scale-110 bg-emerald-500' : isProfit ? 'bg-emerald-600' : 'bg-slate-700'}`}>{y.year}</div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800 dark:text-white uppercase italic flex items-center gap-2">{y.label}{isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</p>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase">Costo @: {formatCurrency(y.costPerCarga)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-xl font-black font-mono leading-none ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>{isProfit ? '+' : ''}{formatCurrency(y.netCashFlow)}</p>
                                            <p className={`text-[9px] font-black uppercase mt-1 ${y.marginPercent < 15 ? 'text-red-400' : 'text-slate-500'}`}>Margen: {y.marginPercent.toFixed(1)}%</p>
                                        </div>
                                    </div>

                                    {/* VISUALIZACIÓN DE COSTOS APILADOS */}
                                    <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex relative">
                                        <div className="h-full bg-blue-500" style={{ width: `${fixedPct}%` }}></div>
                                        <div className="h-full bg-red-500" style={{ width: `${varPct}%` }}></div>
                                        {/* Legend inside bar if expanded */}
                                        {isExpanded && (
                                            <div className="absolute inset-0 flex justify-between px-2 items-center text-[8px] font-black text-white uppercase pointer-events-none">
                                                <span>Fijo</span>
                                                <span>Recolección</span>
                                            </div>
                                        )}
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="px-6 pb-6 pt-2 bg-slate-50 dark:bg-slate-950/50 animate-fade-in-down">
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <div>
                                                <p className="text-[9px] font-black text-blue-500 uppercase">Costos Fijos (IPC)</p>
                                                <p className="text-sm font-mono font-bold text-slate-700 dark:text-white">{formatCurrency(y.fixedCost)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-red-500 uppercase">Costo Recolección (M.O)</p>
                                                <p className="text-sm font-mono font-bold text-slate-700 dark:text-white">{formatCurrency(y.variableCost)}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-500/20 text-center">
                                            <p className="text-[10px] text-indigo-500 font-black uppercase">Ingreso Total (Prod: {Math.round(y.totalProductionKg).toLocaleString()} Kg)</p>
                                            <p className="text-lg font-black text-indigo-700 dark:text-indigo-300 font-mono">{formatCurrency(y.totalIncome)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ANÁLISIS DE SENSIBILIDAD (STRESS TEST) */}
            <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-6 shadow-2xl space-y-6">
                <div className="flex items-center gap-3">
                    <div className="bg-orange-500/20 p-2.5 rounded-xl border border-orange-500/30">
                        <AlertOctagon className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <h4 className="text-white font-black text-lg uppercase tracking-tight">Análisis de Sensibilidad</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Escenarios para el Año 5 (Pico)</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {simulation.sensitivity.map((scenario, index) => (
                        <div key={index} className={`p-5 rounded-3xl border transition-all ${scenario.margin >= 0 ? 'bg-slate-950 border-slate-800' : 'bg-red-950/20 border-red-500/30'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border ${scenario.margin >= 0 ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-red-900 border-red-500 text-red-400'}`}>
                                    {scenario.label}
                                </span>
                                <scenario.icon className={`w-5 h-5 ${scenario.color}`} />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-slate-500 font-bold uppercase">
                                    <span>Ventas:</span>
                                    <span className="text-slate-300">{formatCurrency(scenario.price)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500 font-bold uppercase">
                                    <span>Costos:</span>
                                    <span className="text-slate-300">{formatCurrency(scenario.cost)}</span>
                                </div>
                                <div className="h-px bg-slate-800 my-2"></div>
                                <div>
                                    <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Margen Neto</p>
                                    <p className={`text-xl font-black font-mono ${scenario.margin >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {formatCurrency(scenario.margin)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex gap-4 items-start">
                    <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-slate-400 leading-relaxed italic">
                        El <strong>Escenario Pesimista</strong> asume una caída del 15% en el precio del café y un aumento adicional del 5% en costos laborales sobre la inflación. Si el margen es negativo, el proyecto tiene alto riesgo financiero.
                    </p>
                </div>
            </div>
        </div>
    );
};
