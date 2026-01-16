
import { Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import { AppState, InventoryItem, Movement, Unit, PlannedLabor, CostCenter, BudgetPlan, InitialMovementDetails, AuditLog } from '../types';
import { processInventoryMovement, generateId, getBaseUnitType, convertToBase } from '../services/inventoryService';

export const useAppActions = (
  data: AppState,
  setData: Dispatch<SetStateAction<AppState>>,
  notify: (msg: string, type: 'success' | 'error') => void
) => {

  // Helper para generar logs de auditoría de forma silenciosa
  const logAudit = useCallback((action: AuditLog['action'], entity: AuditLog['entity'], entityId: string, details: string, prev?: any, next?: any) => {
    const newLog: AuditLog = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      userId: 'admin_local',
      action,
      entity,
      entityId,
      details,
      previousData: prev ? JSON.stringify(prev) : undefined,
      newData: next ? JSON.stringify(next) : undefined
    };
    setData(prev => ({ ...prev, auditLogs: [newLog, ...(prev.auditLogs || []).slice(0, 1000)] }));
  }, [setData]);

  const deleteCostCenter = useCallback((id: string) => {
    const lotToDelete = data.costCenters.find(c => c.id === id);
    if (!confirm(`¿Eliminar lote ${lotToDelete?.name}?`)) return;

    setData(prev => ({
      ...prev,
      costCenters: prev.costCenters.filter(c => c.id !== id)
    }));
    logAudit('DELETE', 'lot', id, `Eliminación de lote: ${lotToDelete?.name}`, lotToDelete);
    notify('Lote eliminado.', 'success');
  }, [data, setData, notify, logAudit]);

  const saveNewItem = useCallback((item: Omit<InventoryItem, 'id' | 'currentQuantity' | 'baseUnit' | 'warehouseId' | 'averageCost'>, initialQuantity: number, initialMovementDetails?: InitialMovementDetails, initialUnit?: Unit) => {
    const baseUnitType = getBaseUnitType(item.lastPurchaseUnit);
    const newProductId = generateId();

    let initialCurrentQuantity = 0;
    let initialAverageCost = 0;
    let initialMovement: Movement | undefined;

    if (initialQuantity > 0 && item.lastPurchasePrice !== undefined && initialUnit) {
      // Convert initial quantity to base units
      initialCurrentQuantity = convertToBase(initialQuantity, initialUnit);
      
      // Calculate initial average cost (cost per base unit)
      const costPerBaseUnit = item.lastPurchasePrice / convertToBase(1, item.lastPurchaseUnit);
      initialAverageCost = costPerBaseUnit;

      // Create an initial 'IN' movement for historical tracking
      initialMovement = {
        id: generateId(),
        warehouseId: data.activeWarehouseId,
        itemId: newProductId,
        itemName: item.name,
        type: 'IN',
        quantity: initialQuantity,
        unit: initialUnit,
        // The calculatedCost for this initial movement is the total value of this first purchase
        calculatedCost: initialQuantity * item.lastPurchasePrice, // Assuming item.lastPurchasePrice is per initialUnit
        date: new Date().toISOString(),
        notes: `Entrada inicial al sistema.`,
        invoiceNumber: initialMovementDetails?.invoiceNumber,
        invoiceImage: initialMovementDetails?.invoiceImage,
        supplierId: initialMovementDetails?.supplierId,
        supplierName: initialMovementDetails?.supplierId ? data.suppliers.find(s => s.id === initialMovementDetails.supplierId)?.name : undefined,
        paymentDueDate: initialMovementDetails?.paymentDueDate,
        paymentStatus: 'PAID', // Initial stock is assumed paid
        syncStatus: 'pending_sync'
      };
    }

    const newItem: InventoryItem = {
      ...item,
      id: newProductId,
      warehouseId: data.activeWarehouseId,
      baseUnit: baseUnitType,
      currentQuantity: initialCurrentQuantity, // Set to calculated initial quantity
      averageCost: initialAverageCost, // Set to calculated initial cost
      syncStatus: 'pending_sync'
    };
    
    setData(prev => ({
      ...prev,
      inventory: [...prev.inventory, newItem],
      movements: initialMovement ? [...prev.movements, initialMovement] : prev.movements
    }));

    logAudit('CREATE', 'inventory', newProductId, `Creación de producto: ${item.name}`, null, newItem);
    notify('Producto creado y stock inicial registrado.', 'success');
  }, [data, setData, notify, logAudit]);

  const addPlannedLabor = useCallback((labor: Omit<PlannedLabor, 'id' | 'warehouseId' | 'completed'>) => {
    const newLabor: PlannedLabor = {
      ...labor,
      id: generateId(),
      warehouseId: data.activeWarehouseId,
      completed: false,
      syncStatus: 'pending_sync'
    };
    setData(prev => ({ ...prev, plannedLabors: [...prev.plannedLabors, newLabor] }));
    logAudit('CREATE', 'labor', newLabor.id, `Programación de labor: ${labor.activityName} en ${labor.costCenterName}`, null, newLabor);
    notify('Labor programada.', 'success');
  }, [data, setData, notify, logAudit]);

  const deletePersonnel = useCallback((id: string) => {
    const personToDelete = data.personnel.find(p => p.id === id);
    if (!confirm(`¿Eliminar personal ${personToDelete?.name}? Esta acción es irreversible.`)) return;
    setData(prev => ({
      ...prev,
      personnel: prev.personnel.filter(p => p.id !== id)
    }));
    logAudit('DELETE', 'labor', id, `Eliminación de personal: ${personToDelete?.name}`, personToDelete);
    notify('Personal eliminado.', 'success');
  }, [data, setData, notify, logAudit]);

  const deleteActivity = useCallback((id: string) => {
    const activityToDelete = data.activities.find(a => a.id === id);
    if (!confirm(`¿Eliminar actividad ${activityToDelete?.name}? Esto afectará labores programadas.`)) return;
    setData(prev => ({
      ...prev,
      activities: prev.activities.filter(a => a.id !== id)
    }));
    logAudit('DELETE', 'labor', id, `Eliminación de actividad: ${activityToDelete?.name}`, activityToDelete);
    notify('Actividad eliminada.', 'success');
  }, [data, setData, notify, logAudit]);

  const updateCostCenter = useCallback((lot: CostCenter) => {
    const prevLot = data.costCenters.find(c => c.id === lot.id);
    setData(prev => ({
      ...prev,
      costCenters: prev.costCenters.map(c => c.id === lot.id ? lot : c)
    }));
    logAudit('UPDATE', 'lot', lot.id, `Actualización de lote: ${lot.name}`, prevLot, lot);
    notify('Lote actualizado.', 'success');
  }, [data, setData, notify, logAudit]);

  const saveBudget = useCallback((budget: BudgetPlan) => {
    setData(prev => {
      const exists = prev.budgets?.find(b => b.id === budget.id);
      if (exists) {
          logAudit('UPDATE', 'finance', budget.id, `Actualización de presupuesto: año ${budget.year} lote ${data.costCenters.find(c=>c.id === budget.costCenterId)?.name}`, exists, budget);
          return { ...prev, budgets: prev.budgets.map(b => b.id === budget.id ? budget : b) };
      }
      logAudit('CREATE', 'finance', budget.id, `Creación de presupuesto: año ${budget.year} lote ${data.costCenters.find(c=>c.id === budget.costCenterId)?.name}`, null, budget);
      return { ...prev, budgets: [...(prev.budgets || []), budget] };
    });
    notify('Presupuesto guardado.', 'success');
  }, [setData, notify, logAudit]);

  return useMemo(() => ({
    deleteCostCenter,
    deletePersonnel,
    deleteActivity,
    saveNewItem,
    addPlannedLabor,
    updateCostCenter,
    saveBudget,
  }), [deleteCostCenter, deletePersonnel, deleteActivity, saveNewItem, addPlannedLabor, updateCostCenter, saveBudget]);
};
