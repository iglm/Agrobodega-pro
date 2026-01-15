
import React from 'react';
import { InventoryItem, Movement } from '../types';
import { formatCurrency, convertToBase, getBaseUnitType, formatBaseQuantity } from '../services/inventoryService';
import { X, TrendingUp, TrendingDown, Calendar, History, FileText, Tag, Camera, ArrowUpRight, ArrowDownRight, Minus, LineChart, Users, Database } from 'lucide-react';

interface HistoryModalProps {
  item: InventoryItem;
  movements: Movement[];
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ item, movements, onClose }) => {
  const [showImage, setShowImage] = React.useState<string | null>(null);

  // Determinar si es un historial de un ítem real o el historial global de bodega
  const isGlobal = !item.id;

  // Price Trend Analysis (Solo relevante si no es historial global)
  const entries = movements
    .filter(m => m.type === 'IN' && m.calculatedCost > 0)
    .reverse(); 

  let minPrice = 0, maxPrice = 0, avgPrice = 0, trend: 'up' | 'down' | 'stable' = 'stable';
  let priceHistory: number[] = [];

  if (!isGlobal && entries.length > 0) {
     priceHistory = entries.map(e => e.calculatedCost / e.quantity);
     if (priceHistory.length > 0) {
         minPrice = Math.min(...priceHistory);
         maxPrice = Math.max(...priceHistory);
         avgPrice = priceHistory.reduce((a, b) => a + b, 0) / priceHistory.length;
         const lastPrice = priceHistory[priceHistory.length - 1]; 
         if (lastPrice > avgPrice * 1.05) trend = 'up';
         else if (lastPrice < avgPrice * 0.95) trend = 'down';
     }
  }

  const supplierStats = React.useMemo(() => {
    if (isGlobal || entries.length === 0) return [];
    const stats: Record<string, { totalCost: number; totalBaseQty: number; count: number }> = {};
    
    entries.forEach(e => {
        const name = e.supplierName || 'Desconocido';
        const baseQty = convertToBase(e.quantity, e.unit);
        if (!stats[name]) stats[name] = { totalCost: 0, totalBaseQty: 0, count: 0 };
        stats[name].totalCost += e.calculatedCost;
        stats[name].totalBaseQty += baseQty;
        stats[name].count += 1;
    });

    return Object.entries(stats).map(([name, data]) => {
        const costPerBase = data.totalBaseQty > 0 ? data.totalCost / data.totalBaseQty : 0;
        const displayConversion = convertToBase(1, item.lastPurchaseUnit);
        return { name, avgPrice: costPerBase * displayConversion, count: data.count };
    }).sort((a, b) => a.avgPrice - b.avgPrice);
  }, [entries, item.lastPurchaseUnit, isGlobal]);

  const getSparklinePoints = () => {
      if (priceHistory.length < 2) return "";
      const height = 40;
      const width = 200;
      const range = maxPrice - minPrice || 1;
      return priceHistory.map((price, i) => {
          const x = (i / (priceHistory.length - 1)) * width;
          const y = height - ((price - minPrice) / range) * height; 
          return `${x},${y}`;
      }).join(" ");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 w-full max-w-2xl rounded-[2.5rem] border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up">
        
        <div className="bg-slate-900 p-6 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-900/30 p-3 rounded-2xl border border-blue-500/30">
              {isGlobal ? <Database className="w-6 h-6 text-blue-400" /> : <History className="w-6 h-6 text-blue-400" />}
            </div>
            <div>
              <h3 className="text-white font-black text-lg leading-none">{isGlobal ? 'Libro Mayor de Movimientos' : 'Kárdex de Insumo'}</h3>
              <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-widest">{item.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900/20">
            {!isGlobal && priceHistory.length > 1 && (
                <div className="bg-slate-900/50 p-6 border-b border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                            <LineChart className="w-4 h-4 text-emerald-400" /> Tendencia de Precios
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                            {trend === 'up' && <div className="flex items-center text-red-400"><ArrowUpRight className="w-4 h-4 mr-1"/> Alza</div>}
                            {trend === 'down' && <div className="flex items-center text-emerald-400"><ArrowDownRight className="w-4 h-4 mr-1"/> Baja</div>}
                            {trend === 'stable' && <div className="flex items-center text-blue-400"><Minus className="w-4 h-4 mr-1"/> Estable</div>}
                        </div>
                    </div>
                    <div className="relative h-12 w-full flex items-end overflow-hidden mb-2">
                        <svg className="w-full h-full" viewBox="0 0 200 45" preserveAspectRatio="none">
                            <defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity="0.3" /><stop offset="100%" stopColor="#10b981" stopOpacity="0" /></linearGradient></defs>
                            <polyline fill="none" stroke="#10b981" strokeWidth="3" points={getSparklinePoints()} strokeLinecap="round" strokeLinejoin="round" />
                            <polygon fill="url(#g)" points={`0,45 ${getSparklinePoints()} 200,45`} opacity="0.5" />
                        </svg>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono font-black uppercase">
                        <span>Mín: {formatCurrency(minPrice)}</span>
                        <span>Promedio: {formatCurrency(avgPrice)}</span>
                        <span>Máx: {formatCurrency(maxPrice)}</span>
                    </div>
                </div>
            )}

            {!isGlobal && supplierStats.length > 0 && (
                 <div className="p-6 bg-slate-800/50 border-b border-slate-700">
                     <h4 className="text-[10px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                         <Users className="w-4 h-4" /> Comparativa de Proveedores
                     </h4>
                     <div className="bg-slate-900/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
                         <table className="w-full text-[10px] text-left">
                             <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-tighter">
                                 <tr><th className="p-3">Proveedor</th><th className="p-3 text-right">Precio Promedio</th></tr>
                             </thead>
                             <tbody className="divide-y divide-slate-800">
                                 {supplierStats.map((s, idx) => (
                                     <tr key={s.name} className={idx === 0 ? 'bg-emerald-500/5' : ''}>
                                         <td className="p-3 font-bold text-slate-200">{s.name}{idx === 0 && <span className="ml-2 text-[8px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">ÓPTIMO</span>}</td>
                                         <td className="p-3 text-right font-mono font-black text-emerald-500">{formatCurrency(s.avgPrice)}</td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                 </div>
            )}

            <div className="p-6">
            {movements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-600 opacity-40">
                    <History className="w-16 h-16 mb-4" />
                    <p className="font-black uppercase text-xs tracking-widest">Sin actividad registrada</p>
                </div>
            ) : (
                <div className="space-y-4">
                {movements.map((mov) => {
                    const isIn = mov.type === 'IN';
                    return (
                    <div key={mov.id} className="bg-slate-800 border border-slate-700 rounded-3xl p-5 flex items-center justify-between hover:border-slate-500 transition-all shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 ${isIn ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-500' : 'bg-red-950/20 border-red-500/40 text-red-500'}`}>
                                {isIn ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isIn ? 'text-emerald-400' : 'text-red-400'}`}>{isIn ? 'Entrada' : 'Salida'}</span>
                                    {isGlobal && <span className="text-[10px] text-white font-bold bg-slate-700 px-2 py-0.5 rounded-lg">{mov.itemName}</span>}
                                    {mov.invoiceImage && <button onClick={() => setShowImage(mov.invoiceImage || null)} className="bg-blue-600 text-white p-1 rounded-lg"><Camera className="w-3 h-3" /></button>}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase">
                                    <Calendar className="w-3 h-3" /> {new Date(mov.date).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-white font-black text-lg">{isIn ? '+' : '-'}{mov.quantity} <span className="text-[10px] text-slate-500">{mov.unit}</span></p>
                            <p className="text-[10px] font-mono font-black text-slate-500">{formatCurrency(mov.calculatedCost)}</p>
                        </div>
                    </div>
                    );
                })}
                </div>
            )}
            </div>
        </div>

        <div className="bg-slate-950 p-5 border-t border-slate-700 flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
          <span>Registros Totales: {movements.length}</span>
          {!isGlobal && <span>UUID: {item.id ? item.id.substring(0,8) : 'N/A'}</span>}
        </div>
      </div>

      {showImage && (
          <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setShowImage(null)}>
              <div className="relative max-w-full max-h-full">
                  <img src={showImage} className="rounded-2xl shadow-2xl border-4 border-slate-800 max-h-[80vh]" alt="Adjunto" />
                  <button onClick={() => setShowImage(null)} className="absolute -top-12 right-0 text-white p-2 bg-red-600 rounded-full"><X className="w-6 h-6" /></button>
              </div>
          </div>
      )}
    </div>
  );
};
