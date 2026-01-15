
import React from 'react';
import { RefreshCw, Sprout, Coffee, AlertTriangle, Activity } from 'lucide-react';

interface RenovationAnalysis {
  totalHa: number;
  renovationHa: number;
  productionHa: number;
  renovationPct: number;
  status: 'CRITICAL' | 'OPTIMAL' | 'GROWTH';
  message: string;
  colorClass: string;
  bgClass: string;
}

interface RenovationIndicatorProps {
  analysis: RenovationAnalysis;
}

const RenovationIndicatorBase: React.FC<RenovationIndicatorProps> = ({ analysis }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1 space-y-3 w-full">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-emerald-500" /> Ciclo de Renovación
            </h4>
            <div className="flex justify-between items-end">
                <p className={`text-3xl font-black font-mono ${analysis.colorClass}`}>
                    {analysis.renovationPct.toFixed(1)}% <span className="text-sm text-slate-400 font-bold">en Renovación</span>
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase text-right">
                    Total: {analysis.totalHa.toFixed(1)} Ha
                </p>
            </div>
            <div className="w-full h-5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden flex border border-slate-200 dark:border-slate-800 relative">
                {/* Renovation Bar */}
                <div className={`h-full ${analysis.bgClass} transition-all duration-1000 relative group`} style={{ width: `${analysis.renovationPct}%` }}>
                    <div className="absolute inset-0 bg-white/20"></div>
                </div>
                {/* Production Bar */}
                <div className="h-full bg-slate-300 dark:bg-slate-700 transition-all duration-1000" style={{ width: `${100 - analysis.renovationPct}%` }}></div>
                
                {/* Ideal Zone Markers (10% - 20%) */}
                <div className="absolute top-0 bottom-0 left-[10%] w-[10%] bg-emerald-500/10 border-x border-emerald-500/30 pointer-events-none"></div>
            </div>
            <div className="flex justify-between text-xs font-black uppercase text-slate-400">
                <span className="flex items-center gap-1"><Sprout className="w-4 h-4"/> Levante: {analysis.renovationHa.toFixed(1)} Ha</span>
                <span className="flex items-center gap-1"><Coffee className="w-4 h-4"/> Producción: {analysis.productionHa.toFixed(1)} Ha</span>
            </div>
        </div>
        
        <div className={`p-5 rounded-3xl border w-full md:w-auto min-w-[220px] flex items-start gap-4 ${analysis.status === 'CRITICAL' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
            <div className={`p-3 rounded-2xl ${analysis.status === 'CRITICAL' ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                {analysis.status === 'CRITICAL' ? <AlertTriangle className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
            </div>
            <div>
                <p className={`text-xs font-black uppercase ${analysis.colorClass}`}>Diagnóstico</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-bold leading-tight mt-1">{analysis.message}</p>
            </div>
        </div>
    </div>
  );
};

export const RenovationIndicator = React.memo(RenovationIndicatorBase);
