
import React, { useState } from 'react';
import { X, DollarSign, Calculator, Plus, Trash2, Percent, Info, Eraser, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../services/inventoryService';

export const InvestmentCalculatorView: React.FC = () => {
  const [initialInvestment, setInitialInvestment] = useState<string>('');
  const [cashFlows, setCashFlows] = useState<string[]>(['', '', '']); // 3 years by default
  const [discountRate, setDiscountRate] = useState<string>('');
  const [npvResult, setNpvResult] = useState<number | null>(null);
  const [irrResult, setIrrResult] = useState<number | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  const handleAddCashFlow = () => {
    setCashFlows([...cashFlows, '']);
  };

  const handleRemoveCashFlow = (index: number) => {
    setCashFlows(cashFlows.filter((_, i) => i !== index));
  };

  const handleCashFlowChange = (index: number, value: string) => {
    const newCashFlows = [...cashFlows];
    newCashFlows[index] = value;
    setCashFlows(newCashFlows);
  };

  const calculateIRR = (initial: number, flows: number[]): number | null => {
      // Newton-Raphson method approximation
      let guess = 0.1; // Initial guess 10%
      const maxIter = 100;
      const tol = 0.00001;

      for (let i = 0; i < maxIter; i++) {
          let npv = -initial;
          let d_npv = 0; // Derivative of NPV with respect to r

          for (let t = 0; t < flows.length; t++) {
              const den = Math.pow(1 + guess, t + 1);
              npv += flows[t] / den;
              d_npv -= ((t + 1) * flows[t]) / (den * (1 + guess));
          }

          if (Math.abs(npv) < tol) return guess * 100;
          if (d_npv === 0) return null; // Avoid division by zero

          const newGuess = guess - (npv / d_npv);
          
          if (Math.abs(newGuess - guess) < tol) return newGuess * 100;
          
          guess = newGuess;
      }
      return null; // No convergence
  };

  const handleCalculate = () => {
    setNpvResult(null);
    setIrrResult(null);
    setCalculationError(null);

    const initialInvNum = parseFloat(initialInvestment);
    if (isNaN(initialInvNum) || initialInvNum <= 0) {
      setCalculationError('La inversión inicial debe ser un número positivo.');
      return;
    }

    const discountRateNum = parseFloat(discountRate);
    if (isNaN(discountRateNum) || discountRateNum <= 0 || discountRateNum > 100) {
      setCalculationError('La tasa de descuento debe ser un porcentaje (0-100).');
      return;
    }
    const r = discountRateNum / 100;

    const parsedCashFlows = cashFlows.map(cf => parseFloat(cf)).filter(cf => !isNaN(cf));

    if (parsedCashFlows.length === 0) {
        setCalculationError('Debe ingresar al menos un flujo de caja anual.');
        return;
    }

    // Calculate NPV
    let currentNpv = -initialInvNum;
    for (let i = 0; i < parsedCashFlows.length; i++) {
      currentNpv += parsedCashFlows[i] / Math.pow(1 + r, i + 1);
    }
    setNpvResult(currentNpv);

    // Calculate IRR
    const irr = calculateIRR(initialInvNum, parsedCashFlows);
    setIrrResult(irr);
  };

  const handleClear = () => {
    setInitialInvestment('');
    setCashFlows(['', '', '']);
    setDiscountRate('');
    setNpvResult(null);
    setIrrResult(null);
    setCalculationError(null);
  };

  const getResultColorClass = (val: number | null, isPercent: boolean = false) => {
    if (val === null) return 'text-slate-400';
    if (isPercent) {
        // For IRR, compare with Discount Rate if available, otherwise just positive
        const dr = parseFloat(discountRate);
        if (!isNaN(dr)) {
            return val > dr ? 'text-emerald-500' : 'text-red-500';
        }
    }
    if (val > 0) return 'text-emerald-500';
    if (val < 0) return 'text-red-500';
    return 'text-blue-500';
  };

  const getVPNText = (npv: number | null) => {
    if (npv === null) return 'Ingrese datos para calcular';
    if (npv > 0) return 'Proyecto viable (Crea Valor)';
    if (npv < 0) return 'Proyecto no viable (Destruye Valor)';
    return 'Proyecto indiferente (VPN = 0)';
  };

  const getIRRText = (irr: number | null) => {
      if (irr === null) return 'No calculable';
      const dr = parseFloat(discountRate);
      if (!isNaN(dr)) {
          if (irr > dr) return `Rentable (Mayor a tasa ${dr}%)`;
          if (irr < dr) return `No rentable (Menor a tasa ${dr}%)`;
          return 'Igual a tasa de oportunidad';
      }
      return 'Tasa de retorno del proyecto';
  };

  return (
    <div className="bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-indigo-600/20 p-2.5 rounded-xl border border-indigo-500/30">
          <Calculator className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-white font-black text-xl">Evaluador Financiero (VPN & TIR)</h3>
          <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-black">Viabilidad de Proyectos a Largo Plazo</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Inversión Inicial */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Inversión Inicial (Salida de Capital)</label>
          <input
            type="number"
            value={initialInvestment}
            onChange={(e) => setInitialInvestment(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Ej: 5000000"
            required
          />
        </div>

        {/* Tasa de Descuento */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tasa de Descuento (Costo de Oportunidad)</label>
          <div className="relative">
            <input
              type="number"
              value={discountRate}
              onChange={(e) => setDiscountRate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 pl-10 text-white font-mono text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Ej: 12 (para 12%)"
              min="0"
              max="100"
              required
            />
            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          </div>
          <div className="bg-blue-900/10 p-3 rounded-xl border border-blue-500/20 flex items-start gap-3 mt-2 text-[10px] text-slate-400 italic leading-tight">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p>
              Tasa mínima que espera ganar (ej: CDT o Crédito Finagro). Si la TIR supera esta tasa, el proyecto es atractivo.
            </p>
          </div>
        </div>

        {/* Flujos de Caja Anuales */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Flujos de Caja Netos (Proyectados)</label>
          <div className="space-y-2">
            {cashFlows.map((cf, index) => (
              <div key={index} className="flex gap-2 items-center">
                <span className="text-slate-500 text-sm w-12 shrink-0 font-mono">Año {index + 1}:</span>
                <input
                  type="number"
                  value={cf}
                  onChange={(e) => handleCashFlowChange(index, e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Ej: 1500000"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCashFlow(index)}
                  className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                  title="Eliminar Año"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddCashFlow}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> Añadir Proyección Anual
            </button>
          </div>
        </div>
      </div>

      {calculationError && (
        <div className="bg-red-900/20 border border-red-500/50 p-3 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2 uppercase animate-shake">
          <AlertTriangle className="w-4 h-4" /> {calculationError}
        </div>
      )}

      {/* Resultados y Acciones */}
      <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* VPN Result */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-700 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <DollarSign className="w-12 h-12 text-white" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Valor Presente Neto (VPN)</p>
                <p className={`text-2xl font-black font-mono ${getResultColorClass(npvResult)}`}>
                    {npvResult !== null ? formatCurrency(npvResult) : '$ -'}
                </p>
                <p className={`text-[9px] font-bold mt-2 uppercase ${getResultColorClass(npvResult)}`}>
                    {getVPNText(npvResult)}
                </p>
            </div>

            {/* IRR Result */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-700 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <TrendingUp className="w-12 h-12 text-white" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tasa Interna de Retorno (TIR)</p>
                <p className={`text-2xl font-black font-mono ${getResultColorClass(irrResult, true)}`}>
                    {irrResult !== null ? `${irrResult.toFixed(2)}%` : '- %'}
                </p>
                <p className={`text-[9px] font-bold mt-2 uppercase ${getResultColorClass(irrResult, true)}`}>
                    {getIRRText(irrResult)}
                </p>
            </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCalculate}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-900/30 active:scale-95"
          >
            <Calculator className="w-5 h-5" /> Calcular Viabilidad
          </button>
          <button
            onClick={handleClear}
            className="p-4 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-colors active:scale-95"
            title="Limpiar Calculadora"
          >
            <Eraser className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
