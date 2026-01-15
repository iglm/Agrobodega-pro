
import React, { useState, useMemo } from 'react';
import { FinanceLog } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { Landmark, TrendingUp, TrendingDown, Plus, Trash2, Calendar, AlertTriangle } from 'lucide-react';

interface FinanceViewProps {
  financeLogs: FinanceLog[];
  // Fix: Omit warehouseId as it is handled by the parent component (App.tsx)
  onAddTransaction: (t: Omit<FinanceLog, 'id' | 'warehouseId'>) => void;
  onDeleteTransaction: (id: string) => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({ financeLogs, onAddTransaction, onDeleteTransaction }) => {
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [category, setCategory] = useState<string>('Servicios');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!amount || !desc) return;
      
      onAddTransaction({
          date,
          type,
          category: category as any,
          amount: parseFloat(amount),
          description: desc
      });
      setAmount('');
      setDesc('');
  };

  const totals = useMemo(() => {
      const income = financeLogs.filter(f => f.type === 'INCOME').reduce((acc, f) => acc + f.amount, 0);
      const expenses = financeLogs.filter(f => f.type === 'EXPENSE').reduce((acc, f) => acc + f.amount, 0);
      return { income, expenses, balance: income - expenses };
  }, [financeLogs]);

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Landmark className="w-6 h-6 text-indigo-400" />
                        Finanzas Administrativas
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Gastos Generales, Impuestos y Otros Ingresos</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Balance Admin</p>
                    <p className={`text-2xl font-mono font-bold ${totals.balance >= 0 ? 'text-indigo-300' : 'text-red-400'}`}>
                        {formatCurrency(totals.balance)}
                    </p>
                </div>
            </div>
        </div>

        {/* Transaction Form */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 dark:text-white mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Registrar Movimiento General
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                    <button 
                        type="button"
                        onClick={() => { setType('EXPENSE'); setCategory('Servicios'); }}
                        className={`flex-1 py-2 text-xs font-bold rounded flex items-center justify-center gap-2 transition-all ${type === 'EXPENSE' ? 'bg-white dark:bg-slate-700 text-red-500 shadow-sm' : 'text-slate-500'}`}
                    >
                        <TrendingDown className="w-4 h-4" /> Gasto General
                    </button>
                    <button 
                        type="button"
                        onClick={() => { setType('INCOME'); setCategory('Otros'); }}
                        className={`flex-1 py-2 text-xs font-bold rounded flex items-center justify-center gap-2 transition-all ${type === 'INCOME' ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-500'}`}
                    >
                        <TrendingUp className="w-4 h-4" /> Otro Ingreso
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Categoría</label>
                        <select 
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm text-slate-700 dark:text-white"
                        >
                            {type === 'EXPENSE' ? (
                                <>
                                    <option>Servicios</option>
                                    <option>Impuestos</option>
                                    <option>Bancario</option>
                                    <option>Transporte</option>
                                    <option>Administracion</option>
                                    <option>Otros</option>
                                </>
                            ) : (
                                <>
                                    <option>Otros</option>
                                    <option>Prestamo</option>
                                    <option>Capital</option>
                                </>
                            )}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase">Monto</label>
                        <input 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm text-slate-700 dark:text-white"
                            placeholder="0"
                        />
                    </div>
                </div>

                <input 
                    type="text" 
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm text-slate-700 dark:text-white"
                    placeholder="Descripción (Ej: Pago Luz Casa Principal)"
                />

                <button type="submit" className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg text-sm transition-colors">
                    Guardar Registro
                </button>
            </form>
        </div>

        {/* List */}
        <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase">Historial Reciente</h4>
            {financeLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-100 dark:bg-slate-900/50 rounded-xl">
                    Sin movimientos administrativos.
                </div>
            ) : (
                financeLogs.slice().reverse().map(log => (
                    <div key={log.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${log.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                {log.type === 'INCOME' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-white text-sm">{log.category}</p>
                                <p className="text-xs text-slate-500">{log.description}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {new Date(log.date).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`font-mono font-bold ${log.type === 'INCOME' ? 'text-emerald-500' : 'text-red-500'}`}>
                                {log.type === 'INCOME' ? '+' : '-'} {formatCurrency(log.amount)}
                            </p>
                            <button 
                                onClick={() => onDeleteTransaction(log.id)}
                                className="text-slate-300 hover:text-red-500 p-1"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>

    </div>
  );
};
