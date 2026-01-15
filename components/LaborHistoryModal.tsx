import React, { useState, useMemo } from 'react';
import { LaborLog, Personnel, CostCenter, Activity } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { X, Search, User, MapPin, Pickaxe, Calendar, Filter, Trash2, DollarSign } from 'lucide-react';

interface LaborHistoryModalProps {
  logs: LaborLog[];
  personnel: Personnel[];
  costCenters: CostCenter[];
  activities: Activity[];
  onClose: () => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

export const LaborHistoryModal: React.FC<LaborHistoryModalProps> = ({
  logs,
  personnel,
  costCenters,
  activities,
  onClose,
  onDelete,
  isAdmin
}) => {
  // Filters State
  const [filterPerson, setFilterPerson] = useState('');
  const [filterLot, setFilterLot] = useState('');
  const [filterActivity, setFilterActivity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter Logic
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesPerson = filterPerson ? log.personnelId === filterPerson : true;
      const matchesLot = filterLot ? log.costCenterId === filterLot : true;
      const matchesActivity = filterActivity ? log.activityId === filterActivity : true;
      
      let matchesDate = true;
      if (startDate) matchesDate = matchesDate && log.date >= startDate;
      if (endDate) matchesDate = matchesDate && log.date <= endDate;

      return matchesPerson && matchesLot && matchesActivity && matchesDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [logs, filterPerson, filterLot, filterActivity, startDate, endDate]);

  // Totals based on Filter
  const totalFilteredCost = filteredLogs.reduce((acc, log) => acc + log.value, 0);

  const clearFilters = () => {
      setFilterPerson('');
      setFilterLot('');
      setFilterActivity('');
      setStartDate('');
      setEndDate('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-2 sm:p-4 animate-fade-in">
      <div className="bg-slate-100 dark:bg-slate-900 w-full max-w-4xl h-full sm:h-[90vh] sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-slide-up">
        
        {/* Header */}
        <div className="bg-amber-600 p-4 flex justify-between items-center flex-shrink-0 shadow-md z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg leading-none">Historial Detallado</h3>
              <p className="text-amber-100 text-xs mt-1">Mano de Obra y Jornales</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters Section */}
        <div className="bg-white dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Filter className="w-3 h-3" /> Filtros de Búsqueda
                </h4>
                {(filterPerson || filterLot || filterActivity || startDate || endDate) && (
                    <button onClick={clearFilters} className="text-[10px] text-red-500 hover:underline font-bold">
                        Borrar Filtros
                    </button>
                )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {/* Person Filter */}
                <div className="relative">
                    <User className="absolute left-2 top-2.5 w-3 h-3 text-slate-400" />
                    <select 
                        value={filterPerson}
                        onChange={e => setFilterPerson(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-2 pl-7 pr-2 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-amber-500"
                    >
                        <option value="">Todos los Trabajadores</option>
                        {personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                {/* Lot Filter */}
                <div className="relative">
                    <MapPin className="absolute left-2 top-2.5 w-3 h-3 text-slate-400" />
                    <select 
                        value={filterLot}
                        onChange={e => setFilterLot(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-2 pl-7 pr-2 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-amber-500"
                    >
                        <option value="">Todos los Lotes</option>
                        {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                {/* Activity Filter */}
                <div className="relative">
                    <Pickaxe className="absolute left-2 top-2.5 w-3 h-3 text-slate-400" />
                    <select 
                        value={filterActivity}
                        onChange={e => setFilterActivity(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-2 pl-7 pr-2 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-amber-500"
                    >
                        <option value="">Todas las Labores</option>
                        {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>

                {/* Date Filters */}
                <div className="relative">
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-2 px-2 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-amber-500"
                        placeholder="Desde"
                    />
                </div>
                <div className="relative">
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-2 px-2 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-amber-500"
                        placeholder="Hasta"
                    />
                </div>
            </div>
        </div>

        {/* Results Summary */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm">
            <span className="text-slate-500 dark:text-slate-400">
                Se encontraron <strong>{filteredLogs.length}</strong> registros
            </span>
            <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 text-xs uppercase hidden sm:inline">Total Filtrado:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-500 text-lg">
                    {formatCurrency(totalFilteredCost)}
                </span>
            </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-100 dark:bg-slate-900">
            {filteredLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <Search className="w-12 h-12 mb-3 opacity-50" />
                    <p>No se encontraron resultados con estos filtros.</p>
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {filteredLogs.map(log => (
                        <div key={log.id} className={`bg-white dark:bg-slate-800 p-4 rounded-xl border shadow-sm flex flex-col relative group ${log.paid ? 'border-emerald-200 dark:border-emerald-900/30' : 'border-slate-200 dark:border-slate-700'}`}>
                            
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="bg-amber-100 dark:bg-amber-900/30 p-1.5 rounded text-amber-600 dark:text-amber-500">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                            {new Date(log.date).toLocaleDateString()}
                                        </span>
                                        {log.paid ? (
                                             <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1 rounded inline-block w-fit">PAGADO</span>
                                        ) : (
                                             <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-1 rounded inline-block w-fit">PENDIENTE</span>
                                        )}
                                    </div>
                                </div>
                                <span className="font-mono font-bold text-slate-800 dark:text-white text-sm bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-lg">
                                    {formatCurrency(log.value)}
                                </span>
                            </div>

                            <div className="space-y-1 mb-2">
                                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                    <User className="w-3 h-3 text-blue-400" />
                                    <span className="font-semibold">{log.personnelName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                    <Pickaxe className="w-3 h-3 text-amber-500" />
                                    <span>{log.activityName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                    <MapPin className="w-3 h-3 text-purple-400" />
                                    <span>{log.costCenterName}</span>
                                </div>
                            </div>

                            {log.notes && (
                                <p className="text-[10px] text-slate-400 italic mt-1 border-t border-slate-100 dark:border-slate-700/50 pt-1">
                                    "{log.notes}"
                                </p>
                            )}

                            {isAdmin && (
                                <button 
                                    onClick={() => {
                                        if(confirm('¿Eliminar este registro permanentemente?')) onDelete(log.id);
                                    }}
                                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>

      </div>
    </div>
  );
};
