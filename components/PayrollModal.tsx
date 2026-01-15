
import React, { useState, useMemo } from 'react';
import { LaborLog, Personnel } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { generatePaymentReceipt } from '../services/reportService';
import { X, CheckCircle, AlertTriangle, Printer, Wallet, UserCheck, Loader2, ShieldCheck, Scale, Briefcase, FileText } from 'lucide-react';

interface PayrollModalProps {
  logs: LaborLog[];
  personnel: Personnel[];
  onMarkAsPaid: (logIds: string[]) => void;
  onClose: () => void;
  warehouseName: string;
  laborFactor: number;
}

export const PayrollModal: React.FC<PayrollModalProps> = ({ logs, personnel, onMarkAsPaid, onClose, warehouseName, laborFactor }) => {
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const unpaidLogs = useMemo(() => logs.filter(l => !l.paid), [logs]);
  
  const debtByPerson = useMemo<Record<string, number>>(() => {
    const debt: Record<string, number> = {};
    unpaidLogs.forEach(l => {
        debt[l.personnelId] = (debt[l.personnelId] || 0) + l.value;
    });
    return debt;
  }, [unpaidLogs]);

  // CÁLCULO DE DEUDA GLOBAL INTELIGENTE
  // Suma el costo real individualmente dependiendo del tipo de contrato de cada persona
  const totalGlobalDebtReal = useMemo(() => {
    return Object.entries(debtByPerson).reduce((acc: number, [personId, amount]) => {
        const person = personnel.find(p => p.id === personId);
        // Si es Prestación de Servicios, el factor es 1.0 (Sin carga prestacional empresa)
        // Si es Laboral u otro, aplica el factor configurado (ej: 1.52)
        const factor = person?.contractType === 'PRESTACION_SERVICIOS' ? 1.0 : laborFactor;
        return acc + ((amount as number) * factor);
    }, 0);
  }, [debtByPerson, personnel, laborFactor]);

  const selectedLogs = useMemo(() => {
      return unpaidLogs.filter(l => l.personnelId === selectedPersonId).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [unpaidLogs, selectedPersonId]);

  // LÓGICA INDIVIDUAL
  const selectedPerson = personnel.find(p => p.id === selectedPersonId);
  const selectedPersonName = selectedPerson?.name || 'Desconocido';
  
  const isServiceContract = selectedPerson?.contractType === 'PRESTACION_SERVICIOS';
  const effectiveFactor = isServiceContract ? 1.0 : laborFactor;

  const totalSelectedBase = selectedLogs.reduce((acc, l) => acc + l.value, 0);
  const totalSelectedReal = totalSelectedBase * effectiveFactor;
  const provicionesSociales = totalSelectedReal - totalSelectedBase;

  const handlePay = async () => {
    if (!selectedPersonId || selectedLogs.length === 0) return;
    
    if (confirm(`¿Confirmar liquidación de ${formatCurrency(totalSelectedBase)} a ${selectedPersonName}? Se generará el comprobante de pago.`)) {
        setIsProcessing(true);
        try {
            generatePaymentReceipt(selectedPersonName, selectedLogs, warehouseName);
            await new Promise(resolve => setTimeout(resolve, 800));
            const ids = selectedLogs.map(l => l.id);
            onMarkAsPaid(ids);
            setSelectedPersonId('');
        } catch (error) {
            console.error(error);
            alert("Error en PDF. El pago se marcará en el sistema de todos modos.");
            const ids = selectedLogs.map(l => l.id);
            onMarkAsPaid(ids);
        } finally { setIsProcessing(false); }
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 w-full max-w-5xl rounded-[2.5rem] border border-slate-700 shadow-2xl overflow-hidden flex flex-col h-[90vh] animate-slide-up">
        
        <div className="bg-emerald-900 p-6 flex justify-between items-center border-b border-emerald-800">
            <div className="flex items-center gap-4">
                <div className="bg-emerald-500/20 p-2.5 rounded-2xl border border-emerald-500/30">
                    <Wallet className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-white font-black text-xl">Gestión de Nómina</h3>
                    <p className="text-emerald-200/70 text-xs font-bold uppercase tracking-widest">Liquidación Consolidada AgroSuite</p>
                </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-emerald-800 rounded-full text-emerald-200 transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        <div className="flex flex-col md:flex-row h-full overflow-hidden">
            
            <div className="w-full md:w-80 bg-slate-900/50 border-r border-slate-700 overflow-y-auto custom-scrollbar p-4 space-y-4">
                <div className="p-5 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-700 shadow-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-black mb-1">Pasivo Laboral Total (Real)</p>
                    <p className="text-2xl font-mono font-black text-white">{formatCurrency(totalGlobalDebtReal)}</p>
                    <div className="mt-2 flex items-center gap-2 text-[9px] font-bold px-2 py-1 rounded-lg text-slate-400 bg-slate-800 border border-slate-600">
                        <Scale className="w-3 h-3" /> Cálculo mixto (Laboral/Servicios)
                    </div>
                </div>

                <p className="text-[10px] text-slate-500 font-black uppercase px-2">Listado de Personal</p>
                
                {Object.keys(debtByPerson).length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">
                        <CheckCircle className="w-10 h-10 mx-auto mb-4 opacity-20" />
                        Todo el personal está al día.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {personnel.filter(p => ((debtByPerson[p.id] as number) || 0) > 0).map(p => {
                            const isPS = p.contractType === 'PRESTACION_SERVICIOS';
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedPersonId(p.id)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedPersonId === p.id ? 'bg-emerald-600 border-emerald-500 shadow-lg' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`font-black text-sm ${selectedPersonId === p.id ? 'text-white' : 'text-slate-200'}`}>{p.name}</span>
                                        <span className={`font-mono text-xs font-black ${selectedPersonId === p.id ? 'text-emerald-100' : 'text-emerald-500'}`}>{formatCurrency(debtByPerson[p.id])}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className={`text-[9px] font-bold uppercase ${selectedPersonId === p.id ? 'text-emerald-200' : 'text-slate-500'}`}>{unpaidLogs.filter(l => l.personnelId === p.id).length} Regs.</p>
                                        {isPS && <span className={`text-[8px] font-black px-1.5 rounded uppercase ${selectedPersonId === p.id ? 'bg-emerald-800 text-emerald-200' : 'bg-slate-700 text-slate-400'}`}>OPS</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="flex-1 bg-slate-800 p-6 flex flex-col overflow-hidden">
                {selectedPersonId ? (
                    <div className="flex flex-col h-full animate-fade-in">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h4 className="text-white font-black text-2xl flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${isServiceContract ? 'bg-indigo-600' : 'bg-blue-600'}`}>{selectedPersonName[0]}</div>
                                    {selectedPersonName}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border ${isServiceContract ? 'bg-indigo-900/30 border-indigo-500 text-indigo-400' : 'bg-blue-900/30 border-blue-500 text-blue-400'}`}>
                                        {isServiceContract ? 'Prestación de Servicios' : 'Contrato Laboral'}
                                    </span>
                                    {selectedPerson?.contractEndDate && <span className="text-[10px] text-slate-500">Vence: {selectedPerson.contractEndDate}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
                                <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Total a Pagar (Neto)</p>
                                <p className="text-lg font-black text-slate-300 font-mono">{formatCurrency(totalSelectedBase)}</p>
                            </div>
                            <div className={`bg-slate-900/50 p-4 rounded-2xl border ${isServiceContract ? 'border-slate-800' : 'border-slate-700'}`}>
                                <p className={`text-[9px] font-black uppercase mb-1 ${isServiceContract ? 'text-slate-600' : 'text-indigo-400'}`}>Carga Social / Prest.</p>
                                <p className={`text-lg font-black font-mono ${isServiceContract ? 'text-slate-600' : 'text-indigo-400'}`}>
                                    {isServiceContract ? 'N/A (Honorarios)' : `+${formatCurrency(provicionesSociales)}`}
                                </p>
                            </div>
                            <div className="bg-emerald-900/20 p-4 rounded-2xl border border-emerald-500/30">
                                <p className="text-[9px] text-emerald-500 font-black uppercase mb-1">Costo Real Finca</p>
                                <p className="text-lg font-black text-emerald-500 font-mono">{formatCurrency(totalSelectedReal)}</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/50 rounded-3xl border border-slate-700 p-4 mb-6">
                            <table className="w-full text-left">
                                <thead className="text-[9px] text-slate-500 uppercase font-black border-b border-slate-800">
                                    <tr><th className="p-3">Fecha</th><th className="p-3">Labor Realizada</th><th className="p-3 text-right">Valor Neto</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {selectedLogs.map(log => (
                                        <tr key={log.id} className="text-slate-300 hover:bg-slate-800/30 group">
                                            <td className="p-3 font-mono text-xs">{new Date(log.date).toLocaleDateString()}</td>
                                            <td className="p-3">
                                                <div className="text-xs font-bold text-slate-200">{log.activityName}</div>
                                                <div className="text-[9px] text-slate-500 uppercase">{log.costCenterName}</div>
                                            </td>
                                            <td className="p-3 text-right font-mono font-black text-emerald-500">{formatCurrency(log.value)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`p-4 rounded-2xl border flex gap-4 items-center ${isServiceContract ? 'bg-indigo-900/10 border-indigo-700/30' : 'bg-amber-900/10 border-amber-700/30'}`}>
                                {isServiceContract ? <FileText className="w-8 h-8 text-indigo-500 shrink-0" /> : <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />}
                                <div className="text-[10px]">
                                    <p className={`font-black uppercase ${isServiceContract ? 'text-indigo-400' : 'text-amber-400'}`}>
                                        {isServiceContract ? 'Liquidación de Honorarios' : 'Liquidación Laboral'}
                                    </p>
                                    <p className="text-slate-400">
                                        {isServiceContract 
                                            ? 'Contrato de Prestación de Servicios. El valor pagado cubre la totalidad de la obligación. El contratista asume su Seguridad Social.'
                                            : `Factor ${laborFactor} aplicado. Incluye provisión de prestaciones sociales según CST.`
                                        }
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={handlePay}
                                disabled={isProcessing}
                                className={`w-full font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 ${isProcessing ? 'bg-slate-700 text-slate-400' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'}`}
                            >
                                {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Printer className="w-6 h-6" /> LIQUIDAR Y GENERAR PDF</>}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                        <Scale className="w-20 h-20 opacity-10" />
                        <div className="text-center">
                            <p className="font-black uppercase text-xs tracking-widest">Selector de Liquidación</p>
                            <p className="text-[10px] mt-2 max-w-xs mx-auto">Seleccione un trabajador para procesar su pago consolidado.</p>
                        </div>
                    </div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
};
