
import { AppState, CostCenter } from '../types';

export interface LotRentability {
  lotName: string;
  totalLaborCost: number;
  totalInputCost: number;
  totalIndirectCost: number;
  totalCost: number;
  totalIncome: number;
  margin: number;
  marginPercent: number;
}

export interface FarmKPIs {
  totalIncomes: number;
  totalExpenses: number;
  netProfit: number;
  costPerKg: number; 
  roi: number; 
}

/**
 * Calcula la rentabilidad total de un lote específico.
 */
export const calculateLotRentability = (data: AppState, lotId: string): LotRentability => {
  const lot = data.costCenters.find(c => c.id === lotId);
  if (!lot) return { lotName: 'N/A', totalLaborCost: 0, totalInputCost: 0, totalIndirectCost: 0, totalCost: 0, totalIncome: 0, margin: 0, marginPercent: 0 };

  const laborFactor = data.laborFactor || 1.0;

  const laborCost = data.laborLogs
    .filter(l => l.costCenterId === lotId)
    .reduce((sum, l) => sum + (l.value * laborFactor), 0);

  const inputCost = data.movements
    .filter(m => m.costCenterId === lotId && m.type === 'OUT')
    .reduce((sum, m) => sum + m.calculatedCost, 0);

  const totalArea = data.costCenters.reduce((sum, c) => sum + (c.area || 0), 0) || 1;
  const indirectExpenses = data.financeLogs
    .filter(f => f.type === 'EXPENSE')
    .reduce((sum, f) => sum + f.amount, 0);
  
  const prorratedIndirect = (indirectExpenses / totalArea) * lot.area;

  const totalIncome = data.harvests
    .filter(h => h.costCenterId === lotId)
    .reduce((sum, h) => sum + h.totalValue, 0);

  const totalCost = laborCost + inputCost + prorratedIndirect;
  const margin = totalIncome - totalCost;
  const marginPercent = totalIncome > 0 ? (margin / totalIncome) * 100 : 0;

  return {
    lotName: lot.name,
    totalLaborCost: laborCost,
    totalInputCost: inputCost,
    totalIndirectCost: prorratedIndirect,
    totalCost,
    totalIncome,
    margin,
    marginPercent
  };
};

/**
 * Calcula los KPIs globales de la finca basados en el estado actual.
 */
export const calculateKPIs = (data: AppState): FarmKPIs => {
  const laborFactor = data.laborFactor || 1.0;
  
  const totalLaborNet = data.laborLogs.reduce((acc, l) => acc + l.value, 0);
  const totalLaborReal = totalLaborNet * laborFactor;
  
  const totalInputs = data.movements
    .filter(m => m.type === 'OUT')
    .reduce((acc, m) => acc + m.calculatedCost, 0);
    
  const totalIncomes = data.harvests.reduce((acc, h) => acc + h.totalValue, 0);
  const totalKgProduced = data.harvests.reduce((acc, h) => acc + h.quantity, 0);
  
  const financeExpenses = data.financeLogs
    .filter(f => f.type === 'EXPENSE')
    .reduce((acc, f) => acc + f.amount, 0);

  const totalExpenses = totalLaborReal + totalInputs + financeExpenses;
  const netProfit = totalIncomes - totalExpenses;
  const costPerKg = totalKgProduced > 0 ? totalExpenses / totalKgProduced : 0;
  const roi = totalExpenses > 0 ? (netProfit / totalExpenses) * 100 : 0;

  return {
    totalIncomes,
    totalExpenses,
    netProfit,
    costPerKg,
    roi
  };
};
