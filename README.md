
# DatosFinca Viva - AgroBodega Pro

ERP Agrícola Integral diseñado para la gestión eficiente de fincas, cultivos, nómina y costos de producción bajo un paradigma "Local-First".

## Características Principales

*   **Gestión de Inventario:** Control de insumos (químicos, herramientas) con cálculo de Costo Promedio Ponderado (CPP).
*   **Gestión de Lotes:** Administración de centros de costos, análisis de densidad de siembra y ciclo de vida (Levante/Producción).
*   **Nómina Agrícola:** Registro de jornales, labores y liquidación con factor prestacional configurable.
*   **Inteligencia de Negocio:** Reportes financieros, análisis de costos de producción, alertas de rentabilidad y simulador de proyectos (VPN/TIR).
*   **Offline First:** Funciona sin conexión a internet, sincronizando datos localmente en el dispositivo.

## Tecnologías

*   React 19
*   TypeScript
*   Vite
*   Tailwind CSS
*   IndexedDB (idb)
*   Capacitor (para despliegue móvil)

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
1.  Realizar **Backup JSON** semanalmente.
2.  Utilizar la función de **Exportación SQL** para auditorías anuales.
3.  Purgar o archivar datos de años fiscales cerrados si nota degradación en la velocidad de apertura de la App.
