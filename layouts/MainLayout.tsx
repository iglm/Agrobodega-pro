
import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSyncManager } from '../services/syncManager'; 
import { checkFarmHealth } from '../services/alertService';
import { 
    LayoutDashboard, Package, Pickaxe, Target, Sprout, Briefcase, 
    Settings, Globe, ChevronDown, Download, Plus, HelpCircle, 
    CalendarRange, Calculator, Sun, Moon, LayoutGrid, Bug, 
    Settings2, Leaf, DollarSign, ClipboardList, Sparkles, 
    Search, Menu, X, Bell, LogOut, ChevronRight, Activity, 
    ShieldCheck, CloudRain, BrainCircuit, Wallet, TrendingUp, Users,
    CloudOff, CloudFog, CloudLightning, BarChart3
} from 'lucide-react';
import { generateId, processInventoryMovement, formatCurrency } from '../services/inventoryService';
import { 
    generatePDF, generateExcel, generateLaborReport, generateHarvestReport, 
    generateMasterPDF, generateGlobalReport, generateAgronomicDossier, 
    generateSafetyReport, generateFieldTemplates, generateFarmStructurePDF, 
    generateFarmStructureExcel
} from '../services/reportService';

// Component Imports
import { Dashboard } from '../components/Dashboard';
import { StatsView } from '../components/StatsView';
import { InventoryForm } from '../components/InventoryForm';
import { MovementModal } from '../components/MovementModal';
import { ExportModal } from '../components/ExportModal';
import { ManualModal } from '../components/ManualModal';
import { WarehouseModal } from '../components/WarehouseModal';
import { SettingsModal } from '../components/SettingsModal';
import { DataModal } from '../components/DataModal';
import { LaborView } from '../components/LaborView'; 
import { HarvestView } from '../components/HarvestView'; 
import { BiologicalAssetsView } from '../components/BiologicalAssetsView';
import { BudgetView } from '../components/BudgetView'; 
import { ManagementView } from '../components/ManagementView';
import { LotManagementView } from '../components/LotManagementView';
import { SanitaryView } from '../components/SanitaryView';
import { HistoryModal } from '../components/HistoryModal';
import { DeleteModal } from '../components/DeleteModal';
import { PayrollModal } from '../components/PayrollModal';
import { LaborSchedulerView } from '../components/LaborSchedulerView';
import { LaborForm } from '../components/LaborForm'; 
import { AIAssistant } from '../components/AIAssistant';
import { AnalyticsView } from '../components/AnalyticsView';
import { InventoryItem, CostClassification } from '../types';

interface MainLayoutProps {
  onShowNotification: (msg: string, type: 'success' | 'error') => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ onShowNotification }) => {
  const { data, setData, actions } = useData();
  const { session } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const { isSyncing: syncing, online: isOnline } = useSyncManager(data, setData);

  const [currentTab, setCurrentTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  // UI Modals
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showWarehouses, setShowWarehouses] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showData, setShowData] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showPayroll, setShowPayroll] = useState(false);
  const [showGlobalHistory, setShowGlobalHistory] = useState(false);
  const [showLaborForm, setShowLaborForm] = useState(false); 
  
  const [movementModal, setMovementModal] = useState<{item: InventoryItem, type: 'IN' | 'OUT'} | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);

  // Efecto para revisión de salud financiera al iniciar
  useEffect(() => {
    if (data.activeWarehouseId) {
        const alerts = checkFarmHealth(data);
        if (alerts.length > 0) {
            const criticalAlert = alerts.find(a => a.type === 'critical');
            if (criticalAlert) {
                onShowNotification(`ALERTA: ${criticalAlert.message}`, 'error');
            } else if (alerts[0]) {
                onShowNotification(`Aviso: ${alerts[0].message}`, 'error');
            }
        }
    }
  }, [data.activeWarehouseId]);

  const activeId = data.activeWarehouseId;
  const currentW = useMemo(() => data.warehouses.find(w => w.id === activeId), [data.warehouses, activeId]);

  // Data Slices
  const activeInventory = useMemo(() => data.inventory.filter(i => i.warehouseId === activeId), [data.inventory, activeId]);
  const activeCostCenters = useMemo(() => data.costCenters.filter(c => c.warehouseId === activeId), [data.costCenters, activeId]);
  const activeLaborLogs = useMemo(() => data.laborLogs.filter(l => l.warehouseId === activeId), [data.laborLogs, activeId]);
  const activeHarvests = useMemo(() => data.harvests.filter(h => h.warehouseId === activeId), [data.harvests, activeId]);
  const activeMovements = useMemo(() => data.movements.filter(m => m.warehouseId === activeId), [data.movements, activeId]);
  const activeActivities = useMemo(() => data.activities.filter(a => a.warehouseId === activeId), [data.activities, activeId]);
  const activePersonnel = useMemo(() => data.personnel.filter(p => p.warehouseId === activeId), [data.personnel, activeId]);
  const activeSuppliers = useMemo(() => data.suppliers.filter(s => s.warehouseId === activeId), [data.suppliers, activeId]);

  const sidebarLinks = [
    { id: 'overview', label: 'Resumen General', icon: LayoutDashboard, color: 'text-emerald-500' },
    { type: 'divider', label: 'Operaciones' },
    { id: 'inventory', label: 'Bodega (Insumos)', icon: Package, color: 'text-blue-500' },
    { id: 'harvest', label: 'Comercial (Ventas)', icon: DollarSign, color: 'text-emerald-500' },
    { id: 'scheduler', label: 'Programación', icon: CalendarRange, color: 'text-violet-500' },
    { type: 'divider', label: 'Mi Campo' },
    { id: 'lots', label: 'Mapa de Lotes', icon: LayoutGrid, color: 'text-amber-500' },
    { id: 'management', label: 'Bitácora de Campo', icon: ClipboardList, color: 'text-slate-400' },
    { id: 'sanitary', label: 'Sanidad (Plagas)', icon: Bug, color: 'text-red-500' },
    { id: 'assets', label: 'Activos Bio', icon: Leaf, color: 'text-emerald-400' },
    { type: 'divider', label: 'Gerencia Estratégica' },
    { id: 'analytics', label: 'Análisis Financiero', icon: BarChart3, color: 'text-emerald-600' },
    { id: 'labor', label: 'Nómina y Personal', icon: Pickaxe, color: 'text-orange-500' },
    { id: 'budget', label: 'Presupuestos', icon: Calculator, color: 'text-indigo-500' },
    { id: 'stats', label: 'Inteligencia BI', icon: Activity, color: 'text-rose-500' },
  ];

  const handleAddCostCenterQuick = (name: string) => {
    setData(prev => ({...prev, costCenters: [...prev.costCenters, {id: generateId(), warehouseId: activeId, name, area: 0, stage: 'Produccion', cropType: 'Café', plantCount: 0}]}));
    onShowNotification(`Lote "${name}" creado.`, 'success');
  };

  return (
    <div className={`min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans overflow-hidden`}>
      
      {/* SIDEBAR PERSISTENTE */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col z-[100] relative`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
            <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-900/20 shrink-0">
                <Globe className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
                <div className="animate-fade-in whitespace-nowrap overflow-hidden">
                    <h1 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">DatosFinca <span className="text-emerald-500">Pro</span></h1>
                    <p className="text-[9px] text-slate-500 font-black uppercase">Enterprise Web Edition</p>
                </div>
            )}
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar py-4 px-3 space-y-1">
            {sidebarLinks.map((link, idx) => {
                if (link.type === 'divider') {
                    return sidebarOpen ? (
                        <p key={idx} className="text-[9px] font-black text-slate-400 uppercase px-4 pt-6 pb-2 tracking-widest">{link.label}</p>
                    ) : (
                        <div key={idx} className="h-px bg-slate-200 dark:bg-slate-800 my-4 mx-2" />
                    );
                }

                const isActive = currentTab === link.id;
                const LinkIcon = (link as any).icon;

                return (
                    <button
                        key={link.id}
                        onClick={() => setCurrentTab(link.id)}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${isActive ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}`}
                    >
                        <LinkIcon className={`w-5 h-5 shrink-0 transition-transform group-active:scale-90 ${isActive ? 'text-white' : link.color}`} />
                        {sidebarOpen && <span className="text-xs font-black uppercase tracking-tight">{link.label}</span>}
                        {isActive && sidebarOpen && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                    </button>
                );
            })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex items-center justify-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-500 transition-colors">
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between z-50">
            <div className="flex items-center gap-6 flex-1">
                <div className="max-w-md w-full relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Búsqueda Inteligente..." 
                        className="w-full bg-slate-100 dark:bg-slate-950 border border-transparent focus:border-emerald-500/50 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-slate-700 dark:text-white outline-none transition-all"
                    />
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden lg:block" />
                <button onClick={() => setShowWarehouses(true)} className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all group">
                    <div className="p-2 bg-indigo-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <Globe className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                        <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase leading-none">{currentW?.name || 'Seleccionar Finca'}</h2>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Activa</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                   {syncing ? (
                       <Activity className="w-4 h-4 text-indigo-500 animate-spin" />
                   ) : isOnline ? (
                       <ShieldCheck className="w-4 h-4 text-emerald-500" />
                   ) : (
                       <CloudOff className="w-4 h-4 text-red-500" />
                   )}
                   <span className="text-[9px] font-black uppercase text-slate-500">
                       {syncing ? 'Sincronizando...' : isOnline ? 'Nube OK' : 'Modo Offline'}
                   </span>
                </div>

                <button onClick={toggleTheme} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-500 hover:text-amber-500 transition-all active:scale-95 border border-slate-200 dark:border-slate-700">
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button onClick={() => setAiPanelOpen(true)} className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white px-5 py-3 rounded-2xl shadow-xl shadow-indigo-900/20 active:scale-95 transition-all group">
                    <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">Consultor IA</span>
                </button>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-slate-50 dark:bg-slate-950/50">
            <div className="max-w-7xl mx-auto">
                {currentTab === 'overview' && (
                    <div className="animate-fade-in space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5"><DollarSign className="w-20 h-20" /></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Valor Inventario
                                </p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">{formatCurrency(activeInventory.reduce((a,b)=>a+(b.currentQuantity*b.averageCost),0))}</p>
                                <div className="mt-4 flex items-center gap-2 text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg w-fit">
                                    <TrendingUp className="w-3 h-3" /> Capital Activo
                                </div>
                            </div>
                            {/* Repite para otros KPI... */}
                        </div>

                        <Dashboard 
                            data={data}
                            inventory={activeInventory} 
                            costCenters={activeCostCenters} 
                            movements={activeMovements}
                            personnel={activePersonnel}
                            suppliers={activeSuppliers}
                            onAddMovement={(i, t) => setMovementModal({item: i, type: t})}
                            onDelete={(id) => { const item = data.inventory.find(i => i.id === id); if(item) setDeleteItem(item); }}
                            onViewHistory={(item) => setHistoryItem(item)}
                            onViewGlobalHistory={() => setShowGlobalHistory(true)}
                            onNavigate={(id) => setCurrentTab(id)}
                            isAdmin={true}
                        />
                    </div>
                )}

                {/* MODULAR VIEWS */}
                {currentTab === 'analytics' && <AnalyticsView />}
                {currentTab === 'inventory' && <Dashboard data={data} inventory={activeInventory} costCenters={activeCostCenters} movements={activeMovements} onAddMovement={(i, t) => setMovementModal({item: i, type: t})} onDelete={(id) => { const item = data.inventory.find(i => i.id === id); if(item) setDeleteItem(item); }} onViewHistory={(item) => setHistoryItem(item)} onViewGlobalHistory={() => setShowGlobalHistory(true)} isAdmin={true} />}
                {currentTab === 'lots' && <LotManagementView costCenters={activeCostCenters} laborLogs={activeLaborLogs} movements={activeMovements} harvests={activeHarvests} plannedLabors={data.plannedLabors} onUpdateLot={actions.updateCostCenter} onAddPlannedLabor={actions.addPlannedLabor} activities={activeActivities} onAddCostCenter={(n,b,a,s,pc,ct,ac,age,density, assocAge) => setData(prev=>({...prev, costCenters:[...prev.costCenters,{id:generateId(),warehouseId:activeId,name:n,budget:b,area:a || 0,stage:s,plantCount:pc, cropType:ct || 'Café',associatedCrop:ac, cropAgeMonths: age, associatedCropDensity: density, associatedCropAge: assocAge}]}))} onDeleteCostCenter={actions.deleteCostCenter} />}
                {currentTab === 'labor' && <LaborView laborLogs={activeLaborLogs} personnel={activePersonnel} costCenters={activeCostCenters} activities={activeActivities} onAddLabor={() => setShowLaborForm(true)} onDeleteLabor={(id) => setData(prev=>({...prev, laborLogs: prev.laborLogs.filter(l=>l.id!==id)}))} isAdmin={true} onOpenPayroll={()=>setShowPayroll(true)} />}
                {currentTab === 'scheduler' && <LaborSchedulerView plannedLabors={data.plannedLabors} costCenters={activeCostCenters} activities={activeActivities} personnel={activePersonnel} onAddPlannedLabor={actions.addPlannedLabor} onDeletePlannedLabor={(id) => setData(prev=>({...prev, plannedLabors: prev.plannedLabors.filter(l=>l.id!==id)}))} onToggleComplete={(id)=>setData(prev=>({...prev, plannedLabors: prev.plannedLabors.map(l=>l.id===id?{...l, completed:!l.completed}:l)}))} onAddActivity={(n)=>actions.onAddActivity(n)} onAddCostCenter={handleAddCostCenterQuick} onAddPersonnel={(n)=>actions.onAddPersonnel({name: n, role:'Trabajador'})} />}
                {currentTab === 'harvest' && <HarvestView harvests={activeHarvests} costCenters={activeCostCenters} onAddHarvest={(h)=>setData(prev=>({...prev, harvests: [...prev.harvests, {...h, id: generateId(), warehouseId: activeId}]}))} onDeleteHarvest={(id) => setData(prev=>({...prev, harvests: prev.harvests.filter(h=>h.id !== id)}))} onAddCostCenter={handleAddCostCenterQuick} isAdmin={true} />}
                {currentTab === 'stats' && <StatsView laborFactor={data.laborFactor} movements={activeMovements} suppliers={activeSuppliers} costCenters={activeCostCenters} laborLogs={activeLaborLogs} harvests={activeHarvests} />}
                {currentTab === 'budget' && <BudgetView budgets={data.budgets} costCenters={activeCostCenters} activities={activeActivities} inventory={activeInventory} warehouseId={activeId} onSaveBudget={actions.saveBudget} laborLogs={activeLaborLogs} movements={activeMovements} onAddCostCenter={handleAddCostCenterQuick} />}
                {currentTab === 'sanitary' && <SanitaryView costCenters={activeCostCenters} pestLogs={data.pestLogs} onSaveLog={(l)=>setData(prev=>({...prev, pestLogs: [...prev.pestLogs, {...l, id: generateId(), warehouseId: activeId}]}))} />}
                {currentTab === 'assets' && <BiologicalAssetsView costCenters={activeCostCenters} movements={activeMovements} laborLogs={activeLaborLogs} laborFactor={data.laborFactor} onUpdateLot={actions.updateCostCenter} />}
                {currentTab === 'management' && <ManagementView machines={data.machines} maintenanceLogs={data.maintenanceLogs} rainLogs={data.rainLogs} costCenters={activeCostCenters} personnel={activePersonnel} activities={activeActivities} soilAnalyses={data.soilAnalyses} ppeLogs={data.ppeLogs} wasteLogs={data.wasteLogs} assets={data.assets} bpaChecklist={data.bpaChecklist} phenologyLogs={data.phenologyLogs} pestLogs={data.pestLogs} onAddRain={(r)=>setData(prev=>({...prev, rainLogs:[...prev.rainLogs,{...r,id:generateId(),warehouseId:activeId}]}))} onDeleteRain={(id)=>setData(prev=>({...prev, rainLogs:prev.rainLogs.filter(x=>x.id!==id)}))} onAddPPE={(p)=>setData(prev=>({...prev, ppeLogs:[...prev.ppeLogs,{...p,id:generateId(),warehouseId:activeId}]}))} onDeletePPE={(id)=>setData(prev=>({...prev, ppeLogs:prev.ppeLogs.filter(x=>x.id!==id)}))} onAddWaste={(w)=>setData(prev=>({...prev, wasteLogs:[...prev.wasteLogs,{...w,id:generateId(),warehouseId:activeId}]}))} onDeleteWaste={(id)=>setData(prev=>({...prev, wasteLogs:prev.wasteLogs.filter(x=>x.id!==id)}))} isAdmin={true} />}
            </div>
        </main>

        <footer className="h-12 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest shrink-0">
            <div className="flex items-center gap-6">
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Sistema Seguro</span>
                <span className="flex items-center gap-2 font-bold"><ShieldCheck className="w-3 h-3 text-indigo-400" /> Copyright © 2025 Lucas Mateo Tabares Franco</span>
            </div>
        </footer>

        {aiPanelOpen && (
            <div className="fixed inset-0 z-[110] flex justify-end animate-fade-in">
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setAiPanelOpen(false)} />
                <div className="w-full max-w-lg bg-slate-900 h-full relative animate-slide-left shadow-2xl flex flex-col border-l border-slate-700">
                    <AIAssistant data={data} onClose={() => setAiPanelOpen(false)} />
                </div>
            </div>
        )}

      </div>

      {/* MODALS LAYER */}
      <div className="z-[150] relative">
          {showManual && <ManualModal onClose={() => setShowManual(false)} />}
          {showData && data && <DataModal fullState={data} onRestoreData={(d) => { setData(d); setShowData(false); }} onClose={() => setShowData(false)} onShowNotification={onShowNotification} />}
          {(showSettings) && data && (
            <SettingsModal 
                suppliers={activeSuppliers} 
                costCenters={activeCostCenters} 
                personnel={activePersonnel} 
                activities={activeActivities} 
                fullState={data} 
                onUpdateState={(newState) => setData(newState)} 
                onAddSupplier={(n,p,e,a) => setData(prev=>({...prev, suppliers:[...prev.suppliers,{id:generateId(),warehouseId:activeId,name:n,phone:p,email:e,address:a}]}))} 
                onDeleteSupplier={(id) => setData(prev=>({...prev, suppliers: prev.suppliers.filter(s=>s.id!==id)}))} 
                onAddCostCenter={(n,b,a,s,pc,ct,ac,age,density, assocAge) => setData(prev=>({...prev, costCenters:[...prev.costCenters,{id:generateId(),warehouseId:activeId,name:n,budget:b,area:a || 0,stage:s,plantCount:pc, cropType:ct || 'Café',associatedCrop:ac, cropAgeMonths: age, associatedCropDensity: density, associatedCropAge: assocAge}]}))} 
                onDeleteCostCenter={actions.deleteCostCenter} 
                onClose={() => setShowSettings(false)} 
            />
          )}
          {showPayroll && data && <PayrollModal logs={activeLaborLogs} personnel={activePersonnel} warehouseName={currentW?.name || ""} laborFactor={data.laborFactor} onMarkAsPaid={(ids) => setData(prev => ({ ...prev, laborLogs: prev.laborLogs.map(l => ids.includes(l.id) ? { ...l, paid: true } : l) }))} onClose={() => setShowPayroll(false)} />}
          {showAddForm && data && <InventoryForm suppliers={activeSuppliers} onSave={(item, qty, details, unit) => { actions.saveNewItem(item, qty, details, unit); setShowAddForm(false); }} onCancel={() => setShowAddForm(false)} onAddSupplier={(n)=>actions.onAddSupplier(n)} />}
          {movementModal && data && <MovementModal item={movementModal.item} type={movementModal.type} suppliers={activeSuppliers} costCenters={activeCostCenters} personnel={activePersonnel} onSave={(mov, p, e) => {
              const { updatedInventory, movementCost } = processInventoryMovement(data.inventory, mov, p, e); 
              setData(prev => ({ 
                  ...prev, 
                  inventory: updatedInventory, 
                  movements: [{ ...mov, id: generateId(), warehouseId: activeId, date: new Date().toISOString(), calculatedCost: movementCost, syncStatus: 'pending_sync' }, ...prev.movements] 
              })); 
              setMovementModal(null);
          }} onCancel={() => setMovementModal(null)} onAddSupplier={(n)=>actions.onAddSupplier(n)} onAddCostCenter={handleAddCostCenterQuick} onAddPersonnel={(n)=>actions.onAddPersonnel({name: n, role:'Trabajador'})} />}
          {historyItem && data && <HistoryModal item={historyItem} movements={data.movements.filter(m => m.itemId === historyItem.id)} onClose={() => setHistoryItem(null)} />}
          {showGlobalHistory && data && <HistoryModal item={{ name: 'Historial Bodega Global' } as any} movements={activeMovements} onClose={() => setShowGlobalHistory(false)} />}
          {deleteItem && <DeleteModal itemName={deleteItem.name} onConfirm={() => { setData(prev => ({ ...prev, inventory: prev.inventory.filter(i => i.id !== deleteItem.id), movements: prev.movements.filter(m => m.itemId !== deleteItem.id) })); setDeleteItem(null); }} onCancel={() => setDeleteItem(null)} />}
          {showWarehouses && data && <WarehouseModal warehouses={data.warehouses} activeId={activeId} onSwitch={(id) => setData(prev=>({...prev, activeWarehouseId: id}))} onCreate={(n) => setData(prev=>({...prev, warehouses: [...prev.warehouses, {id: generateId(), name: n, created: new Date().toISOString(), ownerId: session?.id || 'local_user'}]}))} onDelete={(id) => setData(prev=>({...prev, warehouses: prev.warehouses.filter(w=>w.id!==id)}))} onClose={() => setShowWarehouses(false)} />}
          {showExport && data && <ExportModal onClose={() => setShowExport(false)} onExportExcel={() => generateExcel(data)} onExportMasterPDF={() => generateMasterPDF(data)} onExportPDF={() => generatePDF(data)} onExportLaborPDF={() => generateLaborReport(data)} onExportHarvestPDF={() => generateHarvestReport(data)} onExportGlobalReport={() => generateGlobalReport(data)} onExportAgronomicDossier={() => generateAgronomicDossier(data)} onExportSafetyReport={() => generateSafetyReport(data)} onExportFieldTemplates={() => generateFieldTemplates(data)} onExportStructurePDF={() => generateFarmStructurePDF(data.costCenters)} onExportStructureExcel={() => generateFarmStructureExcel(data.costCenters)} />}
          {showLaborForm && data && (
            <LaborForm 
              personnel={activePersonnel} 
              costCenters={activeCostCenters} 
              activities={activeActivities} 
              onSave={(log) => { setData(prev => ({ ...prev, laborLogs: [...prev.laborLogs, { ...log, id: generateId(), warehouseId: activeId, paid: false, syncStatus: 'pending_sync' }] })); setShowLaborForm(false); onShowNotification("Jornal registrado.", 'success'); }} 
              onCancel={() => setShowLaborForm(false)} 
              onOpenSettings={() => { setShowLaborForm(false); setShowSettings(true); }} 
              onAddPersonnel={(n)=>actions.onAddPersonnel({name: n, role:'Trabajador'})}
              onAddCostCenter={handleAddCostCenterQuick}
              onAddActivity={(n)=>actions.onAddActivity(n)}
            />
          )}
      </div>
    </div>
  );
};
