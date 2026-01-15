
import React, { useState, useRef } from 'react';
import { AgendaEvent } from '../types';
import { HeaderCard, EmptyState } from './UIElements';
import { Calendar, Plus, CheckSquare, Trash2, CheckCircle2 } from 'lucide-react';

interface AgendaViewProps {
  agenda: AgendaEvent[];
  onAddEvent: (e: { title: string }) => void;
  onToggleEvent: (id: string) => void;
  onDeleteEvent: (id: string) => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({ agenda, onAddEvent, onToggleEvent, onDeleteEvent }) => {
  const [newEventTitle, setNewEventTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    onAddEvent({ title: newEventTitle });
    setNewEventTitle('');
  };

  const handleActionClick = () => {
    inputRef.current?.focus();
  };

  const pendingTasks = agenda.filter(e => !e.completed).length;

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <HeaderCard
        title="Planificación de Campo"
        subtitle="Agenda de Tareas"
        valueLabel="Tareas Pendientes"
        value={pendingTasks.toString()}
        gradientClass="bg-gradient-to-r from-blue-600 to-indigo-700"
        icon={Calendar}
        onAction={handleActionClick}
        actionLabel="Nueva Tarea"
        actionIcon={Plus}
      />

      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border dark:border-slate-700 shadow-sm">
        <h3 className="text-slate-800 dark:text-white font-black text-xs uppercase mb-4 flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-emerald-500" /> Tareas de la Finca
        </h3>
        <form onSubmit={handleAddEventSubmit} className="flex gap-2 mb-6">
          <input
            ref={inputRef}
            type="text"
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
            placeholder="Nueva tarea (Ej: Comprar fertilizante)..."
            className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-800 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
          <button type="submit" className="p-4 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-900/30 active:scale-95 transition-transform">
            <Plus className="w-5 h-5" />
          </button>
        </form>

        {agenda.length === 0 ? (
          <EmptyState icon={Calendar} message="No hay tareas en la agenda." />
        ) : (
          <div className="space-y-2">
            {agenda.slice().sort((a, b) => (a.completed ? 1 : -1) - (b.completed ? 1 : -1) || new Date(b.date).getTime() - new Date(a.date).getTime()).map(ev => (
              <div key={ev.id} className={`flex items-center justify-between p-4 rounded-2xl border group transition-all ${ev.completed ? 'bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                <div className="flex items-center gap-4">
                  <button onClick={() => onToggleEvent(ev.id)} className={`w-7 h-7 rounded-lg border-2 transition-colors flex items-center justify-center shrink-0 ${ev.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 text-transparent hover:border-emerald-500'}`}>
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                  <span className={`font-bold ${ev.completed ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-white'}`}>{ev.title}</span>
                </div>
                <button onClick={() => onDeleteEvent(ev.id)} className="text-slate-400 dark:text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
