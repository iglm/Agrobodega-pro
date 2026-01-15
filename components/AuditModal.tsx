import React, { useState } from 'react';
import { InventoryItem, Unit } from '../types';
import { formatBaseQuantity, getBaseUnitType, convertToBase } from '../services/inventoryService';
import { X, CheckCircle, AlertTriangle, ClipboardCheck, ArrowRight, Save, FileText } from 'lucide-react';

interface AuditModalProps {
  inventory: InventoryItem[];
  onAdjust: (item: InventoryItem, realQty: number, notes: string) => void;
  onClose: () => void;
}

export const AuditModal: React.FC<AuditModalProps> = ({ inventory, onAdjust, onClose }) => {
  const [step, setStep] = useState<'select' | 'count' | 'result'>('select');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [countedQty, setCountedQty] = useState('');
  const [justification, setJustification] = useState('');
  
  const selectedItem = inventory.find(i => i.id === selectedItemId);

  const handleSelect = (id: string) => {
    setSelectedItemId(id);
    setStep('count');
    setCountedQty('');
    setJustification('');
  };

  const handleFinishCount = () => {
    if (!selectedItem || !countedQty) return;
    setStep('result');
  };

  const handleSaveAdjustment = () => {
    if (!selectedItem) return;
    
    const realQtyBase = parseFloat(countedQty);
    
    // Construct final note
    let note = `Ajuste Auditoría: Sistema(${formatBaseQuantity(selectedItem.currentQuantity, selectedItem.baseUnit)}) vs Físico(${formatBaseQuantity(realQtyBase, selectedItem.baseUnit)}).`;
    
    if (justification.trim()) {
        note += ` Justificación: ${justification.trim()}`;
    }
    
    onAdjust(selectedItem, realQtyBase, note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-500/20 p-2 rounded-lg border border-indigo-500/30">
                    <ClipboardCheck className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-white font-bold text-lg">Auditoría de Stock</h3>
                    <p className="text-xs text-slate-400">Verificación física (Conteo Ciego)</p>
                </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* STEP 1: SELECT ITEM */}
        {step === 'select' && (
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <p className="text-slate-400 text-sm mb-4">Seleccione el producto que desea auditar:</p>
                <div className="space-y-2">
                    {inventory.map(item => (
                        <button 
                            key={item.id}
                            onClick={() => handleSelect(item.id)}
                            className="w-full text-left bg-slate-700/50 hover:bg-slate-700 p-3 rounded-xl border border-slate-600 transition-colors flex items-center gap-3 group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-500 text-xs">
                                IMG
                            </div>
                            <div>
                                <p className="text-white font-bold">{item.name}</p>
                                <p className="text-xs text-slate-400">{item.category}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-500 ml-auto group-hover:text-emerald-400" />
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* STEP 2: BLIND COUNT */}
        {step === 'count' && selectedItem && (
            <div className="p-6 space-y-6">
                <div className="text-center">
                    <h4 className="text-slate-300 text-sm uppercase font-bold mb-2">Producto a Auditar</h4>
                    <p className="text-2xl font-bold text-white mb-1">{selectedItem.name}</p>
                    <p className="text-sm text-indigo-400 bg-indigo-900/20 inline-block px-3 py-1 rounded-full border border-indigo-900/50">
                        Unidad Base: {selectedItem.baseUnit === 'unit' ? 'Unidades' : selectedItem.baseUnit === 'g' ? 'Gramos/Kilos' : 'Mililitros/Litros'}
                    </p>
                </div>

                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                    <label className="block text-sm font-bold text-slate-400 mb-2 text-center">
                        ¿Cuánto hay FÍSICAMENTE en bodega?
                    </label>
                    <div className="flex items-center gap-2">
                        <input 
                            type="number" 
                            autoFocus
                            value={countedQty}
                            onChange={(e) => setCountedQty(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-xl p-4 text-center text-2xl font-bold text-white focus:border-indigo-500 outline-none"
                            placeholder="0"
                        />
                    </div>
                    <p className="text-[10px] text-slate-500 text-center mt-2">
                        Ingrese la cantidad en {selectedItem.baseUnit === 'g' ? 'GRAMOS' : selectedItem.baseUnit === 'ml' ? 'MILILITROS' : 'UNIDADES'}.
                        <br/>(Ej: Si hay 1 Kilo, ingrese 1000)
                    </p>
                </div>

                <button 
                    onClick={handleFinishCount}
                    disabled={!countedQty}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                    Comparar Resultados
                </button>
            </div>
        )}

        {/* STEP 3: RESULT & ADJUSTMENT */}
        {step === 'result' && selectedItem && (
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar max-h-[70vh]">
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 text-center">
                        <p className="text-xs text-slate-500 uppercase font-bold">Sistema</p>
                        <p className="text-xl font-mono font-bold text-slate-300">
                            {formatBaseQuantity(selectedItem.currentQuantity, selectedItem.baseUnit)}
                        </p>
                    </div>
                    <div className="bg-indigo-900/20 p-3 rounded-lg border border-indigo-500/30 text-center">
                        <p className="text-xs text-indigo-400 uppercase font-bold">Conteo Físico</p>
                        <p className="text-xl font-mono font-bold text-white">
                            {formatBaseQuantity(parseFloat(countedQty), selectedItem.baseUnit)}
                        </p>
                    </div>
                </div>

                {parseFloat(countedQty) === selectedItem.currentQuantity ? (
                    <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/30 flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                        <div>
                            <p className="font-bold text-emerald-400">¡Inventario Exacto!</p>
                            <p className="text-xs text-emerald-200/70">No se requieren ajustes.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-orange-900/20 p-4 rounded-xl border border-orange-500/30">
                            <div className="flex items-center gap-3 mb-2">
                                <AlertTriangle className="w-6 h-6 text-orange-500" />
                                <p className="font-bold text-orange-400">Diferencia Encontrada</p>
                            </div>
                            <p className="text-sm text-slate-300">
                                Diferencia: <span className="font-mono font-bold text-white">
                                    {formatBaseQuantity(parseFloat(countedQty) - selectedItem.currentQuantity, selectedItem.baseUnit)}
                                </span>
                            </p>
                            <p className="text-xs text-slate-400 mt-2">
                                Se requiere crear un ajuste. Justifique la razón abajo.
                            </p>
                        </div>
                        
                        {/* MANUAL JUSTIFICATION INPUT */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-1">
                                <FileText className="w-3 h-3" /> Justificación (Obligatorio)
                            </label>
                            <textarea 
                                value={justification}
                                onChange={(e) => setJustification(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white text-sm focus:border-indigo-500 outline-none h-20 resize-none"
                                placeholder="Ej: Se rompió un frasco, Merma natural, Robo..."
                            />
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    <button 
                        onClick={() => setStep('count')}
                        className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-xl font-bold text-sm"
                    >
                        Recontar
                    </button>
                    {parseFloat(countedQty) !== selectedItem.currentQuantity ? (
                        <button 
                            onClick={handleSaveAdjustment}
                            disabled={!justification.trim()}
                            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4" />
                            Ajustar Stock
                        </button>
                    ) : (
                        <button 
                            onClick={onClose}
                            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm"
                        >
                            Finalizar
                        </button>
                    )}
                </div>

            </div>
        )}

      </div>
    </div>
  );
};