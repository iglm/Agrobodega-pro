
import { AppState } from "../types";
import { formatCurrency } from "./inventoryService";

export const analyzeFincaData = async (data: AppState): Promise<string> => {
    // Simular un pequeño delay para que la UI se sienta como un proceso asíncrono
    await new Promise(resolve => setTimeout(resolve, 500));

    const { costCenters, laborLogs, movements, harvests, laborFactor } = data;
    let report = "### 🧠 Reporte de Inteligencia Agronómica (Local)\n\n";
    
    // 1. Análisis de Eficiencia por Lote
    const lotStats = costCenters.map(lot => {
        const lotLabor = laborLogs
            .filter(l => l.costCenterId === lot.id)
            .reduce((sum, l) => sum + (l.value * laborFactor), 0);
        
        const lotInputs = movements
            .filter(m => m.costCenterId === lot.id && m.type === 'OUT')
            .reduce((sum, m) => sum + m.calculatedCost, 0);

        const totalCost = lotLabor + lotInputs;
        
        const totalProduction = harvests
            .filter(h => h.costCenterId === lot.id)
            .reduce((sum, h) => sum + h.quantity, 0);

        const unitCost = totalProduction > 0 ? totalCost / totalProduction : 0;
        
        // Check harvest recency
        const lastHarvest = harvests
            .filter(h => h.costCenterId === lot.id)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        const monthsSinceHarvest = lastHarvest 
            ? (new Date().getTime() - new Date(lastHarvest.date).getTime()) / (1000 * 3600 * 24 * 30)
            : 999;

        return { 
            name: lot.name, 
            unitCost, 
            totalCost, 
            budget: lot.budget || 0,
            stage: lot.stage,
            monthsSinceHarvest,
            hasProduction: totalProduction > 0
        };
    });

    const productiveLots = lotStats.filter(l => l.hasProduction);

    // 2. Identificar Estrella y Rezagado
    if (productiveLots.length > 0) {
        const bestLot = productiveLots.reduce((prev, curr) => prev.unitCost < curr.unitCost ? prev : curr);
        const worstLot = productiveLots.reduce((prev, curr) => prev.unitCost > curr.unitCost ? prev : curr);

        report += `**🏆 Lote Estrella:** ${bestLot.name}\n`;
        report += `- Costo de producción: **${formatCurrency(bestLot.unitCost)} / Kg**.\n`;
        report += `- Este lote es tu referencia de eficiencia.\n\n`;

        if (worstLot.name !== bestLot.name) {
            report += `**📉 Punto de Atención:** ${worstLot.name}\n`;
            report += `- Costo unitario alto: **${formatCurrency(worstLot.unitCost)} / Kg**.\n`;
            report += `- Revise costos de fertilización o eficiencia de recolección en este sector.\n\n`;
        }
    } else {
        report += "ℹ️ Aún no hay suficientes datos de cosecha para calcular eficiencias comparativas.\n\n";
    }

    // 3. Advertencias de Presupuesto
    const overBudgetLots = lotStats.filter(l => l.budget > 0 && l.totalCost > l.budget);
    if (overBudgetLots.length > 0) {
        report += "**⚠️ Alertas Financieras:**\n";
        overBudgetLots.forEach(l => {
            const diff = ((l.totalCost - l.budget) / l.budget) * 100;
            report += `- El lote **${l.name}** ha excedido su presupuesto en un **${diff.toFixed(1)}%**.\n`;
        });
        report += "\n";
    }

    // 4. Advertencias Operativas (Producción estancada)
    const stuckLots = lotStats.filter(l => l.stage === 'Produccion' && l.monthsSinceHarvest > 6 && l.monthsSinceHarvest < 999);
    if (stuckLots.length > 0) {
        report += "**🚜 Alertas Operativas:**\n";
        stuckLots.forEach(l => {
            report += `- **${l.name}** (En Producción) no registra cosechas hace **${l.monthsSinceHarvest.toFixed(0)} meses**. Verifique si hay pases perdidos o si el lote entró en renovación.\n`;
        });
    }

    if (productiveLots.length === 0 && overBudgetLots.length === 0 && stuckLots.length === 0) {
        report += "✅ El sistema está operando con parámetros normales. Continúe alimentando datos para generar insights más profundos.";
    }

    return report;
};
