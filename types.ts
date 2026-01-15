
export enum Category {
  FERTILIZANTE = 'Fertilizante',
  INSECTICIDA = 'Insecticida',
  FUNGICIDA = 'Fungicida',
  HERBICIDA = 'Herbicida',
  BIOESTIMULANTE = 'Bioestimulante',
  DESINFECTANTE = 'Desinfectante',
  BIOABONO = 'Bioabono',
  OTRO = 'Otro'
}

export enum Unit {
  BULTO_50KG = 'Bulto 50kg',
  KILO = 'Kilo',
  GRAMO = 'Gramo',
  LITRO = 'Litro',
  MILILITRO = 'Mililitro',
  GALON = 'Galón',
  UNIDAD = 'Unidad'
}

export type ContractType = 'FIJO' | 'INDEFINIDO' | 'OBRA_LABOR' | 'APRENDIZAJE' | 'PRESTACION_SERVICIOS' | 'OCASIONAL';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface AgendaEvent {
  id: string;
  warehouseId: string;
  date: string;
  title: string;
  completed: boolean;
}

export interface SWOT {
  f: string;
  o: string;
  d: string;
  a: string;
}

export interface BpaCriterion {
  id:string;
  standard: 'ICA' | 'GLOBALGAP' | 'CODE_4C';
  category: string;
  code: string;
  label: string;
  complianceLevel: 'MAJOR' | 'MINOR' | 'REC';
  compliant: boolean;
  na?: boolean;
}

export interface Asset {
  id: string;
  warehouseId: string;
  name: string;
  purchasePrice: number;
  lifespanYears: number;
  purchaseDate: string;
  category: 'MAQUINARIA' | 'HERRAMIENTA' | 'INFRAESTRUCTURA';
}

export interface PhenologyLog {
  id: string;
  warehouseId: string;
  costCenterId: string;
  date: string;
  stage: 'Dormancia' | 'Brote' | 'Floración' | 'Cuajado' | 'Llenado' | 'Maduración';
  notes?: string;
}

export interface PestLog {
  id: string;
  warehouseId: string;
  costCenterId: string;
  date: string;
  pestOrDisease: string;
  incidence: 'Baja' | 'Media' | 'Alta';
  notes?: string;
}

export interface PlannedLabor {
  id: string;
  warehouseId: string;
  activityId: string;
  activityName: string;
  costCenterId: string;
  costCenterName: string;
  date: string;
  targetArea: number;
  technicalYield: number; // Ha/Jornal
  unitCost: number;
  efficiency: number;
  calculatedPersonDays: number;
  calculatedHours?: number;
  calculatedTotalCost: number;
  completed: boolean;
  notes?: string;
  assignedPersonnelIds?: string[]; // Personal asignado a la labor futura
}

export interface BudgetItem {
  id: string;
  conceptId: string;
  conceptName: string;
  type: 'LABOR' | 'SUPPLY';
  unitCost: number;
  quantityPerHa: number;
  months: number[];
}

export interface BudgetPlan {
  id: string;
  warehouseId: string;
  year: number;
  costCenterId: string;
  items: BudgetItem[];
}

// --- COMMERCIAL MODULE INTERFACES ---

export interface Client {
  id: string;
  warehouseId: string;
  name: string; // Ej: Cooperativa de Caficultores
  type: 'COOPERATIVA' | 'EXPORTADOR' | 'CLIENTE_FINAL' | 'INTERMEDIARIO';
  taxId?: string; // NIT / CC
  email?: string;
  phone?: string;
  address?: string;
}

export interface SalesContract {
  id: string;
  warehouseId: string;
  clientId: string;
  clientName: string;
  date: string;
  contractNumber: string;
  quantityAgreed: number; // Ej: 1000 kg
  unit: string; // Kg, Carga, Arroba
  pricePerUnit: number; // Precio fijado
  status: 'OPEN' | 'FULFILLED' | 'CANCELLED';
  expirationDate: string;
  fulfilledQuantity: number;
  notes?: string;
}

export interface SaleItem {
  cropName: string; // Café, Plátano
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
  quality?: string; // Factor de rendimiento, % Broca, o Calidad (1ra/2da)
}

export interface Sale {
  id: string;
  warehouseId: string;
  date: string;
  clientId: string;
  clientName: string;
  contractId?: string; // Opcional, si pertenece a un contrato fijo
  contractNumber?: string;
  items: SaleItem[];
  totalValue: number;
  paymentStatus: 'PENDING' | 'PAID'; // Para Cuentas por Cobrar
  paymentDate?: string; // Fecha real de pago
  invoiceNumber?: string;
  notes?: string;
}

// ------------------------------------

export interface AppState {
  warehouses: Warehouse[];
  activeWarehouseId: string;
  inventory: InventoryItem[];
  movements: Movement[];
  suppliers: Supplier[];
  costCenters: CostCenter[];
  personnel: Personnel[]; 
  activities: Activity[]; 
  laborLogs: LaborLog[]; 
  harvests: HarvestLog[];
  machines: Machine[];
  maintenanceLogs: MaintenanceLog[];
  rainLogs: RainLog[];
  financeLogs: FinanceLog[]; 
  soilAnalyses: SoilAnalysis[];
  ppeLogs: PPELog[];
  wasteLogs: WasteLog[];
  agenda: AgendaEvent[];
  phenologyLogs: PhenologyLog[];
  pestLogs: PestLog[];
  plannedLabors: PlannedLabor[]; 
  budgets: BudgetPlan[];
  swot?: SWOT;
  bpaChecklist: Record<string, boolean>;
  assets: Asset[];
  laborFactor: number; 
  /** @deprecated Security PIN logic removed for better UX */
  adminPin?: string; 
  
  // Integration
  googleSheetsUrl?: string;

  // Commercial State
  clients: Client[];
  salesContracts: SalesContract[];
  sales: Sale[];
}

export interface Warehouse { 
  id: string; 
  name: string; 
  created: string; 
  ownerId: string;
  sharedWith?: { userId: string; email: string; role: 'viewer' | 'editor' }[];
}

export interface CostCenter { 
  id: string; 
  warehouseId: string; 
  name: string; 
  area: number; 
  productionArea?: number;
  stage: 'Produccion' | 'Levante' | 'Infraestructura'; 
  cropType: string;
  associatedCrop?: string;
  budget?: number;
  coordinates?: { lat: number; lng: number };
  plantCount?: number;
  accumulatedCapex?: number;
  assetValue?: number;
  amortizationDuration?: number;
  activationDate?: string;
  cropAgeMonths?: number;
  associatedCropDensity?: number;
  associatedCropAge?: number; // New Field for associated crop lifecycle
}

export interface InventoryItem { 
  id: string; 
  warehouseId: string; 
  name: string; 
  category: Category; 
  currentQuantity: number; 
  baseUnit: 'g' | 'ml' | 'unit'; 
  averageCost: number; 
  lastPurchasePrice: number;
  lastPurchaseUnit: Unit;
  minStock?: number;
  minStockUnit?: Unit;
  image?: string;
  description?: string;
  expirationDate?: string;
  safetyIntervalDays?: number;
}

export interface LaborLog { 
  id: string; 
  warehouseId: string; 
  date: string; 
  personnelId: string;
  personnelName: string; 
  activityId: string;
  activityName: string; 
  costCenterId: string;
  costCenterName: string;
  value: number; 
  paid: boolean;
  notes?: string;
  areaWorked?: number;
  hoursWorked?: number;
  jornalesEquivalent?: number;
  performanceYieldHaJornal?: number;
}

export interface HarvestLog { 
  id: string; 
  warehouseId: string;
  costCenterId: string;
  costCenterName: string;
  date: string; 
  cropName: string; 
  quantity: number; 
  unit: string; 
  totalValue: number;
  quality1Qty?: number;
  quality2Qty?: number;
  wasteQty?: number;
  rejectionCause?: string;
  notes?: string;
  yieldFactor?: number;
  collectorsCount?: number;
  greenPercentage?: number;
  pestPercentage?: number;
  defectPercentage?: number;
  // BI Fields
  brocaLossValue?: number; // Dinero perdido por castigo de precio
  efficiencyStatus?: 'LOW_OFFER' | 'LOW_EFFICIENCY' | 'OPTIMAL';
}

export interface Movement { 
  id: string; 
  warehouseId: string; 
  itemId: string; 
  itemName: string; 
  type: 'IN' | 'OUT'; 
  quantity: number; 
  unit: Unit; 
  calculatedCost: number; 
  date: string; 
  notes?: string;
  invoiceNumber?: string;
  invoiceImage?: string;
  outputCode?: string;
  supplierId?: string;
  supplierName?: string;
  costCenterId?: string;
  costCenterName?: string;
  machineId?: string;
  machineName?: string;
  personnelId?: string;
  personnelName?: string;
  phiApplied?: number;
  // Admin Fields
  paymentDueDate?: string;
  paymentStatus?: 'PENDING' | 'PAID';
}

export interface InitialMovementDetails {
  supplierId?: string;
  invoiceNumber?: string;
  invoiceImage?: string;
  paymentDueDate?: string;
}

export interface SoilAnalysis { 
  id: string; 
  warehouseId: string; 
  costCenterId: string;
  costCenterName: string; 
  date: string; 
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  calcium?: number;
  magnesium?: number;
  sulfur?: number;
  aluminum?: number;
  boron?: number;
  organicMatter: number;
  notes: string; 
}

export interface PPELog { id: string; warehouseId: string; personnelId: string; personnelName: string; date: string; items: string[]; notes?: string; }
export interface WasteLog { id: string; warehouseId: string; date: string; itemDescription: string; quantity: number; tripleWashed: boolean; disposalPoint?: string; }
export interface Machine { id: string; warehouseId: string; name: string; brand?: string; purchaseDate?: string; purchaseValue?: number; expectedLifeHours?: number; capacityTheoretical?: number; width?: number; efficiency?: number; dischargeRateLitersPerMin?: number; avgSpeedKmh?: number; }
export interface MaintenanceLog { id: string; warehouseId: string; machineId: string; date: string; cost: number; description: string; hoursWorked?: number; fuelUsedLiters?: number; }
export interface RainLog { id: string; warehouseId: string; date: string; millimeters: number; }
export interface FinanceLog { id: string; warehouseId: string; date: string; type: 'INCOME' | 'EXPENSE'; amount: number; category: string; description: string; }

export type CostClassification = 'JOINT' | 'COFFEE' | 'PLANTAIN' | 'OTHER';

export interface Activity { 
  id: string; 
  warehouseId: string; 
  name: string; 
  costClassification?: CostClassification;
}

export interface Personnel { 
  id: string; 
  warehouseId: string; 
  name: string; 
  role: string; 
  documentId?: string;
  phone?: string;
  emergencyContact?: string;
  eps?: string;
  arl?: boolean;
  birthDate?: string;
  disability?: string;
  
  // Labor Compliance
  contractType?: ContractType;
  contractStartDate?: string;
  contractEndDate?: string;
}

export interface Supplier { 
  id: string; 
  warehouseId: string; 
  name: string; 
  phone?: string; 
  email?: string; 
  address?: string;
  taxId?: string;
  creditDays?: number;
}
