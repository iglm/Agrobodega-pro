

import React, { useState } from 'react';
import { Warehouse } from '../types';
import { X, Warehouse as WarehouseIcon, Plus, Check, Trash2, Home, Map } from 'lucide-react';

interface WarehouseModalProps {
  warehouses: Warehouse[];
  activeId: string;
  onSwitch: (id: string) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  isAdmin?: boolean; 
}

export const WarehouseModal: React.FC<WarehouseModalProps> = ({ 
  warehouses, 
  activeId, 
  onSwitch, 
  onCreate, 
  onDelete,
  onClose
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onCreate(newName);
      setNewName('');
      setIsCreating(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, w: Warehouse) => {
    e.stopPropagation();
    if (warehouses.length <= 1) {
      alert("No puedes eliminar la única sede activa.");
      return;
    }
    if (confirm(`¿Está seguro de eliminar "${w.name}"? Se perderán todos los datos (Inventario, Nómina, Finanzas) asociados a esta finca.`)) {
      onDelete(w.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-900/30 p-2 rounded-lg border border-indigo-500/30">
              <Map className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg leading-none">Mis Fincas / Sedes</h3>
              <p className="text-xs text-slate-400 mt-1">Gestión Multi-Finca</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
            {warehouses.map(w => {
              const isActive = w.id === activeId;
              return (
                <div 
                  key={w.id}
                  onClick={() => {
                    onSwitch(w.id);
                    onClose();
                  }}
                  className={`group relative flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-emerald-900/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                      : 'bg-slate-900/50 border-slate-700/50 hover:bg-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className={`font-bold ${isActive ? 'text-emerald-400' : 'text-slate-200'}`}>{w.name}</h4>
                      {isActive && <span className="text-[10px] text-emerald-600/80 uppercase tracking-wide font-bold">Activa</span>}
                    </div>
                  </div>

                  {isActive && <Check className="w-5 h-5 text-emerald-500" />}
                  
                  {!isActive && (
                    <button 
                      onClick={(e) => handleDeleteClick(e, w)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all"
                      title="Eliminar Sede"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add New Section */}
          {isCreating ? (
            <form onSubmit={handleCreate} className="bg-slate-900 p-3 rounded-xl border border-slate-700 animate-fade-in">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nombre Nueva Finca</label>
                <div className="flex gap-2">
                <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ej: Hacienda El Recreo"
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                    autoFocus
                />
                <button 
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg transition-colors"
                >
                    <Check className="w-4 h-4" />
                </button>
                <button 
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded-lg transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
                </div>
            </form>
            ) : (
            <button 
                onClick={() => setIsCreating(true)}
                className="w-full py-3 rounded-xl border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
                <Plus className="w-4 h-4" />
                Crear Nueva Sede / Finca
            </button>
            )
          }

        </div>
      </div>
    </div>
  );
};