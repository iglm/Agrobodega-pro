
# DatosFinca Viva - AgroBodega Pro

ERP Agrícola Integral diseñado para la gestión eficiente de fincas, cultivos, nómina y costos de producción bajo un paradigma "Local-First" con capacidades de **Nube Híbrida**.

## Características Principales

*   **Gestión de Inventario:** Control de insumos (químicos, herramientas) con cálculo de Costo Promedio Ponderado (CPP).
*   **Gestión de Lotes:** Administración de centros de costos, análisis de densidad de siembra y ciclo de vida (Levante/Producción).
*   **Nómina Agrícola:** Registro de jornales, labores y liquidación con factor prestacional configurable.
*   **Inteligencia de Negocio:** Reportes financieros, análisis de costos de producción, alertas de rentabilidad y simulador de proyectos (VPN/TIR).
*   **Auditoría y Trazabilidad:** Sistema de logs inmutables (`AuditLog`), control de versiones (`lastModified`) y herramienta de **Conteo Ciego** para verificaciones físicas de bodega.
*   **Offline First & Cloud Sync:** Funciona 100% sin internet, pero permite sincronizar copias de seguridad (JSON) y reportes planos a **Google Drive y Sheets** para recuperación de desastres y resolución de conflictos ("Time Travel").

## Tecnologías

*   React 19
*   TypeScript
*   Vite
*   Tailwind CSS
*   IndexedDB (idb)
*   Capacitor (para despliegue móvil)
*   Google Apps Script (Integración Nube)

## ⚙️ Ficha Técnica de Rendimiento (SLA)

Debido a la arquitectura "Local-First" (procesamiento en el borde sin servidor central), la aplicación utiliza los recursos de hardware del dispositivo móvil (RAM y Almacenamiento).

A continuación se presentan los límites operativos recomendados para garantizar una experiencia fluida (60 FPS) y evitar cierres inesperados por saturación de memoria:

| Recurso Operativo | Capacidad Óptima (Fluido) | Límite Máximo (Tolerable) |
| :--- | :--- | :--- |
| **Fincas (Sedes)** | 1 por Dispositivo | 3 Fincas |
| **Lotes / Bloques** | 20 - 50 Lotes | 100 Lotes |
| **Trabajadores** | 10 - 50 Personas | 100 Personas |
| **Historial (Logs)** | Últimos 12 Meses | ~20,000 Registros |

> *Nota técnica: Para operaciones agroindustriales mayores (ej: >150 fincas o >500 trabajadores), se requiere una arquitectura distribuida (una instalación de la App por cada Administrador de Zona).*

### Recomendaciones de Mantenimiento
1.  Realizar **Sincronización Nube** (Botón Cloud) al finalizar la semana.
2.  Descargar **Backup JSON** local periódicamente si no hay internet.
3.  Utilizar el módulo de **Auditoría** mensual para corregir diferencias de inventario.
4.  Purgar o archivar datos de años fiscales cerrados si nota degradación en la velocidad de apertura de la App.
