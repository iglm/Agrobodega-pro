
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AppState, CostCenter, LaborLog, Personnel, InventoryItem, Movement, HarvestLog } from '../types';
import { formatCurrency, formatBaseQuantity } from './inventoryService';

const AUTHOR_NAME = "Lucas Mateo Tabares Franco";
const AUTHOR_EMAIL = "mateotabares7@gmail.com";
const APP_VERSION = "v3.1.0-PRO";

/**
 * Agrega el encabezado institucional a cada página del PDF
 */
const addHeader = (doc: jsPDF, title: string, farmName: string) => {
  const pageWidth = doc.internal.pageSize.width;
  
  // Fondo del Header
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title.toUpperCase(), 15, 15);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${farmName} | Sistema AgroBodega Pro`, 15, 22);
  
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Desarrollado por ${AUTHOR_NAME}`, 15, 28);
  
  // Fecha a la derecha
  doc.setTextColor(255, 255, 255);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, pageWidth - 15, 15, { align: 'right' });
  doc.text(`Autoría: © 2025`, pageWidth - 15, 22, { align: 'right' });
};

/**
 * Agrega el pie de página legal a cada PDF
 */
const addFooter = (doc: jsPDF) => {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    const footerText = `Software de Gestión Local Offline - Soporte: ${AUTHOR_EMAIL} - Propiedad Intelectual de ${AUTHOR_NAME}. Página ${i} de ${pageCount}`;
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
};

/**
 * REPORTE: INVENTARIO VALORIZADO (PDF)
 */
export const generatePDF = (data: AppState) => {
  const doc = new jsPDF();
  const farm = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Hacienda';
  
  addHeader(doc, "Inventario de Insumos", farm);

  const tableData = data.inventory
    .filter(i => i.warehouseId === data.activeWarehouseId)
    .map(i => [
      i.name,
      i.category,
      formatBaseQuantity(i.currentQuantity, i.baseUnit),
      formatCurrency(i.averageCost, 2),
      formatCurrency(i.currentQuantity * i.averageCost)
    ]);

  autoTable(doc, {
    startY: 40,
    head: [['Insumo', 'Categoría', 'Existencia', 'Costo Unit. (CPP)', 'Valor Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [5, 150, 105] }, // Emerald 600
    foot: [['TOTAL VALORIZADO', '', '', '', formatCurrency(data.inventory.reduce((a,b)=>a+(b.currentQuantity*b.averageCost),0))]],
    footStyles: { fillColor: [15, 23, 42], textColor: [255,255,255], fontStyle: 'bold' }
  });

  addFooter(doc);
  doc.save(`Inventario_${farm}_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * REPORTE: LIBRO DE VENTAS Y COSECHA (PDF)
 */
export const generateHarvestReport = (data: AppState) => {
  const doc = new jsPDF();
  const farm = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Hacienda';
  
  addHeader(doc, "Control de Ventas y Cosecha", farm);

  const tableData = data.harvests
    .filter(h => h.warehouseId === data.activeWarehouseId)
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(h => [
      new Date(h.date).toLocaleDateString(),
      h.costCenterName,
      h.cropName,
      `${h.quantity} ${h.unit}`,
      h.yieldFactor || 'N/A',
      formatCurrency(h.totalValue)
    ]);

  autoTable(doc, {
    startY: 40,
    head: [['Fecha', 'Lote', 'Producto', 'Cantidad', 'Factor', 'Total Venta']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [4, 120, 87] }
  });

  addFooter(doc);
  doc.save(`Ventas_${farm}.pdf`);
};

/**
 * REPORTE: NÓMINA Y JORNALES (PDF)
 */
export const generateLaborReport = (data: AppState) => {
  const doc = new jsPDF();
  const farm = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Hacienda';
  
  addHeader(doc, "Consolidado de Mano de Obra", farm);

  const tableData = data.laborLogs
    .filter(l => l.warehouseId === data.activeWarehouseId)
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(l => [
      new Date(l.date).toLocaleDateString(),
      l.personnelName,
      l.activityName,
      l.costCenterName,
      l.paid ? 'PAGADO' : 'PENDIENTE',
      formatCurrency(l.value)
    ]);

  autoTable(doc, {
    startY: 40,
    head: [['Fecha', 'Trabajador', 'Labor', 'Lote', 'Estado', 'Valor Neto']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [217, 119, 6] } // Amber 600
  });

  addFooter(doc);
  doc.save(`Nomina_${farm}.pdf`);
};

/**
 * REPORTE: DOSSIER AGRONÓMICO (PDF)
 * Combina Lluvias, Suelos y Sanidad
 */
export const generateAgronomicDossier = (data: AppState) => {
  const doc = new jsPDF();
  const farm = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Hacienda';
  
  addHeader(doc, "Dossier Técnico Agronómico", farm);

  doc.setFontSize(12);
  doc.setTextColor(0,0,0);
  doc.text("1. REGISTRO PLUVIOMÉTRICO (Últimos 6 meses)", 15, 45);
  
  const rainData = data.rainLogs
    .slice(-20)
    .map(r => [new Date(r.date).toLocaleDateString(), `${r.millimeters} mm`]);

  autoTable(doc, {
    startY: 50,
    head: [['Fecha', 'Milímetros (mm)']],
    body: rainData,
    theme: 'grid',
    margin: { right: 110 } // Mitad de página
  });

  doc.text("2. ANÁLISIS DE SUELOS", 115, 45);
  const soilData = data.soilAnalyses.map(s => [s.costCenterName, s.ph]);
  autoTable(doc, {
    startY: 50,
    head: [['Lote', 'pH']],
    body: soilData,
    theme: 'grid',
    margin: { left: 115 }
  });

  doc.text("3. MONITOREO DE PLAGAS (INCIDENCIA)", 15, (doc as any).lastAutoTable.finalY + 15);
  const pestData = data.pestLogs.map(p => [
      new Date(p.date).toLocaleDateString(), 
      p.costCenterId, // Mapear nombre si es posible
      p.pestOrDisease, 
      p.incidence
  ]);
  
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [['Fecha', 'Lote ID', 'Problema', 'Nivel']],
    body: pestData,
    theme: 'striped'
  });

  addFooter(doc);
  doc.save(`Dossier_Agronomico_${farm}.pdf`);
};

/**
 * REPORTE: BALANCE GLOBAL / P&L GERENCIAL (PDF)
 */
export const generateMasterPDF = (data: AppState) => {
  const doc = new jsPDF();
  const farm = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Hacienda';
  
  addHeader(doc, "Informe Maestro de Rentabilidad", farm);

  // Cálculos Financieros
  const totalIncome = data.harvests.reduce((a,b)=>a+b.totalValue, 0);
  const totalLaborNet = data.laborLogs.reduce((a,b)=>a+b.value, 0);
  const totalLaborReal = totalLaborNet * data.laborFactor;
  const totalInputs = data.movements.filter(m => m.type === 'OUT').reduce((a,b)=>a+b.calculatedCost, 0);
  const totalExpenses = totalLaborReal + totalInputs;
  const netProfit = totalIncome - totalExpenses;

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("RESUMEN FINANCIERO CONSOLIDADO", 15, 45);

  autoTable(doc, {
    startY: 50,
    head: [['Concepto Gerencial', 'Valor Actual']],
    body: [
      ['(+) INGRESOS POR VENTAS', formatCurrency(totalIncome)],
      ['(-) COSTO MANO DE OBRA (PAGADO)', formatCurrency(totalLaborNet)],
      ['(-) PROVISIÓN PRESTACIONAL (ESTIMADA)', formatCurrency(totalLaborReal - totalLaborNet)],
      ['(-) COSTO INSUMOS APLICADOS', formatCurrency(totalInputs)],
      ['(=) UTILIDAD OPERATIVA NETA', formatCurrency(netProfit)]
    ],
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    theme: 'grid'
  });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`* Factor de carga laboral aplicado: ${data.laborFactor}x`, 15, (doc as any).lastAutoTable.finalY + 10);

  addFooter(doc);
  doc.save(`Informe_Maestro_${farm}.pdf`);
};

/**
 * REPORTE: SEGURIDAD Y SALUD (SST) / AMBIENTAL
 */
export const generateSafetyReport = (data: AppState) => {
    const doc = new jsPDF();
    const farm = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Hacienda';
    addHeader(doc, "Trazabilidad SST y Ambiental", farm);

    doc.text("ENTREGAS DE ELEMENTOS DE PROTECCIÓN (EPP)", 15, 45);
    autoTable(doc, {
        startY: 50,
        head: [['Fecha', 'Trabajador', 'Elementos Entregados']],
        body: data.ppeLogs.map(p => [new Date(p.date).toLocaleDateString(), p.personnelName, p.items.join(', ')]),
        theme: 'striped'
    });

    doc.text("GESTIÓN DE RESIDUOS Y ENVASES", 15, (doc as any).lastAutoTable.finalY + 15);
    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Fecha', 'Descripción Residuo', 'Cantidad', 'Triple Lavado']],
        body: data.wasteLogs.map(w => [new Date(w.date).toLocaleDateString(), w.itemDescription, w.quantity, w.tripleWashed ? 'SÍ' : 'NO']),
        theme: 'grid'
    });

    addFooter(doc);
    doc.save(`Reporte_SST_Ambiental_${farm}.pdf`);
};

/**
 * EXPORTACIÓN EXCEL (.xlsx) COMPLETA
 */
// Fix: Renamed exportToExcel to generateExcel to match the member name expected by MainLayout and satisfy common naming conventions
export const generateExcel = (data: AppState) => {
  const wb = XLSX.utils.book_new();

  // 1. Hoja Inventario
  const invSheet = XLSX.utils.json_to_sheet(data.inventory.map(i => ({
      Nombre: i.name,
      Categoria: i.category,
      Cantidad: i.currentQuantity,
      Unidad: i.baseUnit,
      CostoUnitario: i.averageCost,
      ValorTotal: i.currentQuantity * i.averageCost
  })));
  XLSX.utils.book_append_sheet(wb, invSheet, "Inventario");

  // 2. Hoja Nomina
  const laborSheet = XLSX.utils.json_to_sheet(data.laborLogs.map(l => ({
      Fecha: l.date,
      Trabajador: l.personnelName,
      Labor: l.activityName,
      Lote: l.costCenterName,
      Valor: l.value,
      Pagado: l.paid ? "SÍ" : "NO"
  })));
  XLSX.utils.book_append_sheet(wb, laborSheet, "Nomina");

  // 3. Hoja Ventas
  const harvestSheet = XLSX.utils.json_to_sheet(data.harvests.map(h => ({
      Fecha: h.date,
      Producto: h.cropName,
      Lote: h.costCenterName,
      Cantidad: h.quantity,
      Unidad: h.unit,
      ValorVenta: h.totalValue
  })));
  XLSX.utils.book_append_sheet(wb, harvestSheet, "Ventas");

  // Guardar archivo
  const farm = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Hacienda';
  XLSX.writeFile(wb, `Libro_Maestro_${farm}.xlsx`);
};

// --- PLACEHOLDERS COMPATIBLES CON INTERFAZ EXISTENTE ---
export const generateGlobalReport = (data: AppState) => generateMasterPDF(data);
export const generateFieldTemplates = (data: AppState) => alert("Funcionalidad de plantillas se genera mediante 'Dossier Agronómico'.");
export const generateFarmStructurePDF = (lots: CostCenter[]) => alert("Use 'Dossier Agronómico' para ver la estructura de lotes detallada.");
export const generateFarmStructureExcel = (lots: CostCenter[]) => alert("La estructura de lotes está incluida en el Libro Maestro Excel.");
export const generateMonthlyPAndL = (data: AppState, start: string, end: string) => generateMasterPDF(data);
export const generateManualPDF = () => alert("Manual en línea. Ver Centro de Ayuda.");
export const generateSpecsPDF = () => alert("Ficha técnica disponible bajo solicitud.");
export const generatePaymentReceipt = (name: string, logs: LaborLog[], farm: string) => {
    const doc = new jsPDF();
    addHeader(doc, "Recibo de Pago", farm);
    doc.setFontSize(12);
    doc.text(`Beneficiario: ${name}`, 15, 45);
    autoTable(doc, {
        startY: 50,
        head: [['Fecha', 'Labor', 'Lote', 'Neto']],
        body: logs.map(l => [l.date, l.activityName, l.costCenterName, formatCurrency(l.value)])
    });
    addFooter(doc);
    doc.save(`Recibo_${name}.pdf`);
};
export const generateSimulationPDF = () => alert("Simulación exportable en desarrollo.");
export const exportFieldSheet = (personnel: Personnel[], farmName: string) => {
    const doc = new jsPDF();
    addHeader(doc, "Planilla de Campo", farmName);
    autoTable(doc, {
        startY: 40,
        head: [['Nombre Trabajador', 'Labor Realizada', 'Lote', 'Firma']],
        body: personnel.map(p => [p.name, '', '', '________________']),
    });
    addFooter(doc);
    doc.save(`Planilla_Campo_${farmName}.pdf`);
};
