
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { AppState } from '../types';
import { loadDataFromLocalStorage, generateId, STORAGE_KEY } from './inventoryService';

const DB_NAME = 'DatosFincaVivaDB';
const DB_VERSION = 1;
const STORE_NAME = 'appState';
const KEY = 'root';
const MIGRATION_FLAG = 'MIGRATION_COMPLETED';

interface FincaDB extends DBSchema {
  [STORE_NAME]: {
    key: string;
    value: AppState;
  };
}

let dbPromise: Promise<IDBPDatabase<FincaDB>> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<FincaDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
      blocked(currentVersion, blockedVersion, event) {
          console.warn("DB blocked", currentVersion, blockedVersion);
      },
      blocking(currentVersion, blockedVersion, event) {
          console.warn("DB blocking", currentVersion, blockedVersion);
      },
      terminated() {
          console.error("DB terminated unexpectedly");
          dbPromise = null;
      },
    });
  }
  return dbPromise;
};

// Generador de estado limpio seguro para casos de corrupción/zombie
const getCleanState = (): AppState => {
    const id = generateId();
    return {
        warehouses: [{ id, name: 'Finca Recuperada', created: new Date().toISOString(), ownerId: 'local_user' }],
        activeWarehouseId: id,
        inventory: [], movements: [], suppliers: [], costCenters: [], personnel: [], activities: [], 
        laborLogs: [], harvests: [], machines: [], maintenanceLogs: [], rainLogs: [], financeLogs: [], 
        soilAnalyses: [], ppeLogs: [], wasteLogs: [], agenda: [], phenologyLogs: [], pestLogs: [], 
        plannedLabors: [], budgets: [], assets: [], bpaChecklist: {}, laborFactor: 1.0,
        clients: [], salesContracts: [], sales: []
    };
};

export const dbService = {
  
  saveState: async (state: AppState): Promise<void> => {
    try {
      const db = await getDB();
      await db.put(STORE_NAME, state, KEY);
    } catch (error) {
      console.error("Error crítico guardando en IDB:", error);
      // Fallback: Solo guardamos en LS si NO hemos migrado completamente o como último recurso de emergencia
      // usando la MISMA clave que el loader para evitar inconsistencia.
      try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (lsError) {
          console.error("Fallo total de guardado", lsError);
      }
    }
  },

  loadState: async (): Promise<AppState> => {
    // 1. Verificación de Integridad
    const hasMigrated = localStorage.getItem(MIGRATION_FLAG) === 'true';
    let db;

    try {
      db = await getDB();
      const data = await db.get(STORE_NAME, KEY);

      if (data) {
        // Integridad confirmada: IDB tiene datos. Aseguramos la marca.
        if (!hasMigrated) localStorage.setItem(MIGRATION_FLAG, 'true');
        return data;
      }
    } catch (error) {
      console.error("Error crítico leyendo IndexedDB:", error);
      // SEGURIDAD DE DATOS: Si hubo un error de lectura (ej: cuota excedida o bloqueo),
      // lanzamos error para que la UI lo maneje, a menos que intentemos rescate abajo.
      if (hasMigrated) {
          // Intentamos continuar para ver si el fallback de emergencia funciona
          console.warn("Intentando recuperación de emergencia tras fallo de lectura IDB...");
      }
    }

    // 2. Lógica Anti-Zombie y Recuperación de Emergencia
    // Si llegamos aquí, data es undefined (DB vacía) O falló la lectura.
    if (hasMigrated) {
        console.warn("ALERTA DE INTEGRIDAD: IndexedDB vacío o inaccesible pero migración marcada.");

        // A) Intentar rescate desde LocalStorage (Última línea de defensa)
        const rawLegacyData = localStorage.getItem(STORAGE_KEY);
        
        if (rawLegacyData) {
            console.warn("RECUPERACIÓN DE EMERGENCIA EXITOSA: Datos encontrados en LocalStorage. Re-hidratando base de datos...");
            try {
                const recoveredState = loadDataFromLocalStorage();
                
                // Re-hidratar IDB para corregir la inconsistencia futura
                if (db) {
                    await db.put(STORE_NAME, recoveredState, KEY);
                    console.log("✅ Base de datos re-sincronizada correctamente.");
                }
                
                return recoveredState;
            } catch (recoveryError) {
                console.error("Fallo al procesar datos de recuperación:", recoveryError);
            }
        }

        // B) Pérdida Total confirmada: Ni IDB ni LocalStorage tienen datos válidos.
        console.error("PÉRDIDA DE DATOS: Se procede a iniciar estado limpio.");
        return getCleanState();
    }

    // 3. Puente de Migración (Solo corre si nunca se ha migrado)
    console.log("⚠️ Inicializando migración a IndexedDB...");
    try {
        const legacyData = loadDataFromLocalStorage();
        if (db) {
            await db.put(STORE_NAME, legacyData, KEY);
            localStorage.setItem(MIGRATION_FLAG, 'true');
            console.log("✅ Migración completada exitosamente.");
        }
        return legacyData;
    } catch (migrationError) {
        console.error("Fallo en migración:", migrationError);
        return loadDataFromLocalStorage(); // Último recurso
    }
  },

  clearDatabase: async (): Promise<void> => {
      try {
        const db = await getDB();
        await db.clear(STORE_NAME);
        localStorage.removeItem(MIGRATION_FLAG); // Permitir nueva migración si se borra explícitamente
      } catch (e) {
          console.error("Error clearing DB", e);
      }
  }
};
