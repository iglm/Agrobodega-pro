
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Package, Pickaxe, Target, Tractor, Database, Settings, Globe, ChevronDown, Download, Plus, HelpCircle, CalendarRange, Sprout, Calculator, Lightbulb, Sun, Moon, LayoutGrid, Bug, Settings2, Leaf, Briefcase, ClipboardList, Menu, X as XIcon, LogOut, Home, BarChart3 } from 'lucide-react';
import { generateId, processInventoryMovement } from '../services/inventoryService';
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
import { AgendaView } from '../components/AgendaView';
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
import { InventoryItem, CostClassification } from '../types';

interface MainLayoutProps {
  onShowNotification: (msg: string, type: 'success' | 'error') => void;
}

// Navigation Structure Definition
const NAV_GROUPS = [
  {
    id: 'operativo',
    label: 'Operativo',
    icon: Tractor,
    colorClass: 'text-emerald-500',
    items: [
      { id: 'inventory', label: 'Bodega e Insumos', icon: Package },
      { id: 'harvest', label: 'Ventas y Cosecha', icon: Target },
      { id: 'scheduler', label: 'Programación', icon: CalendarRange },
    ]
  },
  {
    id: 'agronomia',
    label: 'Agronomía',
    icon: Sprout,
    colorClass: 'text-blue-500',
    items: [
      { id: 'management', label: 'Bitácora Campo', icon: ClipboardList },
      { id: 'sanitary', label: 'Sanidad Vegetal', icon: Bug },
      { id: 'assets', label: 'Activos Biológicos', icon: Leaf },
    ]
  },
  {
    id: 'gerencia',
    label: 'Gerencia',
    icon: Briefcase,
    colorClass: 'text-amber-500',
    items: [
      { id: 'labor', label: 'Talento Humano', icon: Pickaxe },
      { id: 'budget', label: 'Presupuesto', icon: Calculator },
      { id: 'stats', label: 'KPIs & BI', icon: Database },
    ]
  },
  {
    id: 'admin',
    label: 'Configuración',
    icon: Settings,
    colorClass: 'text-slate-500',
    items: [
      { id: 'lots', label: 'Mapa de Lotes', icon: LayoutGrid },
      { id: 'masters', label: 'Maestros', icon: Settings2 },
    ]
  }
];

export const MainLayout: React.FC<MainLayoutProps> = ({ onShowNotification }) => {
  const { data, setData, actions } = useData();
  const { session, logout } = useAuth(); // Added logout
  const { theme, toggleTheme } = useTheme();
  
  const [currentTab, setCurrentTab] = useState('inventory');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle
  
  // UI States (Modals)
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showWarehouses, setShowWarehouses] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showData, setShowData] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showPayroll, setShowPayroll] = useState(false);
  const [showGlobalHistory, setShowGlobalHistory] = useState(false);
  const [showLaborForm, setShowLaborForm] = useState(false); 
  
  // Item specific modals
  const [movementModal, setMovementModal] = useState<{item: InventoryItem, type: 'IN' | 'OUT'} | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);

  const activeId = data.activeWarehouseId;
  const currentW = useMemo(() => data.warehouses.find(w => w.id === activeId), [data.warehouses, activeId]);

  // --- MEMOIZED DATA SLICES ---
  const activeInventory = useMemo(() => data.inventory.filter(i => i.warehouseId === activeId), [data.inventory, activeId]);
  const activeCostCenters = useMemo(() => data.costCenters.filter(c => c.warehouseId === activeId), [data.costCenters, activeId]);
  const activeLaborLogs = useMemo(() => data.laborLogs.filter(l => l.warehouseId === activeId), [data.laborLogs, activeId]);
  const activeHarvests = useMemo(() => data.harvests.filter(h => h.warehouseId === activeId), [data.harvests, activeId]);
  const activeMovements = useMemo(() => data.movements.filter(m => m.warehouseId === activeId), [data.movements, activeId]);
  const activePlannedLabors = useMemo(() => data.plannedLabors ? data.plannedLabors.filter(l => l.warehouseId === activeId) : [], [data.plannedLabors, activeId]);
  const activeActivities = useMemo(() => data.activities.filter(a => a.warehouseId === activeId), [data.activities, activeId]);
  const activePersonnel = useMemo(() => data.personnel.filter(p => p.warehouseId === activeId), [data.personnel, activeId]);
  const activeSuppliers = useMemo(() => data.suppliers.filter(s => s.warehouseId === activeId), [data.suppliers, activeId]);
  const activeBudgets = useMemo(() => data.budgets || [], [data.budgets]); 
  const activeMachines = useMemo(() => data.machines.filter(m => m.warehouseId === activeId), [data.machines, activeId]);
  const activeMaintenance = useMemo(() => data.maintenanceLogs.filter(m => m.warehouseId === activeId), [data.maintenanceLogs, activeId]);
  const activeRain = useMemo(() => data.rainLogs.filter(r => r.warehouseId === activeId), [data.rainLogs, activeId]);
  const activeSoil = useMemo(() => data.soilAnalyses.filter(s => s.warehouseId === activeId), [data.soilAnalyses, activeId]);
  const activePPE = useMemo(() => data.ppeLogs.filter(p => p.warehouseId === activeId), [data.ppeLogs, activeId]);
  const activeWaste = useMemo(() => data.wasteLogs.filter(w => w.warehouseId === activeId), [data.wasteLogs, activeId]);
  const activeAssets = useMemo(() => data.assets.filter(a => a.warehouseId === activeId), [data.assets, activeId]);
  const activePhenology = useMemo(() => data.phenologyLogs.filter(l => l.warehouseId === activeId), [data.phenologyLogs, activeId]);
  const activePests = useMemo(() => data.pestLogs.filter(l => l.warehouseId === activeId), [data.pestLogs, activeId]);
  const activeAgenda = useMemo(() => data.agenda.filter(a => a.warehouseId === activeId), [data.agenda, activeId]);

  // --- STABLE CALLBACKS ---
  const handleDashboardAddMovement = useCallback((i: InventoryItem, t: 'IN' | 'OUT') => { setMovementModal({item: i, type: t}); }, []);
  const handleDashboardDelete = useCallback((id: string) => { setData(current => { const item = current.inventory.find(i => i.id === id); if (item) setDeleteItem(item); return current; }); }, [setData]);
  const handleDashboardHistory = useCallback((item: InventoryItem) => { setHistoryItem(item); }, []);
  const handleDashboardGlobalHistory = useCallback(() => { setShowGlobalHistory(true); }, []);

  // --- QUICK ADD HANDLERS ---
  const handleAddCostCenterQuick = (name: string) => { setData(prev => ({...prev, costCenters: [...prev.costCenters, {id: generateId(), warehouseId: activeId, name, area: 0, stage: 'Produccion', cropType: 'Café', plantCount: 0}]})); onShowNotification(`Lote "${name}" creado.`, 'success'); };
  const handleAddPersonnelQuick = (name: string) => { setData(prev => ({...prev, personnel: [...prev.personnel, {id: generateId(), warehouseId: activeId, name, role: 'Trabajador'}]})); onShowNotification(`Trabajador "${name}" registrado.`, 'success'); };
  const handleAddSupplierQuick = (name: string, taxId?: string, creditDays?: number) => { setData(prev => ({...prev, suppliers: [...prev.suppliers, {id: generateId(), warehouseId: activeId, name, taxId, creditDays}]})); onShowNotification(`Proveedor "${name}" añadido.`, 'success'); };
  const handleAddActivityQuick = (name: string, classification: CostClassification = 'JOINT') => { setData(prev => ({...prev, activities: [...prev.activities, {id: generateId(), warehouseId: activeId, name, costClassification: classification}]})); onShowNotification(`Labor "${name}" creada.`, 'success'); };

  const handleSaveMovement = (mov: any, price?: number, exp?: string) => {
      if(!movementModal) return;
      const { updatedInventory, movementCost } = processInventoryMovement(data.inventory, mov, price, exp); 
      setData(prev => ({ ...prev, inventory: updatedInventory, movements: [{ ...mov, id: generateId(), warehouseId: activeId, date: new Date().toISOString(), calculatedCost: movementCost }, ...prev.movements] })); 
      setMovementModal(null);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
    if (currentTab === 'masters') setCurrentTab('inventory'); 
  };

  const renderContent = () => {
    switch (currentTab) {
        case 'inventory': return <Dashboard inventory={activeInventory} costCenters={activeCostCenters} movements={activeMovements} personnel={activePersonnel} machines={activeMachines} maintenanceLogs={activeMaintenance} suppliers={activeSuppliers} onAddMovement={handleDashboardAddMovement} onDelete={handleDashboardDelete} onViewHistory={handleDashboardHistory} onViewGlobalHistory={handleDashboardGlobalHistory} onOpenExport={() => setShowExport(true)} onNavigate={(tabId) => { if(tabId==='masters') setShowSettings(true); else setCurrentTab(tabId); }} isAdmin={true} />;
        case 'lots': return <LotManagementView costCenters={activeCostCenters} laborLogs={activeLaborLogs} movements={activeMovements} harvests={activeHarvests} plannedLabors={activePlannedLabors} onUpdateLot={actions.updateCostCenter} onAddPlannedLabor={actions.addPlannedLabor} activities={activeActivities} onAddCostCenter={(n,b,a,s,pc,ct,ac,age,density, assocAge) => setData(prev=>({...prev, costCenters:[...prev.costCenters,{id:generateId(),warehouseId:activeId,name:n,budget:b,area:a || 0,stage:s,plantCount:pc, cropType:ct || 'Café',associatedCrop:ac, cropAgeMonths: age, associatedCropDensity: density, associatedCropAge: assocAge}]}))} onDeleteCostCenter={actions.deleteCostCenter} />;
        case 'labor': return <LaborView laborLogs={activeLaborLogs} personnel={activePersonnel} costCenters={activeCostCenters} activities={activeActivities} onAddLabor={() => setShowLaborForm(true)} onDeleteLabor={(id) => setData(prev=>({...prev, laborLogs: prev.laborLogs.filter(l=>l.id!==id)}))} isAdmin={true} onOpenPayroll={()=>setShowPayroll(true)} />;
        case 'scheduler': return <LaborSchedulerView plannedLabors={activePlannedLabors} costCenters={activeCostCenters} activities={activeActivities} personnel={activePersonnel} onAddPlannedLabor={actions.addPlannedLabor} onDeletePlannedLabor={(id) => setData(prev=>({...prev, plannedLabors: prev.plannedLabors.filter(l=>l.id!==id)}))} onToggleComplete={(id)=>setData(prev=>({...prev, plannedLabors: prev.plannedLabors.map(l=>l.id===id?{...l, completed:!l.completed}:l)}))} onAddActivity={handleAddActivityQuick} onAddCostCenter={handleAddCostCenterQuick} onAddPersonnel={handleAddPersonnelQuick} budgets={activeBudgets} laborLogs={activeLaborLogs} laborFactor={data.laborFactor} />;
        case 'sanitary': return <SanitaryView costCenters={activeCostCenters} pestLogs={activePests} onSaveLog={(l)=>setData(prev=>({...prev, pestLogs: [...prev.pestLogs, {...l, id: generateId(), warehouseId: activeId}]}))} />;
        case 'harvest': return <HarvestView harvests={activeHarvests} costCenters={activeCostCenters} onAddHarvest={(h)=>setData(prev=>({...prev, harvests: [...prev.harvests, {...h, id: generateId(), warehouseId: activeId}]}))} onDeleteHarvest={(id) => setData(prev=>({...prev, harvests: prev.harvests.filter(h=>h.id !== id)}))} onAddCostCenter={handleAddCostCenterQuick} isAdmin={true} allMovements={data.movements} />;
        case 'management': return <ManagementView machines={activeMachines} maintenanceLogs={activeMaintenance} rainLogs={activeRain} costCenters={activeCostCenters} personnel={activePersonnel} activities={activeActivities} soilAnalyses={activeSoil} ppeLogs={activePPE} wasteLogs={activeWaste} assets={activeAssets} bpaChecklist={data.bpaChecklist} phenologyLogs={activePhenology} pestLogs={activePests} onAddMachine={(m) => setData(prev=>({...prev, machines: [...prev.machines, {...m, id: generateId(), warehouseId: activeId}]}))} onUpdateMachine={(m) => setData(prev=>({...prev, machines: prev.machines.map(x=>x.id===m.id?m:x)}))} onAddMaintenance={(m) => setData(prev=>({...prev, maintenanceLogs: [...prev.maintenanceLogs, {...m, id: generateId(), warehouseId: activeId}]}))} onDeleteMachine={(id) => setData(prev=>({...prev, machines: prev.machines.filter(m=>m.id!==id)}))} onAddRain={(r) => setData(prev=>({...prev, rainLogs: [...prev.rainLogs, {...r, id: generateId(), warehouseId: activeId}]}))} onDeleteRain={(id) => setData(prev=>({...prev, rainLogs: prev.rainLogs.filter(r=>r.id!==id)}))} onAddSoilAnalysis={(s) => setData(prev=>({...prev, soilAnalyses: [...prev.soilAnalyses, {...s, id: generateId(), warehouseId: activeId}]}))} onDeleteSoilAnalysis={(id) => setData(prev=>({...prev, soilAnalyses: prev.soilAnalyses.filter(s=>s.id!==id)}))} onAddPPE={(p) => setData(prev=>({...prev, ppeLogs: [...prev.ppeLogs, {...p, id: generateId(), warehouseId: activeId}]}))} onDeletePPE={(id) => setData(prev=>({...prev, ppeLogs: prev.ppeLogs.filter(p=>p.id!==id)}))} onAddWaste={(w) => setData(prev=>({...prev, wasteLogs: [...prev.wasteLogs, {...w, id: generateId(), warehouseId: activeId}]}))} onDeleteWaste={(id) => setData(prev=>({...prev, wasteLogs: prev.wasteLogs.filter(w=>w.id!==id)}))} onAddAsset={(a) => setData(prev=>({...prev, assets: [...prev.assets, {...a, id: generateId(), warehouseId: activeId}]}))} onDeleteAsset={(id) => setData(prev=>({...prev, assets: prev.assets.filter(a=>a.id!==id)}))} onToggleBpa={(code) => setData(prev=>({...prev, bpaChecklist: {...prev.bpaChecklist, [code]: !prev.bpaChecklist[code]}}))} onAddPhenologyLog={(log) => setData(prev=>({...prev, phenologyLogs: [...prev.phenologyLogs, {...log, id: generateId(), warehouseId: activeId}]}))} onDeletePhenologyLog={(id) => setData(prev=>({...prev, phenologyLogs: prev.phenologyLogs.filter(l=>l.id!==id)}))} onAddPestLog={(log) => setData(prev=>({...prev, pestLogs: [...prev.pestLogs, {...log, id: generateId(), warehouseId: activeId}]}))} onDeletePestLog={(id) => setData(prev=>({...prev, pestLogs: prev.pestLogs.filter(l=>l.id!==id)}))} isAdmin={true} />;
        case 'assets': return <BiologicalAssetsView costCenters={activeCostCenters} movements={activeMovements} laborLogs={activeLaborLogs} laborFactor={data.laborFactor} onUpdateLot={actions.updateCostCenter} />;
        case 'budget': return <BudgetView budgets={activeBudgets} costCenters={activeCostCenters} activities={activeActivities} inventory={activeInventory} warehouseId={activeId} onSaveBudget={actions.saveBudget} laborLogs={activeLaborLogs} movements={activeMovements} laborFactor={data.laborFactor} onAddCostCenter={handleAddCostCenterQuick} />;
        case 'agenda': return <AgendaView agenda={activeAgenda} onAddEvent={(e) => setData(prev => ({ ...prev, agenda: [...prev.agenda, { ...e, id: generateId(), warehouseId: activeId, date: new Date().toISOString(), completed: false }] }))} onToggleEvent={(id) => setData(prev => ({ ...prev, agenda: prev.agenda.map(a => a.id === id ? { ...a, completed: !a.completed } : a) }))} onDeleteEvent={(id) => setData(prev => ({ ...prev, agenda: prev.agenda.filter(a => a.id !== id) }))} />;
        case 'stats': return <StatsView laborFactor={data.laborFactor} movements={activeMovements} suppliers={activeSuppliers} costCenters={activeCostCenters} laborLogs={activeLaborLogs} harvests={activeHarvests} maintenanceLogs={activeMaintenance} rainLogs={activeRain} machines={activeMachines} budgets={activeBudgets} plannedLabors={activePlannedLabors} />;
        default: return <Dashboard inventory={activeInventory} costCenters={activeCostCenters} movements={activeMovements} personnel={activePersonnel} machines={activeMachines} maintenanceLogs={activeMaintenance} suppliers={activeSuppliers} onAddMovement={handleDashboardAddMovement} onDelete={handleDashboardDelete} onViewHistory={handleDashboardHistory} onViewGlobalHistory={handleDashboardGlobalHistory} onOpenExport={() => setShowExport(true)} onNavigate={(t) => setCurrentTab(t)} isAdmin={true} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
        
        {/* --- DESKTOP SIDEBAR --- */}
        <aside className="hidden lg:flex w-72 flex-col bg-slate-900 border-r border-slate-800 flex-shrink-0">
            {/* Brand */}
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-xl font-black text-white flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white"><Globe className="w-5 h-5"/></div>
                    DatosFinca<span className="text-emerald-500">Web</span>
                </h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">Plataforma SaaS v3.0</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                {NAV_GROUPS.map(group => (
                    <div key={group.id}>
                        <h3 className={`text-[10px] font-black uppercase tracking-widest mb-3 px-3 ${group.colorClass}`}>
                            {group.label}
                        </h3>
                        <div className="space-y-1">
                            {group.items.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setCurrentTab(item.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all ${currentTab === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User Profile Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/50">
                <div className="flex items-center gap-3">
                    <img src={session?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=AgroPro"} alt="User" className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{session?.name || 'Administrador'}</p>
                        <p className="text-[10px] text-slate-500 truncate">{session?.email}</p>
                    </div>
                    <button onClick={logout} className="p-2 text-slate-500 hover:text-red-500 transition-colors" title="Cerrar Sesión"><LogOut className="w-4 h-4" /></button>
                </div>
            </div>
        </aside>

        {/* --- MOBILE SIDEBAR DRAWER (Full Menu) --- */}
        {isSidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}>
                <div className="w-72 h-full bg-slate-900 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                        <h1 className="text-lg font-black text-white">Menú Global</h1>
                        <button onClick={() => setIsSidebarOpen(false)}><XIcon className="w-6 h-6 text-slate-400" /></button>
                    </div>
                    <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                        {NAV_GROUPS.map(group => (
                            <div key={group.id}>
                                <h3 className={`text-[10px] font-black uppercase tracking-widest mb-2 px-2 ${group.colorClass}`}>{group.label}</h3>
                                {group.items.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => { setCurrentTab(item.id); setIsSidebarOpen(false); }}
                                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold mb-1 ${currentTab === item.id ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                                    >
                                        <item.icon className="w-5 h-5" /> {item.label}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </nav>
                </div>
            </div>
        )}

        {/* --- MAIN CONTENT AREA --- */}
        <div className="flex-1 flex flex-col min-w-0 h-screen">
            
            {/* Top Header (Web Style) */}
            <header className="h-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    {/* Only show menu button if no bottom nav or as redundancy - hiding on LG anyway */}
                    
                    {/* Farm Selector */}
                    <button onClick={() => setShowWarehouses(true)} className="flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all border border-slate-200 dark:border-slate-700">
                        <div className="p-1.5 bg-emerald-500 rounded-lg text-white shadow-sm"><Globe className="w-4 h-4" /></div>
                        <div className="text-left">
                            <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Finca Activa</span>
                            <span className="block text-sm font-black text-slate-800 dark:text-white leading-none">{currentW?.name || 'Seleccionar...'}</span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={() => setShowManual(true)} className="p-3 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all hidden sm:block" title="Manual"><HelpCircle className="w-5 h-5" /></button>
                    <button onClick={() => setShowData(true)} className="p-3 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all" title="Datos"><Database className="w-5 h-5" /></button>
                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>
                    <button onClick={toggleTheme} className="p-3 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-all">
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            {/* Scrollable Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative pb-24 lg:pb-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {renderContent()}
                </div>
            </main>

            {/* --- MOBILE BOTTOM NAVIGATION --- */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 pb-[env(safe-area-inset-bottom)] z-40 shadow-2xl">
                <div className="flex justify-around items-center h-16">
                    <button 
                        onClick={() => setCurrentTab('inventory')}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all active:scale-90 ${currentTab === 'inventory' ? 'text-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Package className={`w-6 h-6 ${currentTab === 'inventory' ? 'fill-current bg-emerald-500/10 rounded-xl p-0.5' : ''}`} />
                        <span className="text-[9px] font-bold uppercase tracking-wide">Bodega</span>
                    </button>

                    <button 
                        onClick={() => setCurrentTab('harvest')}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all active:scale-90 ${currentTab === 'harvest' ? 'text-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Target className={`w-6 h-6 ${currentTab === 'harvest' ? 'fill-current bg-amber-500/10 rounded-xl p-0.5' : ''}`} />
                        <span className="text-[9px] font-bold uppercase tracking-wide">Cosecha</span>
                    </button>

                    <button 
                        onClick={() => setCurrentTab('labor')}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all active:scale-90 ${currentTab === 'labor' ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Pickaxe className={`w-6 h-6 ${currentTab === 'labor' ? 'fill-current bg-blue-500/10 rounded-xl p-0.5' : ''}`} />
                        <span className="text-[9px] font-bold uppercase tracking-wide">Nómina</span>
                    </button>

                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-500 hover:text-slate-300 transition-all active:scale-90"
                    >
                        <Menu className="w-6 h-6" />
                        <span className="text-[9px] font-bold uppercase tracking-wide">Menú</span>
                    </button>
                </div>
            </div>

            {/* Floating Action Button (Mobile Context) - Adjusted position for Bottom Nav */}
            {currentTab === 'inventory' && (
                <button onClick={() => setShowAddForm(true)} className="fixed bottom-20 lg:bottom-8 right-4 lg:right-8 bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-full shadow-2xl border-4 border-slate-900 z-40 transition-transform hover:scale-110 active:scale-95">
                    <Plus className="w-8 h-8" />
                </button>
            )}
        </div>

        {/* --- MODALS LAYER --- */}
        <div className="z-[200] relative">
            {showManual && <ManualModal onClose={() => setShowManual(false)} />}
            {showData && data && <DataModal fullState={data} onRestoreData={(d) => { setData(d); setShowData(false); }} onClose={() => setShowData(false)} onShowNotification={onShowNotification} onLoadDemoData={() => { actions.loadDemoData(); setShowData(false); }} />}
            {(showSettings || currentTab === 'masters') && data && <SettingsModal suppliers={activeSuppliers} costCenters={activeCostCenters} personnel={activePersonnel} activities={activeActivities} fullState={data} onUpdateState={(newState) => setData(newState)} onAddSupplier={(n,p,e,a) => setData(prev=>({...prev, suppliers:[...prev.suppliers,{id:generateId(),warehouseId:activeId,name:n,phone:p,email:e,address:a}]}))} onDeleteSupplier={(id) => setData(prev=>({...prev, suppliers: prev.suppliers.filter(s=>s.id!==id)}))} onAddCostCenter={(n,b,a,s,pc,ct,ac,age,density, assocAge) => setData(prev=>({...prev, costCenters:[...prev.costCenters,{id:generateId(),warehouseId:activeId,name:n,budget:b,area:a || 0,stage:s,plantCount:pc, cropType:ct || 'Café',associatedCrop:ac, cropAgeMonths: age, associatedCropDensity: density, associatedCropAge: assocAge}]}))} onDeleteCostCenter={actions.deleteCostCenter} onAddPersonnel={(p) => setData(prev=>({...prev, personnel:[...prev.personnel,{...p, id:generateId(),warehouseId:activeId}]}))} onDeletePersonnel={actions.deletePersonnel} onAddActivity={(n, cls) => setData(prev=>({...prev, activities:[...prev.activities,{id:generateId(),warehouseId:activeId,name:n,costClassification:cls}]}))} onDeleteActivity={actions.deleteActivity} onClose={handleCloseSettings} />}
            {showPayroll && data && <PayrollModal logs={activeLaborLogs} personnel={activePersonnel} warehouseName={currentW?.name || ""} laborFactor={data.laborFactor} onMarkAsPaid={(ids) => setData(prev => ({ ...prev, laborLogs: prev.laborLogs.map(l => ids.includes(l.id) ? { ...l, paid: true } : l) }))} onClose={() => setShowPayroll(false)} />}
            {showAddForm && data && <InventoryForm suppliers={activeSuppliers} inventory={activeInventory} onSave={(item, qty, details, unit) => { actions.saveNewItem(item, qty, details, unit); setShowAddForm(false); }} onCancel={() => setShowAddForm(false)} onAddSupplier={handleAddSupplierQuick} />}
            {movementModal && data && <MovementModal item={movementModal.item} type={movementModal.type} suppliers={activeSuppliers} costCenters={activeCostCenters} personnel={activePersonnel} onSave={handleSaveMovement} onCancel={() => setMovementModal(null)} onAddSupplier={handleAddSupplierQuick} onAddCostCenter={handleAddCostCenterQuick} onAddPersonnel={handleAddPersonnelQuick} />}
            {historyItem && data && <HistoryModal item={historyItem} movements={data.movements.filter(m => m.itemId === historyItem.id)} onClose={() => setHistoryItem(null)} />}
            {showGlobalHistory && data && <HistoryModal item={{ name: 'Historial Bodega Global' } as any} movements={activeMovements} onClose={() => setShowGlobalHistory(false)} />}
            {deleteItem && <DeleteModal itemName={deleteItem.name} onConfirm={() => { setData(prev => ({ ...prev, inventory: prev.inventory.filter(i => i.id !== deleteItem.id), movements: prev.movements.filter(m => m.itemId !== deleteItem.id) })); setDeleteItem(null); }} onCancel={() => setDeleteItem(null)} />}
            {showWarehouses && data && <WarehouseModal warehouses={data.warehouses} activeId={activeId} onSwitch={(id) => setData(prev=>({...prev, activeWarehouseId: id}))} onCreate={(n) => setData(prev=>({...prev, warehouses: [...prev.warehouses, {id: generateId(), name: n, created: new Date().toISOString(), ownerId: session?.id || 'local_user'}]}))} onDelete={(id) => setData(prev=>({...prev, warehouses: prev.warehouses.filter(w=>w.id!==id)}))} onClose={() => setShowWarehouses(false)} />}
            {showExport && data && <ExportModal onClose={() => setShowExport(false)} onExportExcel={() => { generateExcel(data); localStorage.setItem('LAST_BACKUP_TIMESTAMP', new Date().toISOString()); }} onExportMasterPDF={() => { generateMasterPDF(data); localStorage.setItem('LAST_BACKUP_TIMESTAMP', new Date().toISOString()); }} onExportPDF={() => generatePDF(data)} onExportLaborPDF={() => generateLaborReport(data)} onExportHarvestPDF={() => generateHarvestReport(data)} onExportGlobalReport={() => generateGlobalReport(data)} onExportAgronomicDossier={() => generateAgronomicDossier(data)} onExportSafetyReport={() => generateSafetyReport(data)} onExportFieldTemplates={() => generateFieldTemplates(data)} onExportStructurePDF={() => generateFarmStructurePDF(data.costCenters)} onExportStructureExcel={() => generateFarmStructureExcel(data.costCenters)} />}
            {showLaborForm && data && <LaborForm personnel={activePersonnel} costCenters={activeCostCenters} activities={activeActivities} onSave={(log) => { setData(prev => ({ ...prev, laborLogs: [...prev.laborLogs, { ...log, id: generateId(), warehouseId: activeId, paid: false }] })); setShowLaborForm(false); onShowNotification("Jornal registrado correctamente", 'success'); }} onCancel={() => setShowLaborForm(false)} onOpenSettings={() => { setShowLaborForm(false); setShowSettings(true); }} onAddPersonnel={handleAddPersonnelQuick} onAddCostCenter={handleAddCostCenterQuick} onAddActivity={(name) => handleAddActivityQuick(name, 'JOINT')} />}
        </div>
    </div>
  );
};
