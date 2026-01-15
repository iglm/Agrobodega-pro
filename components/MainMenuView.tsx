
import React, { useState } from 'react';
import { 
  Sprout, Package, Users, BarChart3, ChevronDown, ChevronRight, 
  MapPin, Target, Tractor, Leaf, Warehouse, Calculator, 
  Database, CalendarRange, Pickaxe, DollarSign, PieChart,
  Bug
} from 'lucide-react';

interface MainMenuViewProps {
  onSelectTab: (id: string) => void;
}

export const MainMenuView: React.FC<MainMenuViewProps> = ({ onSelectTab }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>('production');

  const toggleCategory = (id: string) => {
    setActiveCategory(activeCategory === id ? null : id);
  };

  const MENU_CATEGORIES = [
    {
      id: 'production',
      title: 'Campo y Producción',
      subtitle: 'Lotes, Labores y Cosecha',
      icon: Sprout,
      headerClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      items: [
        { id: 'lots', label: 'Gestión Lotes', icon: MapPin, desc: 'Estructura' },
        { id: 'scheduler', label: 'Programar', icon: CalendarRange, desc: 'Planificación' },
        { id: 'sanitary', label: 'Sanidad (Broca)', icon: Bug, desc: 'Monitoreo' },
        { id: 'management', label: 'Lluvias/SST', icon: Tractor, desc: 'Bitácora' },
        { id: 'harvest', label: 'Ventas Cosecha', icon: Target, desc: 'Recolección' },
      ]
    },
    {
      id: 'logistics',
      title: 'Bodega y Recursos',
      subtitle: 'Inventarios y Activos',
      icon: Package,
      headerClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      items: [
        { id: 'inventory', label: 'Insumos', icon: Warehouse, desc: 'Kárdex' },
        { id: 'assets', label: 'Activos Bio', icon: Leaf, desc: 'Inversión' },
      ]
    },
    {
      id: 'hr',
      title: 'Talento Humano',
      subtitle: 'Personal y Nómina',
      icon: Users,
      headerClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      items: [
        { id: 'labor', label: 'Trabajadores', icon: Pickaxe, desc: 'Jornales' },
      ]
    },
    {
      id: 'management',
      title: 'Gerencia Estratégica',
      subtitle: 'Finanzas e Inteligencia',
      icon: BarChart3,
      headerClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      items: [
        { id: 'budget', label: 'Presupuesto', icon: Calculator, desc: 'Proyección' },
        { id: 'stats', label: 'KPIs / BI', icon: PieChart, desc: 'Analítica' },
      ]
    }
  ];

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      
      {/* Header Resumen */}
      <div className="bg-slate-900 rounded-[2.5rem] p-6 text-center shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"></div>
          <h2 className="text-white font-black text-xl uppercase tracking-tighter">Panel de Control</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Seleccione un módulo operativo</p>
      </div>

      <div className="space-y-3">
        {MENU_CATEGORIES.map((cat) => {
          const isOpen = activeCategory === cat.id;
          
          return (
            <div key={cat.id} className={`rounded-[2rem] overflow-hidden transition-all duration-300 border ${isOpen ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-lg scale-[1.02]' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent opacity-90'}`}>
              
              {/* Category Header */}
              <button 
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between p-5"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${cat.headerClass}`}>
                    <cat.icon className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-slate-800 dark:text-white font-black text-sm uppercase tracking-tight">{cat.title}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{cat.subtitle}</p>
                  </div>
                </div>
                <div className={`p-2 rounded-full transition-transform duration-300 ${isOpen ? 'rotate-180 bg-slate-100 dark:bg-slate-800' : ''}`}>
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                </div>
              </button>

              {/* Category Content (Grid) */}
              {isOpen && (
                <div className="p-4 pt-0 animate-fade-in-down">
                  <div className="h-px w-full bg-slate-100 dark:bg-slate-800 mb-4"></div>
                  <div className="grid grid-cols-2 gap-3">
                    {cat.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onSelectTab(item.id)}
                        className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all active:scale-95 group"
                      >
                        <item.icon className="w-6 h-6 text-slate-400 group-hover:text-emerald-500 mb-2 transition-colors" />
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase">{item.label}</span>
                        <span className="text-[9px] text-slate-400 uppercase font-bold mt-0.5">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center py-6">
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
            Sistema Integral v3.0 • Local First
        </p>
      </div>
    </div>
  );
};
