
import { db } from './db';

// En producción, Vite inyectará la URL de Cloud Run.
// En desarrollo usa el fallback de localhost.
// Fix: Cast import.meta to any to bypass TypeScript error for Vite-injected env property
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api/v1';

export const syncService = {
  
  async syncWithCloud(): Promise<void> {
    if (!navigator.onLine) {
      console.log("[Sync] Offline. Sincronización suspendida.");
      return;
    }

    const entities = [
      { name: 'inventory', table: db.inventory },
      { name: 'lots', table: db.lots },
      { name: 'labor', table: db.labor },
      { name: 'finance', table: db.finance },
      { name: 'sanitary', table: db.sanitary }
    ];

    console.log("[Sync] Iniciando ciclo cloud...");

    for (const entity of entities) {
      try {
        const pendingRecords = await entity.table
          .where('syncStatus')
          .anyOf('pending_create', 'pending_update')
          .toArray();

        if (pendingRecords.length > 0) {
          await this.uploadBatch(entity.name, pendingRecords);
        }
      } catch (error) {
        console.error(`[Sync Error] ${entity.name}:`, error);
      }
    }
  },

  async uploadBatch(entityName: string, records: any[]): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/${entityName}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('AUTH_TOKEN') || 'default'}`
        },
        body: JSON.stringify(records)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.synced) {
          for (const item of result.synced) {
            await (db as any)[entityName].update(item.id, {
              serverId: item.serverId,
              syncStatus: 'synced',
              lastUpdated: item.lastUpdated 
            });
          }
        }
      }
    } catch (error) {
      console.error(`[Sync Fetch Error] ${entityName}:`, error);
    }
  },

  initAutoSync() {
    window.addEventListener('online', () => this.syncWithCloud());
    setInterval(() => this.syncWithCloud(), 300000); // 5 min
    this.syncWithCloud();
  }
};
