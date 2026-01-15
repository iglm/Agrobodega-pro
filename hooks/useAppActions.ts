
import { Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import { AppState, InventoryItem, Movement, Unit, PlannedLabor, CostCenter, BudgetPlan, InitialMovementDetails, ContractType } from '../types';
import { processInventoryMovement, generateId, getBaseUnitType, convertToBase, createAuditLog } from '../services/inventoryService';

export const useAppActions = (
  data: AppState,
  setData: Dispatch<SetStateAction<AppState>>,
  notify: (msg: string, type: 'success' | 'error') => void
) => {

  const deleteCostCenter = useCallback((id: string) => {
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
      const message = `⚠️ ALERTA DE INTEGRIDAD:\n\nEste lote tiene ${totalDeps} registros vinculados. ¿Confirma la eliminación?`;
      if (!confirm(message)) return;
    } else {
      if (!confirm("¿Está seguro de eliminar este Lote?")) return;
    }

    const lotToDelete = data.costCenters.find(c => c.id === id);
    const auditLog = createAuditLog('local_user', 'DELETE', 'CostCenter', id, { name: lotToDelete?.name }, lotToDelete);

    setData(prev => ({
      ...prev,
      auditLogs: [...prev.auditLogs, auditLog],
      costCenters: prev.costCenters.filter(c => c.id !== id),
      laborLogs: prev.laborLogs.map(l => l.costCenterId === id ? { ...l, costCenterId: 'deleted', costCenterName: `${l.costCenterName} (Eliminado)`, lastModified: new Date().toISOString() } : l),
      harvests: prev.harvests.map(h => h.costCenterId === id ? { ...h, costCenterId: 'deleted', costCenterName: `${h.costCenterName} (Eliminado)`, lastModified: new Date().toISOString() } : h),
      movements: prev.movements.map(m => m.costCenterId === id ? { ...m, costCenterId: undefined, costCenterName: `${m.costCenterName} (Eliminado)`, lastModified: new Date().toISOString() } : m),
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
      if (!confirm(`Este trabajador tiene ${historyCount} registros históricos. ¿Proceder?`)) return;
    } else {
      if (!confirm("¿Eliminar trabajador?")) return;
    }

    const personToDelete = data.personnel.find(p => p.id === id);
    const auditLog = createAuditLog('local_user', 'DELETE', 'Personnel', id, { name: personToDelete?.name }, personToDelete);

    setData(prev => ({
      ...prev,
      auditLogs: [...prev.auditLogs, auditLog],
      personnel: prev.personnel.filter(p => p.id !== id),
      laborLogs: prev.laborLogs.map(l => l.personnelId === id ? { ...l, personnelId: 'deleted', personnelName: `${l.personnelName} (Retirado)`, lastModified: new Date().toISOString() } : l),
      movements: prev.movements.map(m => m.personnelId === id ? { ...m, personnelId: undefined, personnelName: `${m.personnelName} (Retirado)`, lastModified: new Date().toISOString() } : m),
      plannedLabors: (prev.plannedLabors || []).map(p => p.assignedPersonnelIds?.includes(id) ? { ...p, assignedPersonnelIds: p.assignedPersonnelIds.filter(pid => pid !== id), lastModified: new Date().toISOString() } : p)
    }));
    notify('Trabajador retirado correctamente.', 'success');
  }, [data, setData, notify]);

  const deleteActivity = useCallback((id: string) => {
    const usage = data.laborLogs.filter(l => l.activityId === id).length;
    if (usage > 0) {
      if (!confirm(`Esta labor se usa en ${usage} registros. ¿Proceder?`)) return;
    } else {
      if (!confirm("¿Eliminar labor?")) return;
    }

    const activityToDelete = data.activities.find(a => a.id === id);
    const auditLog = createAuditLog('local_user', 'DELETE', 'Activity', id, { name: activityToDelete?.name }, activityToDelete);

    setData(prev => ({
      ...prev,
      auditLogs: [...prev.auditLogs, auditLog],
      activities: prev.activities.filter(a => a.id !== id),
      laborLogs: prev.laborLogs.map(l => l.activityId === id ? { ...l, activityId: 'deleted', activityName: `${l.activityName} (Obsolescente)`, lastModified: new Date().toISOString() } : l),
      plannedLabors: (prev.plannedLabors || []).filter(p => p.activityId !== id)
    }));
    notify('Labor eliminada del catálogo.', 'success');
  }, [data, setData, notify]);

  const saveNewItem = useCallback((item: Omit<InventoryItem, 'id' | 'currentQuantity' | 'baseUnit' | 'warehouseId' | 'averageCost'>, initialQuantity: number, initialMovementDetails: InitialMovementDetails | undefined, initialUnit?: Unit) => {
    const baseUnit = getBaseUnitType(item.lastPurchaseUnit);
    const now = new Date().toISOString();
    const newItem: InventoryItem = { 
        ...item, 
        id: generateId(), 
        warehouseId: data.activeWarehouseId, 
        baseUnit: baseUnit, 
        currentQuantity: 0, 
        averageCost: 0,
        lastModified: now
    };
    
    // Create Audit for Item Creation
    const itemLog = createAuditLog('local_user', 'CREATE', 'InventoryItem', newItem.id, { name: newItem.name });
    
    let updatedInventory = [...data.inventory, newItem];
    let newMovements = [...data.movements];
    let movementLog;
    
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
        date: now, 
        calculatedCost: movementCost,
        lastModified: now
      };
      newMovements = [completeMovement, ...newMovements];
      movementLog = createAuditLog('local_user', 'CREATE', 'Movement', completeMovement.id, { type: 'IN', itemId: newItem.id, qty: initialQuantity });
    }

    const newLogs = movementLog ? [...data.auditLogs, itemLog, movementLog] : [...data.auditLogs, itemLog];

    setData(prev => ({ ...prev, inventory: updatedInventory, movements: newMovements, auditLogs: newLogs }));
    notify('Producto creado correctamente.', 'success');
  }, [data, setData, notify]);

  const addPlannedLabor = useCallback((labor: any) => {
    const id = generateId();
    const now = new Date().toISOString();
    const newPlan = { ...labor, id, warehouseId: data.activeWarehouseId, completed: false, lastModified: now };
    const auditLog = createAuditLog('local_user', 'CREATE', 'PlannedLabor', id, { activity: labor.activityName });

    setData(prev => ({ 
      ...prev, 
      plannedLabors: [...(prev.plannedLabors || []), newPlan],
      auditLogs: [...prev.auditLogs, auditLog]
    }));
    notify('Labor programada.', 'success');
  }, [data.activeWarehouseId, setData, notify]);

  const updateCostCenter = useCallback((updatedLot: CostCenter) => {
    const prevLot = data.costCenters.find(c => c.id === updatedLot.id);
    const now = new Date().toISOString();
    const lotToSave = { ...updatedLot, lastModified: now };
    const auditLog = createAuditLog('local_user', 'UPDATE', 'CostCenter', updatedLot.id, lotToSave, prevLot);

    setData(prev => ({ 
      ...prev, 
      costCenters: prev.costCenters.map(c => c.id === updatedLot.id ? lotToSave : c),
      auditLogs: [...prev.auditLogs, auditLog]
    }));
    notify('Lote actualizado.', 'success');
  }, [data, setData, notify]);

  const saveBudget = useCallback((budget: BudgetPlan) => {
    const now = new Date().toISOString();
    const budgetToSave = { ...budget, lastModified: now };
    
    setData(prev => {
      const exists = prev.budgets?.find(b => b.id === budget.id);
      let newBudgets = prev.budgets || [];
      let auditLog;

      if (exists) { 
        newBudgets = newBudgets.map(b => b.id === budget.id ? budgetToSave : b); 
        auditLog = createAuditLog('local_user', 'UPDATE', 'BudgetPlan', budget.id, budgetToSave, exists);
      } else { 
        newBudgets = [...newBudgets, budgetToSave]; 
        auditLog = createAuditLog('local_user', 'CREATE', 'BudgetPlan', budget.id, budgetToSave);
      }
      return { ...prev, budgets: newBudgets, auditLogs: [...prev.auditLogs, auditLog] };
    });
    notify('Presupuesto guardado.', 'success');
  }, [setData, notify]);

  return useMemo(() => ({
    deleteCostCenter,
    deletePersonnel,
    deleteActivity,
    saveNewItem,
    addPlannedLabor,
    updateCostCenter,
    saveBudget
  }), [deleteCostCenter, deletePersonnel, deleteActivity, saveNewItem, addPlannedLabor, updateCostCenter, saveBudget]);
};
