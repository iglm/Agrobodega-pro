
import { AppState } from '../types';
import { formatCurrency } from './inventoryService';

/**
 * Envíos de datos a Google Apps Script
 * IMPORTANTE: El script de Google debe estar desplegado como "Aplicación Web"
 * y con permisos de ejecución "Anyone" (Cualquier usuario) para evitar OAuth complejo.
 */
export const syncToGoogleSheets = async (data: AppState, scriptUrl: string): Promise<{ success: boolean, message: string }> => {
  if (!scriptUrl || !scriptUrl.startsWith('https://script.google.com')) {
    return { success: false, message: 'URL del script inválida. Verifique en Configuración > Sincronización.' };
  }

  // Preparamos los datos aplanados para que sean fáciles de leer en Sheets
  // Y añadimos 'rawBackup' para que el script cree el archivo JSON en Drive
  const payload = {
    // Info General
    syncDate: new Date().toISOString(),
    farmName: data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Finca',
    
    // DATA CRUDA PARA RESTAURACIÓN (BACKUP DRIVE)
    rawBackup: data,

    // 1. Inventario (Snapshot Actual - Para Sheet Visual)
    inventory: data.inventory.map(i => ({
      Producto: i.name,
      Categoria: i.category,
      Cantidad: i.currentQuantity,
      Unidad: i.baseUnit,
      CostoPromedio: i.averageCost,
      ValorTotal: i.currentQuantity * i.averageCost,
      UltimaModif: i.lastModified || ''
    })),

    // 2. Movimientos (Kárdex) - Últimos 500 para reporte
    movements: data.movements.slice(0, 500).map(m => ({
      Fecha: m.date.split('T')[0],
      Tipo: m.type === 'IN' ? 'ENTRADA' : 'SALIDA',
      Item: m.itemName,
      Cantidad: m.quantity,
      CostoTotal: m.calculatedCost,
      Tercero: m.type === 'IN' ? m.supplierName : m.costCenterName,
      ID: m.id
    })),

    // 3. Cosechas (Ventas)
    harvests: data.harvests.map(h => ({
      Fecha: h.date.split('T')[0],
      Lote: h.costCenterName,
      Cultivo: h.cropName,
      Cantidad: h.quantity,
      ValorVenta: h.totalValue,
      UltimaModif: h.lastModified || ''
    })),

    // 4. Nómina (Pagos Realizados)
    labor: data.laborLogs.filter(l => l.paid).map(l => ({
      Fecha: l.date.split('T')[0],
      Trabajador: l.personnelName,
      Actividad: l.activityName,
      Lote: l.costCenterName,
      ValorPagado: l.value,
      UltimaModif: l.lastModified || ''
    })),

    // 5. AUDIT LOG (Conflict Resolution Source of Truth)
    // Enviamos los últimos 200 cambios para que la hoja de cálculo tenga trazabilidad
    // En caso de conflicto de datos, este log permite "rebobinar" (Time Travel) en el análisis
    audit: data.auditLogs.slice(-200).map(log => ({
      Timestamp: log.timestamp,
      Usuario: log.userId,
      Accion: log.action,
      Entidad: log.entity,
      ID_Ref: log.entityId,
      Detalle: log.details.substring(0, 1000) // Truncate for safety
    }))
  };

  try {
    // Usamos 'no-cors' porque Apps Script no soporta CORS standard fácilmente en POST
    // Esto significa que no recibiremos un JSON de respuesta legible, pero el envío se realizará.
    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    return { success: true, message: 'Datos enviados a Google Drive y Sheets.' };
  } catch (error) {
    console.error("Error sync sheets:", error);
    return { success: false, message: 'Error de conexión con Google. Verifique internet.' };
  }
};
