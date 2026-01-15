
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { AppState, CostCenter, InventoryItem, BudgetPlan, PlannedLabor, Unit, InitialMovementDetails } from '../types';
import { dbService } from '../services/db';
import { loadDataFromLocalStorage, saveDataToLocalStorage } from '../services/inventoryService';
import { useAppActions } from '../hooks/useAppActions';
import { useNotification } from './NotificationContext';

/* 
 * PERFORMANCE OPTIMIZATION STRATEGY (FUTURE ROADMAP)
 * 
 * Actualmente 'AppState' es monolítico. Cualquier actualización (ej: lluvia)
 * dispara un re-render en todos los consumidores del contexto.
 * 
 * Plan de Segregación de Contextos:
 * 
 * 1. InventoryContext
 *    - inventory, movements, suppliers
 *    - Actions: saveNewItem, processMovement
 * 
 * 2. OperationsContext
 *    - costCenters, laborLogs, personnel, activities
 *    - Actions: addLabor, updateLot
 * 
 * 3. TechnicalContext
 *    - rainLogs, pestLogs, phenologyLogs, soilAnalyses
 * 
 * 4. FinancialContext
 *    - financeLogs, budgets, assets
 * 
 * Implementación: Usar composición de Providers en App.tsx o una librería de 
 * gestión de estado atómico como Jotai o Zustand para evitar re-renders innecesarios
 * sin la complejidad de múltiples Context Providers anidados.
 */

interface DataContextType {
  data: AppState;
  setData: React.Dispatch<React.SetStateAction<AppState>>;
  isDataLoaded: boolean;
  isSaving: boolean; // Visual feedback state
  actions: {
    loadDemoData: () => void;
    deleteCostCenter: (id: string) => void;
    deletePersonnel: (id: string) => void;
    deleteActivity: (id: string) => void;
    saveNewItem: (item: Omit<InventoryItem, 'id' | 'currentQuantity' | 'baseUnit' | 'warehouseId' | 'averageCost'>, initialQuantity: number, initialMovementDetails?: InitialMovementDetails, initialUnit?: Unit) => void;
    addPlannedLabor: (labor: Omit<PlannedLabor, 'id' | 'warehouseId' | 'completed'>) => void;
    updateCostCenter: (lot: CostCenter) => void;
    saveBudget: (budget: BudgetPlan) => void;
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showNotification } = useNotification();
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // New state
  const [data, setData] = useState<AppState>(() => ({
      warehouses: [], activeWarehouseId: '', inventory: [], movements: [], suppliers: [], costCenters: [], personnel: [], activities: [], laborLogs: [], harvests: [], machines: [], maintenanceLogs: [], rainLogs: [], financeLogs: [], soilAnalyses: [], ppeLogs: [], wasteLogs: [], agenda: [], phenologyLogs: [], pestLogs: [], plannedLabors: [], budgets: [], assets: [], bpaChecklist: {}, laborFactor: 1.0,
      clients: [], salesContracts: [], sales: []
  }));

  // Lógica de negocio extraída a un hook personalizado, usando la notificación del contexto
  const actions = useAppActions(data, setData, showNotification);

  // Carga Inicial
  useEffect(() => {
    const initData = async () => {
        try {
            const savedState = await dbService.loadState();
            if (savedState && savedState.activeWarehouseId) {
                setData(savedState);
            } else {
                const legacy = loadDataFromLocalStorage();
                setData(legacy);
            }
        } catch (e) {
            console.error("Error cargando DB local:", e);
        } finally {
            setIsDataLoaded(true);
        }
    };
    initData();
  }, []);

  // Persistencia Automática Optimizada (Safety & Speed)
  useEffect(() => {
    if (!isDataLoaded || !data.activeWarehouseId) return;

    setIsSaving(true);

    // Reduced Debounce: 500ms for better responsiveness to closing
    const timeoutId = setTimeout(async () => {
        try {
            // 1. Guardado Asíncrono (IndexedDB): Siempre ocurre.
            await dbService.saveState(data);
            
            // 2. Guardado Síncrono (LocalStorage): Solo si NO se ha migrado (Legacy support)
            const isMigrated = localStorage.getItem('MIGRATION_COMPLETED') === 'true';
            if (!isMigrated) {
                saveDataToLocalStorage(data);
            }
        } catch (err) {
            console.warn("Guardado asíncrono:", err);
        } finally {
            setIsSaving(false);
        }
    }, 500);

    // SAFETY NET: Force sync save attempt on unload if browser supports it or via LS as fallback
    const handleBeforeUnload = () => {
        // En caso de cierre repentino, forzamos un guardado síncrono en localStorage
        // como respaldo de emergencia, ya que IDB es asíncrono y podría no completarse.
        try {
            localStorage.setItem('agrobodega_pro_v1', JSON.stringify(data));
        } catch (e) {
            console.error("Fallo guardado de emergencia", e);
        }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [data, isDataLoaded]);

  const contextValue = useMemo(() => ({
    data,
    setData,
    isDataLoaded,
    isSaving,
    actions
  }), [data, isDataLoaded, isSaving, actions]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
