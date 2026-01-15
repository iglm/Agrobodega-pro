
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Package, Pickaxe, Target, Tractor, Database, Settings, Globe, ChevronDown, Download, Plus, HelpCircle, CalendarRange, Sprout, Calculator, Lightbulb, Sun, Moon, LayoutGrid, Bug, Settings2, Leaf, DollarSign, Briefcase, ClipboardList, Sparkles } from 'lucide-react';
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
import { AIAssistant } from '../components/AIAssistant'; // Nueva importación
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
    activeClass: 'bg-emerald-500 text-white',
    items: [
      { id: 'inventory', label: 'Bodega', icon: Package },
      { id: 'harvest', label: 'Ventas', icon: Target },
      { id: 'scheduler', label: 'Programar', icon: CalendarRange },
    ]
  },
  {
    id: 'agronomia',
    label: 'Campo',
    icon: Sprout,
    colorClass: 'text-blue-500',
    activeClass: 'bg-blue-500 text-white',
    items: [
      { id: 'management', label: 'Bitácora', icon: ClipboardList },
      { id: 'sanitary', label: 'Sanidad', icon: Bug },
      { id: 'assets', label: 'Activos', icon: Leaf },
    ]
  },
  {
    id: 'gerencia',
    label: 'Gestión',
    icon: Briefcase,
    colorClass: 'text-amber-500',
    activeClass: 'bg-amber-500 text-white',
    items: [
      { id: 'labor', label: 'Nómina', icon: Pickaxe },
      { id: 'budget', label: 'Presupuesto', icon: Calculator },
      { id: 'stats', label: 'KPIs', icon: Database },
    ]
  },
  {
    id: 'admin',
    label: 'Config',
    icon: Settings,
    colorClass: 'text-slate-500',
    activeClass: 'bg-slate-700 text-white',
    items: [
      { id: 'lots', label: 'Mapa Lotes', icon: LayoutGrid },
      { id: 'masters', label: 'Maestros', icon: Settings2 },
    ]
  }
];

export const MainLayout: React.FC<MainLayoutProps> = ({ onShowNotification }) => {
  const { data, setData, actions } = useData();
  const { session } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [currentTab, setCurrentTab] = useState('inventory');
  const [activeGroup, setActiveGroup] = useState('operativo');
  
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
  const [showAI, setShowAI] = useState(false); // Nuevo modal IA
  
  // Item specific modals
  const [movementModal, setMovementModal] = useState<{item: InventoryItem, type: 'IN' | 'OUT'} | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);

  const activeId = data.activeWarehouseId;
  const currentW = useMemo(() => data.warehouses.find(w => w.id === activeId), [data.warehouses, activeId]);

  // Sync active group with currentTab if changed externally
  useEffect(() => {
    const foundGroup = NAV_GROUPS.find(g => g.items.some(item => item.id === currentTab));
    if (foundGroup && foundGroup.id !== activeGroup) {
      setActiveGroup(foundGroup.id);
    }
  }, [currentTab]);

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
  const handleDashboardAddMovement = useCallback((i: InventoryItem, t: 'IN' | 'OUT') => {
    setMovementModal({item: i, type: t});
  }, []);

  const handleDashboardDelete = useCallback((id: string) => {
    setData(current => {
        const item = current.inventory.find(i => i.id === id);
        if (item) setDeleteItem(item);
        return current; 
    });
  }, [setData]);

  const handleDashboardHistory = useCallback((item: InventoryItem) => {
    setHistoryItem(item);
  }, []);

  const handleDashboardGlobalHistory = useCallback(() => {
    setShowGlobalHistory(true);
  }, []);

  // --- QUICK ADD HANDLERS ---
  const handleAddCostCenterQuick = (name: string) => {
      setData(prev => ({
          ...prev,
          costCenters: [...prev.costCenters, {
              id: generateId(), warehouseId: activeId, name,
              area: 0, stage: 'Produccion', cropType: 'Café', plantCount: 0 
          }]
      }));
      onShowNotification(`Lote "${name}" creado. Edite detalles en Configuración.`, 'success');
  };

  const handleAddPersonnelQuick = (name: string) => {
      setData(prev => ({
          ...prev,
          personnel: [...prev.personnel, {
              id: generateId(), warehouseId: activeId, name, role: 'Trabajador'
          }]
      }));
      onShowNotification(`Trabajador "${name}" registrado.`, 'success');
  };

  const handleAddSupplierQuick = (name: string, taxId?: string, creditDays?: number) => {
      setData(prev => ({
          ...prev,
          suppliers: [...prev.suppliers, { 
              id: generateId(), warehouseId: activeId, name, taxId, creditDays
          }]
      }));
      onShowNotification(`Proveedor "${name}" añadido.`, 'success');
  };

  const handleAddActivityQuick = (name: string, classification: CostClassification = 'JOINT') => {
      setData(prev => ({
          ...prev,
          activities: [...prev.activities, {
              id: generateId(), warehouseId: activeId, name, costClassification: classification
          }]
      }));
      onShowNotification(`Labor "${name}" creada.`, 'success');
  };

  const handleSaveMovement = (mov: any, price?: number, exp?: string) => {
      if(!movementModal) return;
      const { updatedInventory, movementCost } = processInventoryMovement(data.inventory, mov, price, exp); 
      setData(prev => ({ 
          ...prev, 
          inventory: updatedInventory, 
          movements: [{ ...mov, id: generateId(), warehouseId: activeId, date: new Date().toISOString(), calculatedCost: movementCost }, ...prev.movements] 
      })); 
      setMovementModal(null);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
    if (currentTab === 'masters') {
      setCurrentTab('inventory'); 
    }
  };

  return (
    <>
      {/* HEADER & NAV */}
      <header className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b-2 border-slate-300 dark:border-slate-800 sticky top-0 z-40 px-4 py-2 pt-10 sm:pt-2">
        <div className="max-w-4xl mx-auto flex flex-col gap-2">
            
            {/* Top Bar: Farm Selector & Tools */}
            <div className="flex justify-between items-center mb-1">
                <button onClick={() => setShowWarehouses(true)} className="flex items-center gap-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                    <div className="p-1.5 bg-emerald-600 rounded-lg shadow-lg"><Globe className="w-4 h-4 text-white" /></div>
                    <div className="text-left"><h1 className="text-sm font-black flex items-center gap-1 text-slate-900 dark:text-white">DatosFinca Viva <ChevronDown className="w-3 h-3" /></h1><span className="text-[9px] text-slate-500 uppercase font-black">{currentW?.name || 'Seleccionar Finca'}</span></div>
                </button>
                <div className="flex gap-1 items-center">
                    <button onClick={() => setShowManual(true)} className="p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors"><HelpCircle className="w-5 h-5" /></button>
                    <button onClick={() => setShowData(true)} className="p-2 text-orange-600 hover:text-orange-400 transition-colors"><Database className="w-5 h-5" /></button>
                    <button onClick={toggleTheme} className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded-full border border-slate-300 dark:border-slate-700 active:scale-95 transition-all">
                      {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-700" />}
                    </button>
                </div>
            </div>

            {/* Level 1: Category Groups */}
            <div className="flex bg-slate-200 dark:bg-slate-950 p-1 rounded-2xl gap-1 overflow-x-auto scrollbar-hide">
                {NAV_GROUPS.map(group => (
                    <button 
                        key={group.id}
                        onClick={() => setActiveGroup(group.id)}
                        className={`flex-1 min-w-[80px] py-2 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${activeGroup === group.id ? `shadow-md ${group.activeClass}` : `text-slate-500 hover:text-slate-700 dark:hover:text-slate-300`}`}
                    >
                        <group.icon className="w-4 h-4" />
                        {group.label}
                    </button>
                ))}
            </div>

            {/* Level 2: Specific Actions */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl gap-2 overflow-x-auto scrollbar-hide border border-slate-300 dark:border-slate-800 animate-fade-in key={activeGroup}">
                {NAV_GROUPS.find(g => g.id === activeGroup)?.items.map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setCurrentTab(tab.id)} 
                        className={`flex-1 min-w-[90px] py-3 rounded-xl text-[10px] font-black uppercase flex flex-col items-center gap-1 transition-all ${currentTab === tab.id ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-emerald-400 shadow-md ring-1 ring-slate-200 dark:ring-slate-700' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                    >
                        <tab.icon className={`w-5 h-5 ${currentTab === tab.id ? 'text-emerald-500' : 'text-slate-400'}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-4xl mx-auto p-4 pb-40">
        {currentTab === 'inventory' && (
            <Dashboard 
                inventory={activeInventory} 
                costCenters={activeCostCenters} 
                movements={activeMovements}
                personnel={activePersonnel}
                machines={activeMachines}
                maintenanceLogs={activeMaintenance}
                suppliers={activeSuppliers}
                onAddMovement={handleDashboardAddMovement} 
                onDelete={handleDashboardDelete} 
                onViewHistory={handleDashboardHistory} 
                onViewGlobalHistory={handleDashboardGlobalHistory} 
                onOpenExport={() => setShowExport(true)}
                onNavigate={(tabId) => {
                    const foundGroup = NAV_GROUPS.find(g => g.items.some(item => item.id === tabId));
                    if (foundGroup) {
                        setActiveGroup(foundGroup.id);
                        setCurrentTab(tabId);
                    } else if (tabId === 'masters') {
                        setShowSettings(true);
                    }
                }}
                isAdmin={true} 
            />
        )}
        
        {currentTab === 'lots' && <LotManagementView costCenters={activeCostCenters} laborLogs={activeLaborLogs} movements={activeMovements} harvests={activeHarvests} plannedLabors={activePlannedLabors} onUpdateLot={actions.updateCostCenter} onAddPlannedLabor={actions.addPlannedLabor} activities={activeActivities} onAddCostCenter={(n,b,a,s,pc,ct,ac,age,density, assocAge) => setData(prev=>({...prev, costCenters:[...prev.costCenters,{id:generateId(),warehouseId:activeId,name:n,budget:b,area:a || 0,stage:s,plantCount:pc, cropType:ct || 'Café',associatedCrop:ac, cropAgeMonths: age, associatedCropDensity: density, associatedCropAge: assocAge}]}))} onDeleteCostCenter={actions.deleteCostCenter} />}

        {currentTab === 'labor' && <LaborView laborLogs={activeLaborLogs} personnel={activePersonnel} costCenters={activeCostCenters} activities={activeActivities} onAddLabor={() => setShowLaborForm(true)} onDeleteLabor={(id) => setData(prev=>({...prev, laborLogs: prev.laborLogs.filter(l=>l.id!==id)}))} isAdmin={true} onOpenPayroll={()=>setShowPayroll(true)} />}
        
        {currentTab === 'scheduler' && <LaborSchedulerView plannedLabors={activePlannedLabors} costCenters={activeCostCenters} activities={activeActivities} personnel={activePersonnel} onAddPlannedLabor={actions.addPlannedLabor} onDeletePlannedLabor={(id) => setData(prev=>({...prev, plannedLabors: prev.plannedLabors.filter(l=>l.id!==id)}))} onToggleComplete={(id)=>setData(prev=>({...prev, plannedLabors: prev.plannedLabors.map(l=>l.id===id?{...l, completed:!l.completed}:l)}))} onAddActivity={handleAddActivityQuick} onAddCostCenter={handleAddCostCenterQuick} onAddPersonnel={handleAddPersonnelQuick} budgets={activeBudgets} laborLogs={activeLaborLogs} laborFactor={data.laborFactor} />}
        
        {currentTab === 'sanitary' && <SanitaryView costCenters={activeCostCenters} pestLogs={activePests} onSaveLog={(l)=>setData(prev=>({...prev, pestLogs: [...prev.pestLogs, {...l, id: generateId(), warehouseId: activeId}]}))} />}

        {currentTab === 'harvest' && <HarvestView harvests={activeHarvests} costCenters={activeCostCenters} onAddHarvest={(h)=>setData(prev=>({...prev, harvests: [...prev.harvests, {...h, id: generateId(), warehouseId: activeId}]}))} onDeleteHarvest={(id) => setData(prev=>({...prev, harvests: prev.harvests.filter(h=>h.id !== id)}))} onAddCostCenter={handleAddCostCenterQuick} isAdmin={true} allMovements={data.movements} />}
        {currentTab === 'management' && <ManagementView machines={activeMachines} maintenanceLogs={activeMaintenance} rainLogs={activeRain} costCenters={activeCostCenters} personnel={activePersonnel} activities={activeActivities} soilAnalyses={activeSoil} ppeLogs={activePPE} wasteLogs={activeWaste} assets={activeAssets} bpaChecklist={data.bpaChecklist} phenologyLogs={activePhenology} pestLogs={activePests} onAddMachine={(m) => setData(prev=>({...prev, machines: [...prev.machines, {...m, id: generateId(), warehouseId: activeId}]}))} onUpdateMachine={(m) => setData(prev=>({...prev, machines: prev.machines.map(x=>x.id===m.id?m:x)}))} onAddMaintenance={(m) => setData(prev=>({...prev, maintenanceLogs: [...prev.maintenanceLogs, {...m, id: generateId(), warehouseId: activeId}]}))} onDeleteMachine={(id) => setData(prev=>({...prev, machines: prev.machines.filter(m=>m.id!==id)}))} onAddRain={(r) => setData(prev=>({...prev, rainLogs: [...prev.rainLogs, {...r, id: generateId(), warehouseId: activeId}]}))} onDeleteRain={(id) => setData(prev=>({...prev, rainLogs: prev.rainLogs.filter(r=>r.id!==id)}))} onAddSoilAnalysis={(s) => setData(prev=>({...prev, soilAnalyses: [...prev.soilAnalyses, {...s, id: generateId(), warehouseId: activeId}]}))} onDeleteSoilAnalysis={(id) => setData(prev=>({...prev, soilAnalyses: prev.soilAnalyses.filter(s=>s.id!==id)}))} onAddPPE={(p) => setData(prev=>({...prev, ppeLogs: [...prev.ppeLogs, {...p, id: generateId(), warehouseId: activeId}]}))} onDeletePPE={(id) => setData(prev=>({...prev, ppeLogs: prev.ppeLogs.filter(p=>p.id!==id)}))} onAddWaste={(w) => setData(prev=>({...prev, wasteLogs: [...prev.wasteLogs, {...w, id: generateId(), warehouseId: activeId}]}))} onDeleteWaste={(id) => setData(prev=>({...prev, wasteLogs: prev.wasteLogs.filter(w=>w.id!==id)}))} onAddAsset={(a) => setData(prev=>({...prev, assets: [...prev.assets, {...a, id: generateId(), warehouseId: activeId}]}))} onDeleteAsset={(id) => setData(prev=>({...prev, assets: prev.assets.filter(a=>a.id!==id)}))} onToggleBpa={(code) => setData(prev=>({...prev, bpaChecklist: {...prev.bpaChecklist, [code]: !prev.bpaChecklist[code]}}))} onAddPhenologyLog={(log) => setData(prev=>({...prev, phenologyLogs: [...prev.phenologyLogs, {...log, id: generateId(), warehouseId: activeId}]}))} onDeletePhenologyLog={(id) => setData(prev=>({...prev, phenologyLogs: prev.phenologyLogs.filter(l=>l.id!==id)}))} onAddPestLog={(log) => setData(prev=>({...prev, pestLogs: [...prev.pestLogs, {...log, id: generateId(), warehouseId: activeId}]}))} onDeletePestLog={(id) => setData(prev=>({...prev, pestLogs: prev.pestLogs.filter(l=>l.id!==id)}))} isAdmin={true} />}
        {currentTab === 'assets' && <BiologicalAssetsView costCenters={activeCostCenters} movements={activeMovements} laborLogs={activeLaborLogs} laborFactor={data.laborFactor} onUpdateLot={actions.updateCostCenter} />}
        {currentTab === 'budget' && <BudgetView budgets={activeBudgets} costCenters={activeCostCenters} activities={activeActivities} inventory={activeInventory} warehouseId={activeId} onSaveBudget={actions.saveBudget} laborLogs={activeLaborLogs} movements={activeMovements} laborFactor={data.laborFactor} onAddCostCenter={handleAddCostCenterQuick} />}
        {currentTab === 'agenda' && <AgendaView agenda={activeAgenda} onAddEvent={(e) => setData(prev => ({ ...prev, agenda: [...prev.agenda, { ...e, id: generateId(), warehouseId: activeId, date: new Date().toISOString(), completed: false }] }))} onToggleEvent={(id) => setData(prev => ({ ...prev, agenda: prev.agenda.map(a => a.id === id ? { ...a, completed: !a.completed } : a) }))} onDeleteEvent={(id) => setData(prev => ({ ...prev, agenda: prev.agenda.filter(a => a.id !== id) }))} />}
        {currentTab === 'stats' && <StatsView laborFactor={data.laborFactor} movements={activeMovements} suppliers={activeSuppliers} costCenters={activeCostCenters} laborLogs={activeLaborLogs} harvests={activeHarvests} maintenanceLogs={activeMaintenance} rainLogs={activeRain} machines={activeMachines} budgets={activeBudgets} plannedLabors={activePlannedLabors} />}
        
        {/* Floating Buttons */}
        <div className="fixed bottom-6 left-6 flex flex-col gap-3 z-30">
            <button onClick={() => setShowExport(true)} className="p-4 bg-slate-800 text-white rounded-3xl shadow-2xl border-2 border-slate-600 active:scale-90 transition-all"><Download className="w-6 h-6" /></button>
            {/* BOTÓN GEMINI FUTURISTA */}
            <button 
                onClick={() => setShowAI(true)} 
                className="p-5 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white rounded-[2rem] shadow-2xl border-2 border-indigo-400/50 active:scale-95 transition-all group overflow-hidden relative"
            >
                <div className="absolute inset-0 bg-white/20 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Sparkles className="w-8 h-8 group-hover:rotate-12 transition-transform" />
            </button>
        </div>
        
        {currentTab === 'inventory' && <button onClick={() => setShowAddForm(true)} className="fixed bottom-6 right-6 bg-emerald-600 text-white p-5 rounded-3xl shadow-2xl border-2 border-emerald-400 active:scale-95 transition-all z-30 mr-20 sm:mr-0"><Plus className="w-8 h-8" /></button>}
      </main>

      {/* MODALS LAYER */}
      <div className="z-[100] relative">
          {showAI && <AIAssistant data={data} onClose={() => setShowAI(false)} />}
          {showManual && <ManualModal onClose={() => setShowManual(false)} />}
          {showData && data && <DataModal fullState={data} onRestoreData={(d) => { setData(d); setShowData(false); }} onClose={() => setShowData(false)} onShowNotification={onShowNotification} />}
          
          {/* Settings Modal */}
          {(showSettings || currentTab === 'masters') && data && (
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
                onAddPersonnel={(p) => setData(prev=>({...prev, personnel:[...prev.personnel,{...p, id:generateId(),warehouseId:activeId}]}))} 
                onDeletePersonnel={actions.deletePersonnel} 
                onAddActivity={(n, cls) => setData(prev=>({...prev, activities:[...prev.activities,{id:generateId(),warehouseId:activeId,name:n,costClassification:cls}]}))} 
                onDeleteActivity={actions.deleteActivity} 
                onClose={handleCloseSettings} 
            />
          )}

          {showPayroll && data && <PayrollModal logs={activeLaborLogs} personnel={activePersonnel} warehouseName={currentW?.name || ""} laborFactor={data.laborFactor} onMarkAsPaid={(ids) => setData(prev => ({ ...prev, laborLogs: prev.laborLogs.map(l => ids.includes(l.id) ? { ...l, paid: true } : l) }))} onClose={() => setShowPayroll(false)} />}
          {showAddForm && data && <InventoryForm suppliers={activeSuppliers} inventory={activeInventory} onSave={(item, qty, details, unit) => { actions.saveNewItem(item, qty, details, unit); setShowAddForm(false); }} onCancel={() => setShowAddForm(false)} onAddSupplier={handleAddSupplierQuick} />}
          {movementModal && data && <MovementModal item={movementModal.item} type={movementModal.type} suppliers={activeSuppliers} costCenters={activeCostCenters} personnel={activePersonnel} onSave={handleSaveMovement} onCancel={() => setMovementModal(null)} onAddSupplier={handleAddSupplierQuick} onAddCostCenter={handleAddCostCenterQuick} onAddPersonnel={handleAddPersonnelQuick} />}
          {historyItem && data && <HistoryModal item={historyItem} movements={data.movements.filter(m => m.itemId === historyItem.id)} onClose={() => setHistoryItem(null)} />}
          {showGlobalHistory && data && <HistoryModal item={{ name: 'Historial Bodega Global' } as any} movements={activeMovements} onClose={() => setShowGlobalHistory(false)} />}
          {deleteItem && <DeleteModal itemName={deleteItem.name} onConfirm={() => { setData(prev => ({ ...prev, inventory: prev.inventory.filter(i => i.id !== deleteItem.id), movements: prev.movements.filter(m => m.itemId !== deleteItem.id) })); setDeleteItem(null); }} onCancel={() => setDeleteItem(null)} />}
          {showWarehouses && data && <WarehouseModal warehouses={data.warehouses} activeId={activeId} onSwitch={(id) => setData(prev=>({...prev, activeWarehouseId: id}))} onCreate={(n) => setData(prev=>({...prev, warehouses: [...prev.warehouses, {id: generateId(), name: n, created: new Date().toISOString(), ownerId: session?.id || 'local_user'}]}))} onDelete={(id) => setData(prev=>({...prev, warehouses: prev.warehouses.filter(w=>w.id!==id)}))} onClose={() => setShowWarehouses(false)} />}
          {showExport && data && <ExportModal 
              onClose={() => setShowExport(false)}
              onExportExcel={() => { generateExcel(data); localStorage.setItem('LAST_BACKUP_TIMESTAMP', new Date().toISOString()); }}
              onExportMasterPDF={() => { generateMasterPDF(data); localStorage.setItem('LAST_BACKUP_TIMESTAMP', new Date().toISOString()); }}
              onExportPDF={() => generatePDF(data)}
              onExportLaborPDF={() => generateLaborReport(data)}
              onExportHarvestPDF={() => generateHarvestReport(data)}
              onExportGlobalReport={() => generateGlobalReport(data)}
              onExportAgronomicDossier={() => generateAgronomicDossier(data)}
              onExportSafetyReport={() => generateSafetyReport(data)}
              onExportFieldTemplates={() => generateFieldTemplates(data)}
              onExportStructurePDF={() => generateFarmStructurePDF(data.costCenters)}
              onExportStructureExcel={() => generateFarmStructureExcel(data.costCenters)}
          />}
          {showLaborForm && data && (
            <LaborForm 
              personnel={activePersonnel} 
              costCenters={activeCostCenters} 
              activities={activeActivities} 
              onSave={(log) => { 
                setData(prev => ({ ...prev, laborLogs: [...prev.laborLogs, { ...log, id: generateId(), warehouseId: activeId, paid: false }] })); 
                setShowLaborForm(false); 
                onShowNotification("Jornal registrado correctamente", 'success'); 
              }} 
              onCancel={() => setShowLaborForm(false)} 
              onOpenSettings={() => { setShowLaborForm(false); setShowSettings(true); }} 
              onAddPersonnel={handleAddPersonnelQuick}
              onAddCostCenter={handleAddCostCenterQuick}
              onAddActivity={(name) => handleAddActivityQuick(name, 'JOINT')}
            />
          )}
      </div>
    </>
  );
};
