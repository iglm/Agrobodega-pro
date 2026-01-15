
import { AppState } from '../types';
import { calculateKPIs } from './analyticsService';

export interface AgroAlert {
  id: string;
  type: 'warning' | 'critical' | 'success';
  message: string;
  advice: string;
  severity: 'HIGH' | 'MEDIUM';
}

/**
 * Analiza la salud financiera de la finca comparando KPIs con umbrales técnicos.
 */
export const checkFarmHealth = (data: AppState): AgroAlert[] => {
  const kpis = calculateKPIs(data);
  const alerts: AgroAlert[] = [];

  // UMBRAL 1: Gasto en Mano de Obra (Estándar Cenicafé ~55%)
  // Si los gastos de labor superan el 60% de los ingresos totales
  const laborRatio = kpis.totalIncomes > 0 ? (kpis.totalExpenses / kpis.totalIncomes) : 0;
  
  if (laborRatio > 0.60) {
    alerts.push({
      id: 'labor-excess',
      type: 'critical',
      severity: 'HIGH',
      message: '¡Gasto de mano de obra elevado!',
      advice: 'Tus costos de labor superan el 60% de los ingresos. Revisa el manual "Análisis Económico" para optimizar los pases de cosecha.'
    });
  }

  // UMBRAL 2: Costo por Kilo vs Mercado (Referencia estática $17,500 COP)
  const mercadoPrecioReferencia = 17500; 
  if (kpis.costPerKg > mercadoPrecioReferencia * 0.85) {
    const isCritical = kpis.costPerKg > mercadoPrecioReferencia;
    alerts.push({
      id: 'cost-efficiency',
      type: isCritical ? 'critical' : 'warning',
      severity: isCritical ? 'HIGH' : 'MEDIUM',
      message: isCritical ? 'Costo de producción insostenible' : 'Margen de ganancia en riesgo',
      advice: isCritical 
        ? 'Tu costo por kilo supera el precio de mercado. Urgente: auditar mermas y eficiencia de fertilización.'
        : 'Tu costo por kilo está muy cerca del umbral de rentabilidad. Considera optimizar el uso de insumos químicos.'
    });
  }

  // UMBRAL 3: Retorno de Inversión (ROI)
  if (kpis.totalExpenses > 0 && kpis.roi < 5) {
    alerts.push({
      id: 'low-roi',
      type: 'warning',
      severity: 'MEDIUM',
      message: 'Retorno de Inversión bajo',
      advice: 'El ROI actual es inferior al 5%. Evalúa si los lotes en "Levante" están consumiendo demasiado flujo de caja sin compensación.'
    });
  }

  return alerts;
};
