
import { AppState } from '../types';
import { formatCurrency } from './inventoryService';

/**
 * Envíos de datos a Google Apps Script
 * IMPORTANTE: El script de Google debe estar desplegado como "Aplicación Web"
 * y con permisos de ejecución "Anyone" (Cualquier usuario) para evitar OAuth complejo.
 */
export const syncToGoogleSheets = async (data: AppState, scriptUrl: string): Promise<{ success: boolean, message: string }> => {
  if (!scriptUrl || !scriptUrl.startsWith('https://script.google.com')) {
    return { success: false, message: 'URL del script inválida. Verifique en Extensiones > Apps Script.' };
  }

  // Preparamos los datos aplanados para que sean fáciles de leer en Sheets
  const payload = {
    // Info General
    syncDate: new Date().toISOString(),
    farmName: data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Finca',
    
    // 1. Inventario (Snapshot Actual)
    inventory: data.inventory.map(i => ({
      Producto: i.name,
      Categoria: i.category,
      Cantidad: i.currentQuantity,
      Unidad: i.baseUnit,
      CostoPromedio: i.averageCost,
      ValorTotal: i.currentQuantity * i.averageCost
    })),

    // 2. Movimientos (Kárdex) - Últimos 100 para no saturar si es masivo
    movements: data.movements.slice(0, 100).map(m => ({
      Fecha: m.date.split('T')[0],
      Tipo: m.type === 'IN' ? 'ENTRADA' : 'SALIDA',
      Item: m.itemName,
      Cantidad: m.quantity,
      CostoTotal: m.calculatedCost,
      Tercero: m.type === 'IN' ? m.supplierName : m.costCenterName
    })),

    // 3. Cosechas (Ventas)
    harvests: data.harvests.map(h => ({
      Fecha: h.date.split('T')[0],
      Lote: h.costCenterName,
      Cultivo: h.cropName,
      Cantidad: h.quantity,
      ValorVenta: h.totalValue
    })),

    // 4. Nómina (Pagos Realizados)
    labor: data.laborLogs.filter(l => l.paid).map(l => ({
      Fecha: l.date.split('T')[0],
      Trabajador: l.personnelName,
      Actividad: l.activityName,
      Lote: l.costCenterName,
      ValorPagado: l.value
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

    return { success: true, message: 'Datos enviados a la nube de Google.' };
  } catch (error) {
    console.error("Error sync sheets:", error);
    return { success: false, message: 'Error de conexión con Google. Verifique internet.' };
  }
};
