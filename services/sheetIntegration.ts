
import { AppState } from '../types';
import { calculateKPIs } from './analyticsService';

// Mock del plugin de red
const Network = {
    addListener: (event: string, callback: (status: any) => void) => {
        window.addEventListener('online', () => callback({ connected: true, connectionType: 'wifi' }));
        return { remove: () => {} };
    }
};

/**
 * Exporta el Tablero Financiero a Google Sheets.
 */
export const exportToGoogleSheets = async (data: AppState) => {
  if (!data.googleSheetsUrl) {
    alert("⚠️ Por favor configure la URL de su Google Script en 'Configuración'.");
    return;
  }

  const kpis = calculateKPIs(data);
  const farmName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Mi Finca';
  
  const reportData = {
    syncType: 'FINANCIAL_DASHBOARD_EXPORT',
    finca: farmName,
    fecha: new Date().toLocaleDateString(),
    ingresos: kpis.totalIncomes,
    egresos: kpis.totalExpenses,
    utilidad: kpis.netProfit,
    costo_por_kg: kpis.costPerKg,
    roi: `${kpis.roi.toFixed(2)}%`
  };

  try {
    const response = await fetch(data.googleSheetsUrl, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify(reportData),
    });

    // Como usamos no-cors no podemos ver el body, pero asumimos exito si no hay catch
    alert("✅ ¡Informe Financiero enviado a la nube! Verifique su Google Spreadsheet.");
  } catch (error) {
    console.error(error);
    alert("❌ Error de conexión. Verifique la URL de su Script.");
  }
};

/**
 * Realiza una sincronización delta inteligente.
 */
export const performAutoSync = async (data: AppState): Promise<void> => {
    if (!data.googleSheetsUrl) return;
    
    const lastSync = localStorage.getItem('last_sync_timestamp') || '1970-01-01T00:00:00.000Z';
    const now = new Date().toISOString();

    const newMovements = data.movements.filter(m => m.date > lastSync);
    const newHarvests = data.harvests.filter(h => h.date > lastSync);
    const newLabor = data.laborLogs.filter(l => l.date > lastSync);

    if (newMovements.length === 0 && newHarvests.length === 0 && newLabor.length === 0) return;

    try {
        const payload = {
            syncType: 'AUTO_DELTA',
            syncDate: now,
            movements: newMovements,
            harvests: newHarvests,
            labor: newLabor,
            rawBackup: data 
        };

        await fetch(data.googleSheetsUrl, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(payload)
        });

        localStorage.setItem('last_sync_timestamp', now);
    } catch (e) {
        console.error("Fallo Auto-Sync:", e);
    }
};

/**
 * Perform manual synchronization to Google Sheets / Drive.
 */
export const syncToGoogleSheets = async (data: any, url: string): Promise<{ success: boolean; message: string }> => {
    try {
        const body = data.syncType ? data : {
            syncType: 'MANUAL_FULL',
            data: data
        };

        await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(body)
        });
        return { success: true, message: 'Solicitud de respaldo enviada a la nube.' };
    } catch (e) {
        return { success: false, message: "Error de red: " + String(e) };
    }
};

export const initAutoSyncListener = (data: AppState) => {
    Network.addListener('networkStatusChange', (status) => {
        if (status.connected && (status.connectionType === 'wifi' || status.connectionType === '4g')) {
            performAutoSync(data);
        }
    });
};
