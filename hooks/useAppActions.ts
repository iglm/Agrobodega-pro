
import { Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import { AppState, InventoryItem, Movement, Unit, PlannedLabor, CostCenter, BudgetPlan, InitialMovementDetails, ContractType } from '../types';
import { processInventoryMovement, generateId, getBaseUnitType, convertToBase } from '../services/inventoryService';
import { getDemoData } from '../services/reportService';

export const useAppActions = (
  data: AppState,
  setData: Dispatch<SetStateAction<AppState>>,
  notify: (msg: string, type: 'success' | 'error') => void
) => {

  const loadDemoData = useCallback(() => {
    const demoData = getDemoData();
    setData(demoData);
    notify('Datos de demostración cargados exitosamente.', 'success');
  }, [setData, notify]);

  const deleteCostCenter = useCallback((id: string) => {
    // We need the latest data for validation, so we can't remove 'data' dependency 
    // unless we use a ref, but standard pattern is acceptable here as data changes imply UI updates anyway.
    const deps = {
      labor: data.laborLogs.filter(l => l.costCenterId === id).length,
      harvests: data.harvests.filter(h => h.costCenterId === id).length,
      movements: data.movements.filter(m => m.costCenterId === id).length,
      planned: (data.plannedLabors || []).filter(p => p.costCenterId === id).length,
      budgets: (data.budgets || []).filter(b => b.costCenterId === id).length,
      others: (data.phenologyLogs || []).filter(p => p.costCenterId === id).length + 
              (data.pestLogs || []).filter(p => p.costCenterId === id).length + 
              (data.soilAnalyses || []).filter(s => s.costCenterId === id).length
    };
    const totalDeps = Object.values(deps).reduce((a, b) => a + b, 0);

    if (totalDeps > 0) {
      const message = `⚠️ ALERTA DE INTEGRIDAD:\n\nEste lote tiene ${totalDeps} registros vinculados:\n- ${deps.harvests} Ventas/Cosechas\n- ${deps.labor} Pagos de Nómina\n- ${deps.movements} Insumos Aplicados\n\nPROTOCOLO DE SEGURIDAD:\n1. Los registros financieros NO SE BORRARÁN (se marcan como 'Lote Eliminado').\n2. Las planificaciones futuras SÍ se eliminarán.\n\n¿Confirma la eliminación?`;
      if (!confirm(message)) return;
    } else {
      if (!confirm("¿Está seguro de eliminar este Lote?")) return;
    }

    setData(prev => ({
      ...prev,
      costCenters: prev.costCenters.filter(c => c.id !== id),
      laborLogs: prev.laborLogs.map(l => l.costCenterId === id ? { ...l, costCenterId: 'deleted', costCenterName: `${l.costCenterName} (Eliminado)` } : l),
      harvests: prev.harvests.map(h => h.costCenterId === id ? { ...h, costCenterId: 'deleted', costCenterName: `${h.costCenterName} (Eliminado)` } : h),
      movements: prev.movements.map(m => m.costCenterId === id ? { ...m, costCenterId: undefined, costCenterName: `${m.costCenterName} (Eliminado)` } : m),
      plannedLabors: (prev.plannedLabors || []).filter(p => p.costCenterId !== id),
      budgets: (prev.budgets || []).filter(b => b.costCenterId !== id),
      phenologyLogs: (prev.phenologyLogs || []).filter(p => p.costCenterId !== id),
      pestLogs: (prev.pestLogs || []).filter(p => p.costCenterId !== id),
      soilAnalyses: (prev.soilAnalyses || []).filter(s => s.costCenterId !== id)
    }));
    notify('Lote eliminado. Integridad financiera preservada.', 'success');
  }, [data, setData, notify]);

  const deletePersonnel = useCallback((id: string) => {
    const pendingPay = data.laborLogs.filter(l => l.personnelId === id && !l.paid).length;
    if (pendingPay > 0) {
      alert(`⛔ NO SE PUEDE ELIMINAR:\n\nTiene ${pendingPay} pagos pendientes. Liquide la deuda primero.`);
      return;
    }
    const historyCount = data.laborLogs.filter(l => l.personnelId === id).length;
    if (historyCount > 0) {
      if (!confirm(`Este trabajador tiene ${historyCount} registros históricos.\n\nSe conservará el historial, pero se eliminará de la lista activa.\n\n¿Proceder?`)) return;
    } else {
      if (!confirm("¿Eliminar trabajador?")) return;
    }

    setData(prev => ({
      ...prev,
      personnel: prev.personnel.filter(p => p.id !== id),
      laborLogs: prev.laborLogs.map(l => l.personnelId === id ? { ...l, personnelId: 'deleted', personnelName: `${l.personnelName} (Retirado)` } : l),
      movements: prev.movements.map(m => m.personnelId === id ? { ...m, personnelId: undefined, personnelName: `${m.personnelName} (Retirado)` } : m),
      plannedLabors: (prev.plannedLabors || []).map(p => p.assignedPersonnelIds?.includes(id) ? { ...p, assignedPersonnelIds: p.assignedPersonnelIds.filter(pid => pid !== id) } : p)
    }));
    notify('Trabajador retirado correctamente.', 'success');
  }, [data, setData, notify]);

  const deleteActivity = useCallback((id: string) => {
    const usage = data.laborLogs.filter(l => l.activityId === id).length;
    if (usage > 0) {
      if (!confirm(`Esta labor se usa en ${usage} registros.\n\nSe conservará el historial, pero ya no podrá usarse en nuevos registros.\n\n¿Proceder?`)) return;
    } else {
      if (!confirm("¿Eliminar labor?")) return;
    }

    setData(prev => ({
      ...prev,
      activities: prev.activities.filter(a => a.id !== id),
      laborLogs: prev.laborLogs.map(l => l.activityId === id ? { ...l, activityId: 'deleted', activityName: `${l.activityName} (Obsolescente)` } : l),
      plannedLabors: (prev.plannedLabors || []).filter(p => p.activityId !== id)
    }));
    notify('Labor eliminada del catálogo.', 'success');
  }, [data, setData, notify]);

  const saveNewItem = useCallback((item: Omit<InventoryItem, 'id' | 'currentQuantity' | 'baseUnit' | 'warehouseId' | 'averageCost'>, initialQuantity: number, initialMovementDetails: InitialMovementDetails | undefined, initialUnit?: Unit) => {
    const baseUnit = getBaseUnitType(item.lastPurchaseUnit);
    const newItem: InventoryItem = { ...item, id: generateId(), warehouseId: data.activeWarehouseId, baseUnit: baseUnit, currentQuantity: 0, averageCost: 0 };
    
    // Using current data state for calculation logic
    let updatedInventory = [...data.inventory, newItem];
    let newMovements = [...data.movements];
    
    if (initialQuantity > 0 && initialUnit) {
      const initialMovement: Omit<Movement, 'id' | 'date' | 'warehouseId'> = { 
        itemId: newItem.id, 
        itemName: newItem.name, 
        type: 'IN', 
        quantity: initialQuantity, 
        unit: initialUnit, 
        calculatedCost: 0, 
        supplierId: initialMovementDetails?.supplierId, 
        supplierName: data.suppliers.find(s => s.id === initialMovementDetails?.supplierId)?.name, 
        invoiceNumber: initialMovementDetails?.invoiceNumber, 
        invoiceImage: initialMovementDetails?.invoiceImage, 
        notes: 'Saldo inicial' 
      };
      
      let adjustedPrice = item.lastPurchasePrice;
      if (initialUnit !== item.lastPurchaseUnit) {
          const pricePerBase = item.lastPurchasePrice / convertToBase(1, item.lastPurchaseUnit);
          adjustedPrice = pricePerBase * convertToBase(1, initialUnit);
      }

      const { updatedInventory: invWithMovement, movementCost } = processInventoryMovement(updatedInventory, initialMovement, adjustedPrice, item.expirationDate);
      updatedInventory = invWithMovement;
      
      const completeMovement: Movement = { 
        ...initialMovement, 
        id: generateId(), 
        warehouseId: data.activeWarehouseId, 
        date: new Date().toISOString(), 
        calculatedCost: movementCost 
      };
      newMovements = [completeMovement, ...newMovements];
    }

    setData(prev => ({ ...prev, inventory: updatedInventory, movements: newMovements }));
    notify('Producto creado correctamente.', 'success');
  }, [data, setData, notify]);

  const addPlannedLabor = useCallback((labor: any) => {
    setData(prev => ({ 
      ...prev, 
      plannedLabors: [...(prev.plannedLabors || []), { ...labor, id: generateId(), warehouseId: data.activeWarehouseId, completed: false }] 
    }));
    notify('Labor programada.', 'success');
  }, [data.activeWarehouseId, setData, notify]);

  const updateCostCenter = useCallback((updatedLot: CostCenter) => {
    setData(prev => ({ 
      ...prev, 
      costCenters: prev.costCenters.map(c => c.id === updatedLot.id ? updatedLot : c) 
    }));
    notify('Lote actualizado.', 'success');
  }, [setData, notify]);

  const saveBudget = useCallback((budget: BudgetPlan) => {
    setData(prev => {
      const exists = prev.budgets?.find(b => b.id === budget.id);
      let newBudgets = prev.budgets || [];
      if (exists) { 
        newBudgets = newBudgets.map(b => b.id === budget.id ? budget : b); 
      } else { 
        newBudgets = [...newBudgets, budget]; 
      }
      return { ...prev, budgets: newBudgets };
    });
    notify('Presupuesto guardado.', 'success');
  }, [setData, notify]);

  // Memoize the return object so it remains stable if dependencies haven't changed
  return useMemo(() => ({
    loadDemoData,
    deleteCostCenter,
    deletePersonnel,
    deleteActivity,
    saveNewItem,
    addPlannedLabor,
    updateCostCenter,
    saveBudget
  }), [loadDemoData, deleteCostCenter, deletePersonnel, deleteActivity, saveNewItem, addPlannedLabor, updateCostCenter, saveBudget]);
};
