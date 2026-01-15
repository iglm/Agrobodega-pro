
import React, { useState } from 'react';
import { X, BookOpen, Calculator, TrendingUp, Sprout, Pickaxe, Package, BarChart3, ArrowRight, HelpCircle, Download, DollarSign, Tractor, Umbrella, Globe, Database, FileText, Mic, Target, Lightbulb, Scale, PieChart, Leaf, Gauge, Microscope, ShieldCheck, Signature, Recycle, Gem, Coins, Timer, Camera, Info, Loader2, FileDown, Lock, Zap, Award, Search, CheckCircle2, FlaskConical, Map, ShieldAlert, Coffee, ClipboardList, Wrench, Landmark, FileSpreadsheet, Activity as ActivityIcon } from 'lucide-react';
import { generateManualPDF, generateSpecsPDF } from '../services/reportService';

interface ManualModalProps {
  onClose: () => void;
}

type Section = 'intro' | 'operations' | 'finances' | 'strategic' | 'technical' | 'compliance';

export const ManualModal: React.FC<ManualModalProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState<Section>('intro');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingSpecs, setIsDownloadingSpecs] = useState(false);

  const renderContent = () => {
    switch (activeSection) {
      case 'intro':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-br from-emerald-900 to-slate-900 p-8 rounded-[3rem] border border-emerald-500/30 text-center relative overflow-hidden shadow-2xl">
              <div className="relative z-10">
                <div className="bg-white/10 w-20 h-20 rounded-3xl backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <BookOpen className="w-10 h-10 text-emerald-400" />
                </div>
                <h4 className="text-4xl font-black text-white mb-2 tracking-tight">Ecosistema <span className="text-emerald-400">Viva</span></h4>
                <p className="text-emerald-200 font-bold text-sm uppercase tracking-widest">Guía Maestra de Gestión 360</p>
                <div className="mt-6 inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-[10px] text-white border border-white/20 uppercase font-black">
                    <Award className="w-4 h-4 text-emerald-400" /> Lucas Mateo Tabares Franco - Developer
                </div>
              </div>
            </div>

            <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-700 shadow-lg">
                <h5 className="font-black text-white flex items-center gap-3 mb-6 uppercase text-xs tracking-widest">
                  <Target className="w-5 h-5 text-indigo-400" /> Propósito del Sistema
                </h5>
                <p className="text-sm text-slate-300 leading-relaxed text-justify mb-6 font-medium">
                    DatosFinca Viva ha evolucionado de ser una libreta digital a un **ERP Agrícola de Clase Mundial**. Esta herramienta está diseñada para que usted tome decisiones basadas en **datos duros**, no en suposiciones. Cada registro de bodega, cada jornal pagado y cada lluvia anotada alimenta un motor matemático que calcula la rentabilidad real de su negocio.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900 p-5 rounded-3xl border border-slate-700 flex flex-col gap-2">
                        <Zap className="w-6 h-6 text-yellow-400" />
                        <p className="text-[10px] font-black text-white uppercase">Gestión Reactiva</p>
                        <p className="text-[11px] text-slate-500">¿Cuánto gasté el mes pasado en fertilización?</p>
                    </div>
                    <div className="bg-indigo-600 p-5 rounded-3xl shadow-lg shadow-indigo-900/40 flex flex-col gap-2">
                        <TrendingUp className="w-6 h-6 text-white" />
                        <p className="text-[10px] font-black text-white uppercase">Gestión Proactiva</p>
                        <p className="text-[11px] text-indigo-100">¿Es rentable sembrar 5.000 árboles más hoy?</p>
                    </div>
                </div>
            </div>
          </div>
        );

      case 'operations':
        return (
          <div className="space-y-6 animate-fade-in">
             <h4 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                <Package className="w-6 h-6 text-emerald-500" /> Operaciones y Bodega (CPP)
             </h4>
             <div className="bg-slate-800 p-6 rounded-[2.5rem] border border-slate-700 space-y-6">
                <section>
                    <h5 className="text-emerald-400 text-[10px] font-black uppercase mb-3 flex items-center gap-2">
                        <Calculator className="w-4 h-4" /> Costo Promedio Ponderado (CPP)
                    </h5>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        La app utiliza el método CPP. Si compra un bulto de Urea a $150.000 y luego otro a $170.000, el sistema calcula automáticamente un valor intermedio para sus salidas a campo, garantizando un costeo exacto del cultivo.
                    </p>
                </section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                        <p className="text-[10px] font-black text-emerald-500 uppercase mb-1">Entradas</p>
                        <p className="text-[11px] text-slate-400">Registre facturas y tome fotos del soporte físico para auditorías.</p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                        <p className="text-[10px] font-black text-red-500 uppercase mb-1">Salidas</p>
                        <p className="text-[11px] text-slate-400">Asigne insumos a lotes específicos para generar el costo directo de producción.</p>
                    </div>
                </div>
                <section className="pt-4 border-t border-slate-700">
                    <h5 className="text-amber-500 text-[10px] font-black uppercase mb-3 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" /> Auditoría de Stock
                    </h5>
                    <p className="text-xs text-slate-400">Use la función "Conteo Ciego" en el menú de bodega para cuadrar el inventario físico vs. digital periódicamente.</p>
                </section>
             </div>
          </div>
        );

      case 'finances':
        return (
          <div className="space-y-6 animate-fade-in">
             <h4 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                <DollarSign className="w-6 h-6 text-amber-500" /> Finanzas y Nómina Real
             </h4>
             <div className="bg-slate-800 p-6 rounded-[2.5rem] border border-amber-500/20 space-y-6">
                <section>
                    <h5 className="text-amber-500 text-[10px] font-black uppercase mb-3 flex items-center gap-2">
                        <Scale className="w-4 h-4" /> Factor Prestacional (Carga Legal)
                    </h5>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        En Configuración puede definir su <strong>Factor de Nómina</strong>. 
                        <br/>- <strong>1.0:</strong> Solo registra el pago neto (Informal).
                        <br/>- <strong>1.52:</strong> Registra el costo real (Carga legal colombiana 2025).
                    </p>
                </section>
                <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800">
                    <div className="flex items-center gap-3 mb-4">
                        <Signature className="w-6 h-6 text-indigo-400" />
                        <p className="text-[10px] font-black text-white uppercase">Protección Legal</p>
                    </div>
                    <p className="text-[11px] text-slate-400">Al liquidar pagos en el menú "Personal", genere el **Recibo PDF**. Este documento, firmado por el trabajador, es su principal defensa ante demandas laborales o auditorías de la UGPP.</p>
                </div>
             </div>
          </div>
        );

      case 'strategic':
        return (
            <div className="space-y-6 animate-fade-in">
               <h4 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                  <ActivityIcon className="w-6 h-6 text-purple-500" /> Ingeniería de Decisión
               </h4>
               <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-purple-500/20 space-y-8">
                  <section className="space-y-3">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500/20 rounded-xl"><Calculator className="w-5 h-5 text-purple-400" /></div>
                          <h5 className="text-white text-sm font-black uppercase">Viabilidad de Proyectos (VPN / TIR)</h5>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                          En la pestaña <strong>Estrategia</strong>, encontrará la calculadora de inversión. Ingrese la inversión inicial y los flujos anuales esperados.
                          <br/>- <strong>VPN &gt; 0:</strong> El proyecto crea riqueza.
                          <br/>- <strong>TIR &gt; Tasa Oportunidad:</strong> El proyecto es más rentable que un CDT.
                      </p>
                  </section>

                  <section className="space-y-3">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-500/20 rounded-xl"><Sprout className="w-5 h-5 text-emerald-400" /></div>
                          <h5 className="text-white text-sm font-black uppercase">Activos Biológicos (NIC 41)</h5>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                          Gestione sus cultivos como activos financieros.
                          <br/>- <strong>Etapa Levante (CAPEX):</strong> Todos los costos se capitalizan. No son gastos, son inversión.
                          <br/>- <strong>Etapa Producción (OPEX):</strong> El sistema congela el valor acumulado y comienza a amortizarlo anualmente.
                      </p>
                  </section>
               </div>
            </div>
        );

      case 'technical':
        return (
          <div className="space-y-6 animate-fade-in">
             <h4 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                <Wrench className="w-6 h-6 text-blue-500" /> Herramientas de Precisión
             </h4>
             <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-blue-500/20 space-y-8">
                <section className="space-y-3">
                    <h5 className="text-blue-400 text-[10px] font-black uppercase flex items-center gap-2">
                        <FlaskConical className="w-4 h-4" /> Calibración de Boquillas y Mezcla
                    </h5>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        Modelos Técnicos Validados 2025: Calibre sus bombas ingresando la descarga (L/min), ancho de faja y velocidad. El sistema le dirá cuántos Litros de agua por Hectárea gasta y, lo más importante, <strong>cuánto veneno o abono exacto poner en el tanque</strong> para no desperdiciar dinero.
                    </p>
                </section>
                <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex items-start gap-4">
                    <div className="p-3 bg-red-600/20 rounded-2xl"><ShieldAlert className="w-6 h-6 text-red-500" /></div>
                    <div>
                        <p className="text-xs font-black text-white uppercase mb-1">Radar de Inocuidad (PHI/PC)</p>
                        <p className="text-[11px] text-slate-400 italic">Si intenta registrar una cosecha en un lote donde aplicó un químico hace poco, la App le lanzará una <strong>alerta roja</strong> si no se ha cumplido el Periodo de Carencia. ¡Evite trazas químicas en su producto!</p>
                    </div>
                </div>
             </div>
          </div>
        );

      case 'compliance':
        return (
          <div className="space-y-6 animate-fade-in">
             <h4 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                <ShieldCheck className="w-6 h-6 text-indigo-500" /> Certificaciones y Auditoría
             </h4>
             <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-indigo-500/20 space-y-6">
                <section>
                    <h5 className="text-indigo-400 text-[10px] font-black uppercase mb-4 flex items-center gap-2">
                        <Landmark className="w-4 h-4" /> Centro de Reportes Pro
                    </h5>
                    <div className="space-y-4">
                        <div className="flex gap-4 items-start">
                            <FileSpreadsheet className="w-6 h-6 text-emerald-500 shrink-0" />
                            <div><p className="text-[11px] font-black text-white uppercase">Libro Maestro Excel</p><p className="text-[10px] text-slate-500">10 pestañas con TODA la información de la finca: desde sanidad hasta mantenimiento de maquinaria.</p></div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <Award className="w-6 h-6 text-amber-500 shrink-0" />
                            <div><p className="text-[11px] font-black text-white uppercase">Radar BPA (Normas Nacionales)</p><p className="text-[10px] text-slate-500">Auto-evaluación digital para cumplimiento de estándares de exportación.</p></div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <FileText className="w-6 h-6 text-blue-500 shrink-0" />
                            <div><p className="text-[11px] font-black text-white uppercase">Dossier Agronómico</p><p className="text-[10px] text-slate-500">PDF consolidado de lluvias, suelos y plagas para su Ingeniero Agrónomo.</p></div>
                        </div>
                    </div>
                </section>
                <div className="bg-blue-900/10 p-5 rounded-3xl border border-blue-500/20">
                    <p className="text-[10px] text-blue-300 font-bold leading-tight">
                        <strong>PAQUETE DE CAMPO:</strong> Descargue las "Planillas Físicas" para que su mayordomo anote en el campo y luego usted digite los datos en la App. ¡Trazabilidad total desde el origen!
                    </p>
                </div>
             </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleDownloadManual = () => {
    setIsDownloading(true);
    try {
        generateManualPDF();
    } catch (e) {
        console.error(e);
        alert("Error generando el PDF. Intente de nuevo.");
    } finally {
        setTimeout(() => setIsDownloading(false), 1500);
    }
  };

  const handleDownloadSpecs = () => {
    setIsDownloadingSpecs(true);
    try {
        generateSpecsPDF();
    } catch (e) {
        console.error(e);
        alert("Error generando la Ficha Técnica. Intente de nuevo.");
    } finally {
        setTimeout(() => setIsDownloadingSpecs(false), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/95 backdrop-blur-md p-2 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-6xl h-[92vh] rounded-[3rem] border border-slate-700 shadow-2xl flex flex-col md:flex-row overflow-hidden animate-slide-up">
        
        {/* Navigation Sidebar */}
        <div className="w-full md:w-72 bg-slate-950 border-r border-slate-800 flex flex-col flex-shrink-0">
            <div className="p-8 border-b border-slate-800 flex items-center gap-4">
                <div className="p-3 bg-emerald-600 rounded-2xl shadow-xl shadow-emerald-600/20"><BookOpen className="w-6 h-6 text-white" /></div>
                <div>
                    <span className="font-black text-white text-sm uppercase tracking-tighter block">Manual de Usuario</span>
                    <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-widest">Edición 2025 PRO</span>
                </div>
            </div>
            
            <div className="flex-1 overflow-x-auto md:overflow-y-auto py-6 space-y-1 flex md:flex-col scrollbar-hide px-3">
                <button onClick={() => setActiveSection('intro')} className={`shrink-0 w-auto md:w-full text-left px-5 py-4 rounded-2xl flex items-center gap-3 transition-all ${activeSection === 'intro' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}>
                    <Globe className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Inicio</span>
                </button>
                <button onClick={() => setActiveSection('operations')} className={`shrink-0 w-auto md:w-full text-left px-5 py-4 rounded-2xl flex items-center gap-3 transition-all ${activeSection === 'operations' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}>
                    <Package className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Operación</span>
                </button>
                <button onClick={() => setActiveSection('finances')} className={`shrink-0 w-auto md:w-full text-left px-5 py-4 rounded-2xl flex items-center gap-3 transition-all ${activeSection === 'finances' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}>
                    <DollarSign className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Costeo</span>
                </button>
                <button onClick={() => setActiveSection('strategic')} className={`shrink-0 w-auto md:w-full text-left px-5 py-4 rounded-2xl flex items-center gap-3 transition-all ${activeSection === 'strategic' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}>
                    <ActivityIcon className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Estrategia</span>
                </button>
                <button onClick={() => setActiveSection('technical')} className={`shrink-0 w-auto md:w-full text-left px-5 py-4 rounded-2xl flex items-center gap-3 transition-all ${activeSection === 'technical' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}>
                    <Wrench className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Técnico</span>
                </button>
                <button onClick={() => setActiveSection('compliance')} className={`shrink-0 w-auto md:w-full text-left px-5 py-4 rounded-2xl flex items-center gap-3 transition-all ${activeSection === 'compliance' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}>
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Auditoría</span>
                </button>
            </div>

            <div className="p-8 border-t border-slate-800 space-y-3">
                <button 
                    onClick={handleDownloadManual} 
                    disabled={isDownloading}
                    className={`w-full p-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase transition-all shadow-xl border border-slate-700 ${isDownloading ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 text-white shadow-indigo-900/10'}`}
                >
                    {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5 text-emerald-400" />}
                    {isDownloading ? 'Generando...' : 'Descargar Guía PDF'}
                </button>

                <button 
                    onClick={handleDownloadSpecs} 
                    disabled={isDownloadingSpecs}
                    className={`w-full p-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase transition-all shadow-xl border border-slate-700 ${isDownloadingSpecs ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-300 border-indigo-500/30'}`}
                >
                    {isDownloadingSpecs ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                    {isDownloadingSpecs ? 'Generando...' : 'Descargar Ficha Técnica (Prompt)'}
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col h-full bg-slate-900/50 relative">
             <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
                 <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3">
                    <Info className="w-5 h-5 text-emerald-500" /> Documentación Técnica Proyectual
                 </h3>
                 <button onClick={onClose} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-all active:scale-90">
                    <X className="w-6 h-6" />
                 </button>
             </div>

             <div className="flex-1 overflow-y-auto p-8 md:p-16 custom-scrollbar select-text bg-slate-900/20">
                 <div className="max-w-3xl mx-auto">
                    {renderContent()}
                 </div>
             </div>

             <div className="absolute bottom-0 right-0 p-10 opacity-5 pointer-events-none">
                 <Landmark className="w-64 h-64 text-white" />
             </div>
        </div>

      </div>
    </div>
  );
};
