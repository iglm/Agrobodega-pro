
import React from 'react';
import { InventoryItem } from '../../types';
import { formatCurrency, formatBaseQuantity } from '../../services/inventoryService';
import { LayoutGrid, AlertTriangle, Image as ImageIcon, Activity, TrendingUp, TrendingDown, History, Trash2 } from 'lucide-react';

interface InventoryCardProps {
  item: InventoryItem;
  abcClass: 'A' | 'B' | 'C';
  isLowStock: boolean;
  onAddMovement: (item: InventoryItem, type: 'IN' | 'OUT') => void;
  onViewHistory: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  isAdmin?: boolean;
}

const InventoryCardBase: React.FC<InventoryCardProps> = ({
  item,
  abcClass,
  isLowStock,
  onAddMovement,
  onViewHistory,
  onDelete,
  isAdmin
}) => {
  const baseUnit = item.baseUnit;
  const costPerBase = item.averageCost;
  
  // CORRECCIÓN: Si es Unidad, no multiplicar por 1000. Si es g/ml, mostrar valor Kg/L.
  const costPerKgOrL = baseUnit === 'unit' ? costPerBase : costPerBase * 1000;
  const costPerBulto = costPerBase * 50000;

  // Lógica de etiquetas dinámica
  const labelMicro = baseUnit === 'g' ? 'Gramo' : baseUnit === 'ml' ? 'Ml' : 'Unidad';
  const labelMacro = baseUnit === 'g' ? 'Kg' : baseUnit === 'ml' ? 'Litro' : 'Unidad';

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 shadow-xl border transition-all hover:shadow-2xl relative group ${isLowStock ? 'border-red-500/40' : 'border-slate-200 dark:border-slate-700'}`}>
        {/* ABC BADGE */}
        <div className={`absolute top-5 right-5 text-[10px] font-black px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${abcClass === 'A' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : abcClass === 'B' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500' : 'bg-slate-500/10 border-slate-500/30 text-slate-500'}`}>
            <LayoutGrid className="w-3 h-3" /> CAT. {abcClass}
        </div>

        {isLowStock && (
            <div className="absolute top-14 right-5 bg-red-600 text-white p-2 rounded-full shadow-lg z-10 animate-bounce">
                <AlertTriangle className="w-5 h-5" />
            </div>
        )}
        
        <div className="flex gap-5 mb-6 mt-2">
            <div className="w-24 h-24 rounded-[2rem] bg-slate-100 dark:bg-slate-900 flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner relative">
                {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="w-12 h-12" /></div>}
                {isLowStock && <div className="absolute inset-0 bg-red-600/10 border-2 border-red-500/30 rounded-[2rem]"></div>}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className="font-black text-slate-800 dark:text-white text-xl leading-tight truncate">{item.name}</h3>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1 italic">{item.category}</p>
                <div className="mt-3">
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Stock en Bodega</p>
                    <p className={`text-3xl font-black font-mono tracking-tighter ${isLowStock ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>{formatBaseQuantity(item.currentQuantity, item.baseUnit)}</p>
                </div>
            </div>
        </div>

        {/* MATEMÁTICA DE COSTOS */}
        <div className="bg-slate-50 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-3 mb-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Análisis Unitario</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500">CPP: {formatCurrency(item.averageCost, 2)}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Valor {labelMicro}</p>
                    <p className="text-base font-black text-indigo-500 font-mono">{formatCurrency(costPerBase, 2)}</p>
                </div>
                <div className="space-y-1 text-right">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Valor {labelMacro}</p>
                    <p className="text-base font-black text-indigo-500 font-mono">{formatCurrency(costPerKgOrL)}</p>
                </div>
            </div>

            {baseUnit === 'g' && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Equivalencia Bulto (50kg)</p>
                    </div>
                    <p className="text-sm font-black text-white font-mono">{formatCurrency(costPerBulto)}</p>
                </div>
            )}
        </div>

        <div className="space-y-3">
            <div className="flex gap-3">
                <button onClick={() => onAddMovement(item, 'IN')} className="flex-1 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-900/20 active:scale-95 flex items-center justify-center gap-2">
                    <TrendingUp className="w-5 h-5" /> Entrada
                </button>
                <button onClick={() => onAddMovement(item, 'OUT')} className="flex-1 py-4 rounded-2xl bg-slate-200 dark:bg-slate-700 hover:bg-red-600 hover:text-white text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
                    <TrendingDown className="w-5 h-5" /> Salida
                </button>
            </div>
            
            <div className="flex gap-3">
                <button 
                    onClick={() => onViewHistory(item)} 
                    className="flex-1 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-black text-xs uppercase tracking-widest transition-all hover:bg-indigo-600 hover:text-white flex items-center justify-center gap-2 active:scale-95 group/hist"
                >
                    <History className="w-5 h-5 group-hover/hist:rotate-[-45deg] transition-transform" /> Ver Kárdex
                </button>
                {isAdmin && (
                    <button onClick={() => onDelete(item.id)} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-red-500 border border-slate-200 dark:border-slate-700 hover:border-red-500/30 transition-colors">
                        <Trash2 className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};

export const InventoryCard = React.memo(InventoryCardBase);
