
import React from 'react';
import { Activity, AlertTriangle, Database, Users, MapPin, Server } from 'lucide-react';

interface SystemHealthProps {
  costCentersCount: number;
  personnelCount: number;
  logsCount: number;
}

const LIMIT_LOTS = 100;
const LIMIT_PEOPLE = 100;
const LIMIT_LOGS = 20000;

export const SystemHealth: React.FC<SystemHealthProps> = ({ costCentersCount, personnelCount, logsCount }) => {
  
  const renderBar = (label: string, current: number, limit: number, icon: React.ElementType) => {
    const percentage = Math.min((current / limit) * 100, 100);
    let colorClass = 'bg-emerald-500';
    let textColorClass = 'text-emerald-500';
    let statusMsg = 'Óptimo';

    if (percentage >= 100) {
      colorClass = 'bg-red-500';
      textColorClass = 'text-red-500';
      statusMsg = 'Crítico';
    } else if (percentage >= 80) {
      colorClass = 'bg-amber-500';
      textColorClass = 'text-amber-500';
      statusMsg = 'Alto';
    }

    return (
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
             <div className={`p-1 rounded-md ${percentage >= 80 ? 'bg-slate-800' : 'bg-slate-900'}`}>
                {React.createElement(icon, { className: `w-3 h-3 ${textColorClass}` })}
             </div>
             <span className="text-[10px] font-bold text-slate-300 uppercase">{label}</span>
          </div>
          <span className={`text-[9px] font-mono font-black ${textColorClass}`}>
            {current} / {limit}
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colorClass} transition-all duration-1000`} 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        {percentage >= 80 && (
            <p className={`text-[8px] mt-1 flex items-center gap-1 ${textColorClass}`}>
                <AlertTriangle className="w-2 h-2" /> 
                {percentage >= 100 ? "Capacidad excedida. Archive datos." : "Rendimiento podría degradarse."}
            </p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Diagnóstico del Sistema
        </h4>
        {renderBar('Lotes / Bloques', costCentersCount, LIMIT_LOTS, MapPin)}
        {renderBar('Trabajadores', personnelCount, LIMIT_PEOPLE, Users)}
        {renderBar('Registros Históricos', logsCount, LIMIT_LOGS, Database)}
    </div>
  );
};
