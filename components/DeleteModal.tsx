import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteModalProps {
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({ itemName, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 w-full max-w-sm rounded-2xl border-2 border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.2)] overflow-hidden animate-slide-up">
        
        {/* Header Warning */}
        <div className="bg-red-900/20 p-6 flex flex-col items-center justify-center border-b border-red-900/30">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/30 animate-pulse">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-white text-center">¿Eliminar Insumo?</h3>
          <p className="text-red-400 text-sm mt-2 font-medium">Esta acción no se puede deshacer</p>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-4">
          <p className="text-slate-300 text-sm">
            Está a punto de eliminar permanentemente:
            <br />
            <span className="text-lg font-bold text-white block mt-1">"{itemName}"</span>
          </p>
          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
            <p className="text-xs text-slate-500">
              Se perderá todo el historial de movimientos, cálculos de costos y stock actual asociado a este producto.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-700 grid grid-cols-2 gap-3">
          <button 
            onClick={onCancel}
            className="w-full py-3 rounded-xl font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            className="w-full py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 border border-red-500 shadow-lg shadow-red-900/20 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Sí, Eliminar
          </button>
        </div>

      </div>
    </div>
  );
};