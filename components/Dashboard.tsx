
import React, { useMemo, useState, useEffect } from 'react';
import { InventoryItem, Movement, CostCenter, Personnel, Machine, MaintenanceLog, Supplier, AppState } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { checkFarmHealth, AgroAlert } from '../services/alertService';
import { Package, Search, Activity, HardDrive, AlertTriangle, Calendar, Wrench, Rocket, CheckCircle2, Circle, ChevronRight, Lightbulb } from 'lucide-react';
import { useDashboardAnalytics, AdminAlert } from '../hooks/useDashboardAnalytics';
import { InventoryCard } from './dashboard/InventoryCard';
import { RenovationIndicator } from './dashboard/RenovationIndicator';
import { Card } from './UIElements'; // Using new components

interface DashboardProps {
  data: AppState;
  inventory: InventoryItem[];
  costCenters: CostCenter[];
  movements: Movement[];
  personnel?: Personnel[];
  machines?: Machine[];
  maintenanceLogs?: MaintenanceLog[];
  suppliers?: Supplier[];
  onAddMovement: (item: InventoryItem, type: 'IN' | 'OUT') => void;
  onDelete: (id: string) => void;
  onViewHistory: (item: InventoryItem) => void;
  onViewGlobalHistory?: () => void;
  onOpenExport?: () => void;
  onNavigate?: (tabId: string) => void;
  isAdmin?: boolean; 
}

const UnifiedAlertsWidget: React.FC<{ adminAlerts: AdminAlert[], agroAlerts: AgroAlert[] }> = ({ adminAlerts, agroAlerts }) => {
    if (adminAlerts.length === 0 && agroAlerts.length === 0) return null;

    return (
        <div className="bg-slate-900/50 p-5 rounded-[2rem] border border-amber-500/20 flex flex-col gap-3 animate-slide-up mb-6">
            <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Inteligencia de Alertas
            </h4>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {/* Alertas Financieras/Agronómicas */}
                {agroAlerts.map(alert => (
                    <div key={alert.id} className={`shrink-0 p-4 rounded-2xl border flex items-start gap-3 min-w-[280px] max-w-[320px] ${alert.type === 'critical' ? 'bg-red-900/20 border-red-500/30' : 'bg-amber-900/20 border-amber-500/30'}`}>
                        <div className={`p-2 rounded-lg mt-1 ${alert.type === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            <Lightbulb className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-[10px] font-black uppercase ${alert.type === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>{alert.message}</p>
                            <p className="text-[10px] text-slate-400 leading-tight mt-1 whitespace-normal">{alert.advice}</p>
                        </div>
                    </div>
                ))}

                {/* Alertas Administrativas Tradicionales */}
                {adminAlerts.map(alert => (
                    <div key={alert.id} className={`shrink-0 p-4 rounded-2xl border flex items-start gap-3 min-w-[280px] max-w-[320px] ${alert.severity === 'HIGH' ? 'bg-red-900/20 border-red-500/30' : 'bg-slate-800 border-slate-700'}`}>
                        <div className={`p-2 rounded-lg mt-1 ${alert.type === 'CONTRACT' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-orange-500/20 text-orange-400'}`}>
                            {alert.type === 'CONTRACT' ? <Calendar className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-[10px] font-black uppercase ${alert.severity === 'HIGH' ? 'text-red-400' : 'text-slate-300'}`}>{alert.type === 'CONTRACT' ? 'Vencimiento Contrato' : 'Mantenimiento'}</p>
                            <p className="text-[10px] text-slate-400 leading-tight mt-1 whitespace-normal">{alert.message}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const OnboardingWidget: React.FC<{ 
    hasLots: boolean; 
    hasTeam: boolean; 
    hasSuppliers: boolean; 
    hasItems: boolean;
    onNavigate?: (id: string) => void; 
}> = ({ hasLots, hasTeam, hasSuppliers, hasItems, onNavigate }) => {
    
    const steps = [
        { id: 1, label: 'Crear Lotes / Centros de Costo', done: hasLots, action: 'lots', btn: 'Ir a Mapa' },
        { id: 2, label: 'Registrar Equipo de Trabajo', done: hasTeam, action: 'labor', btn: 'Ir a Nómina' },
        { id: 3, label: 'Registrar Proveedores Clave', done: hasSuppliers, action: 'masters', btn: 'Ir a Config' },
        { id: 4, label: 'Cargar Inventario Inicial', done: hasItems, action: 'inventory', btn: 'Ir a Bodega' },
    ];

    const completedCount = steps.filter(s => s.done).length;
    const progress = (completedCount / 4) * 100;

    if (completedCount === 4) return null;

    return (
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-[2rem] p-6 border border-indigo-500/30 shadow-2xl relative overflow-hidden animate-slide-up mb-6">
            <div className="absolute top-0 right-0 p-6 opacity-5"><Rocket className="w-40 h-40 text-white" /></div>
            <div className="relative z-10">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h3 className="text-white font-black text-lg uppercase flex items-center gap-2"><Rocket className="w-5 h-5 text-indigo-400" /> Configuración Inicial</h3>
                        <p className="text-xs text-indigo-200 mt-1">Completa estos pasos para activar la inteligencia de la App.</p>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-black text-white">{progress.toFixed(0)}%</span>
                        <p className="text-[9px] text-indigo-300 font-bold uppercase">Completado</p>
                    </div>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-6">
                    <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    {steps.map((step) => (
                        <div key={step.id} className={`p-3 rounded-xl border flex items-center justify-between transition-all ${step.done ? 'bg-slate-800/50 border-slate-700 opacity-60' : 'bg-slate-800 border-indigo-500/50 shadow-lg'}`}>
                            <div className="flex items-center gap-3">
                                {step.done ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> : <Circle className="w-5 h-5 text-indigo-400 shrink-0" />}
                                <span className={`text-xs font-bold ${step.done ? 'text-slate-500 line-through' : 'text-white'}`}>{step.id}. {step.label}</span>
                            </div>
                            {!step.done && onNavigate && (
                                <button onClick={() => onNavigate(step.action)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase rounded-lg flex items-center gap-1 transition-colors">{step.btn} <ChevronRight className="w-3 h-3" /></button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const DashboardBase: React.FC<DashboardProps> = ({ 
  data, inventory = [], costCenters = [], movements = [], personnel = [], machines = [], maintenanceLogs = [], suppliers = [],
  onAddMovement, onDelete, onViewHistory, onViewGlobalHistory, onNavigate, isAdmin
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('Todos');
  const [agroAlerts, setAgroAlerts] = useState<AgroAlert[]>([]);

  const { renovationAnalysis, inventoryAnalytics, storage, adminAlerts } = useDashboardAnalytics(inventory, costCenters, movements, personnel, machines, maintenanceLogs);

  useEffect(() => {
    if (data.activeWarehouseId) {
        setAgroAlerts(checkFarmHealth(data));
    }
  }, [data]);

  const filteredInventory = useMemo(() => inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'Todos' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  }), [inventory, searchTerm, filterCategory]);

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(inventory.map(i => String(i.category))))], [inventory]);

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      <OnboardingWidget hasLots={costCenters.length > 0} hasTeam={personnel && personnel.length > 0} hasSuppliers={suppliers.length > 0} hasItems={inventory.length > 0} onNavigate={onNavigate} />

      <Card className="bg-slate-900 border-slate-800 relative overflow-hidden !p-8">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Package className="w-48 h-48 text-white" /></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="text-center md:text-left">
                  <p className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mb-3 flex items-center justify-center md:justify-start gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" /> Valorización Activa Bodega</p>
                  <p className="text-5xl font-black text-white font-mono tracking-tighter">{formatCurrency(inventoryAnalytics.totalValue)}</p>
                  <p className="text-xs text-slate-500 font-bold uppercase mt-2 tracking-widest italic">Capital Operativo en Insumos</p>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                  <div className="bg-slate-800/50 p-5 rounded-[2rem] border border-slate-700 text-center flex-1 md:min-w-[140px] backdrop-blur-sm">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Items</p>
                      <p className="text-2xl font-black text-white">{inventory.length}</p>
                  </div>
                  <div className={`p-5 rounded-[2rem] border text-center flex-1 md:min-w-[140px] backdrop-blur-sm transition-all ${inventoryAnalytics.lowStockCount > 0 ? 'bg-red-900/20 border-red-500/40' : 'bg-slate-800/50 border-slate-700'}`}>
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Crítico</p>
                      <p className={`text-2xl font-black ${inventoryAnalytics.lowStockCount > 0 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{inventoryAnalytics.lowStockCount}</p>
                  </div>
              </div>
          </div>
      </Card>

      <UnifiedAlertsWidget adminAlerts={adminAlerts} agroAlerts={agroAlerts} />
      
      {costCenters.length > 0 && <RenovationIndicator analysis={renovationAnalysis} />}

      <div className="grid grid-cols-2 gap-4">
          <button onClick={onViewGlobalHistory} className="bg-slate-800 p-6 rounded-[2rem] border border-slate-700 flex items-center gap-4 active:scale-95 transition-all group hover:bg-slate-700">
              <div className="bg-indigo-600/20 p-3 rounded-2xl text-indigo-400 border border-indigo-500/20"><Activity className="w-6 h-6" /></div>
              <div className="text-left"><p className="text-sm font-black text-white uppercase">Kárdex Global</p><p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter italic">Ver Movimientos</p></div>
          </button>
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl border ${storage.percent > 80 ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'}`}><HardDrive className="w-6 h-6" /></div>
                  <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Memoria Local</p>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1"><div className={`h-full transition-all duration-1000 ${storage.percent > 80 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${storage.percent}%` }}></div></div>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">{storage.used.toFixed(1)} MB</p>
                  </div>
              </div>
          </div>
      </div>

      <div className="space-y-5">
        <div className="flex flex-col gap-4 sticky top-[110px] sm:top-[120px] z-20 bg-slate-100/90 dark:bg-slate-950/90 backdrop-blur-xl pt-2 pb-2 transition-colors">
            <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
              <Search className="w-6 h-6 text-slate-400" />
              <input type="text" placeholder="Buscar agroinsumo..." className="bg-transparent border-none outline-none text-base w-full text-slate-700 dark:text-white font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map(cat => (
                <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-6 py-3 rounded-2xl text-xs font-black whitespace-nowrap transition-all uppercase tracking-widest ${filterCategory === cat ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>{cat}</button>
              ))}
            </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
            {filteredInventory.map((item) => (
                <InventoryCard key={item.id} item={item} abcClass={inventoryAnalytics.abcMap[item.id] || 'C'} isLowStock={!!(item.minStock && item.currentQuantity <= item.minStock)} onAddMovement={onAddMovement} onViewHistory={onViewHistory} onDelete={onDelete} isAdmin={isAdmin} />
            ))}
        </div>
      </div>
    </div>
  );
};

export const Dashboard = React.memo(DashboardBase);
