

import React, { useState } from 'react';
import { X, ShieldCheck, Scale, FileText, Gavel, UserCheck, Lock, Globe, Book, Eye, Download, Info, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

interface LegalComplianceModalProps {
  onClose: () => void;
}

export const LegalComplianceModal: React.FC<LegalComplianceModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'habeas' | 'copyright' | 'terms' | 'consumer'>('habeas');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-2 sm:p-4 animate-fade-in">
      <div className="bg-slate-950 w-full max-w-5xl h-[90vh] rounded-[3rem] border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        
        {/* Header Dinámico */}
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <div className="flex items-center gap-4">
                <div className="bg-emerald-600/20 p-3 rounded-2xl border border-emerald-500/30">
                    <Gavel className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                    <h3 className="text-white font-black text-2xl uppercase tracking-tighter">Legal & Compliance Hub</h3>
                    <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-black">Validado para Colombia Edición 2025</p>
                </div>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 transition-all">
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Navegación por Pestañas Legales */}
        <div className="flex bg-slate-950 p-1.5 border-b border-slate-800 gap-1 overflow-x-auto scrollbar-hide shrink-0">
            <button onClick={() => setActiveTab('habeas')} className={`shrink-0 px-6 py-4 text-[10px] font-black uppercase rounded-2xl flex items-center gap-2 transition-all ${activeTab === 'habeas' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                <UserCheck className="w-4 h-4" /> Habeas Data
            </button>
            <button onClick={() => setActiveTab('copyright')} className={`shrink-0 px-6 py-4 text-[10px] font-black uppercase rounded-2xl flex items-center gap-2 transition-all ${activeTab === 'copyright' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                <FileText className="w-4 h-4" /> Derechos de Autor
            </button>
            <button onClick={() => setActiveTab('terms')} className={`shrink-0 px-6 py-4 text-[10px] font-black uppercase rounded-2xl flex items-center gap-2 transition-all ${activeTab === 'terms' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                <ShieldAlert className="w-4 h-4" /> Términos de Uso
            </button>
            <button onClick={() => setActiveTab('consumer')} className={`shrink-0 px-6 py-4 text-[10px] font-black uppercase rounded-2xl flex items-center gap-2 transition-all ${activeTab === 'consumer' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                <Scale className="w-4 h-4" /> Consumidor
            </button>
        </div>

        {/* Contenido Legal Extenso */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-slate-900/30">
            
            {activeTab === 'habeas' && (
                <div className="space-y-6 animate-fade-in text-slate-300">
                    <section className="space-y-4">
                        <h4 className="text-white font-black uppercase text-base flex items-center gap-2">
                            <Lock className="w-5 h-5 text-blue-500" /> Política de Tratamiento de Datos (Leyes 1581 y 2157)
                        </h4>
                        <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800 text-xs leading-relaxed space-y-4">
                            <p><strong>1. Identificación del Responsable:</strong> DatosFinca Viva, operada localmente por el usuario en su dispositivo móvil. No existe una base de datos centralizada de terceros.</p>
                            <p><strong>2. Finalidad:</strong> Los datos recolectados (Inventarios, Nómina, Ubicación de Lotes) tienen como finalidad exclusiva la gestión administrativa de la unidad productiva y el apoyo a decisiones con analíticas propias de la aplicación.</p>
                            <p><strong>3. Derechos del Titular:</strong> Usted, como usuario, tiene derecho a conocer, actualizar y rectificar sus datos. Dado que la App es 100% local, el ejercicio de estos derechos se realiza mediante la edición directa en la interfaz o la eliminación del caché de la aplicación.</p>
                        </div>
                    </section>
                </div>
            )}

            {activeTab === 'copyright' && (
                <div className="space-y-6 animate-fade-in text-slate-300">
                    <section className="space-y-4">
                        <h4 className="text-white font-black uppercase text-base flex items-center gap-2">
                            <Book className="w-5 h-5 text-purple-500" /> Propiedad Intelectual (Ley 23 de 1982)
                        </h4>
                        <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800 text-xs leading-relaxed space-y-4">
                            <p><strong>Titularidad:</strong> DatosFinca Viva es una obra protegida. Lucas Mateo Tabares Franco es el autor y titular exclusivo de los derechos morales y patrimoniales sobre el código fuente, la arquitectura de base de datos y los diseños de interfaz.</p>
                            <p><strong>Licencia de Uso:</strong> Se concede al usuario una licencia no exclusiva, personal e intransferible para el uso de la herramienta con fines agrícolas. Se prohíbe estrictamente la ingeniería inversa o la creación de obras derivadas.</p>
                            <p><strong>Protección Tecnológica:</strong> La App incorpora medidas tecnológicas de protección (TPM) para evitar el acceso no autorizado a su lógica de negocio, amparadas por la Ley 1915 de 2018.</p>
                        </div>
                    </section>
                </div>
            )}

            {activeTab === 'terms' && (
                <div className="space-y-6 animate-fade-in text-slate-300">
                    <section className="space-y-4">
                        <h4 className="text-white font-black uppercase text-base flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-500" /> Términos y Condiciones de Uso
                        </h4>
                        <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800 text-xs leading-relaxed space-y-4">
                            <p><strong>Responsabilidad del Usuario:</strong> DatosFinca Viva es una herramienta de apoyo a la decisión. El usuario es el único responsable de la veracidad de los datos ingresados y de las acciones tomadas basadas en los análisis generados por la aplicación.</p>
                            <p><strong>Seguridad de Datos:</strong> Al ser una App "Local-First", la pérdida del dispositivo sin un backup previo conlleva la pérdida irrecuperable de la información. El desarrollador no se hace responsable por fallas de hardware del usuario.</p>
                            <p><strong>Validez de Mensajes de Datos:</strong> El uso continuado de la App constituye una aceptación tácita de que los registros digitales generados tienen la validez de un mensaje de datos, en concordancia con la Ley 527 de 1999.</p>
                        </div>
                    </section>
                </div>
            )}

            {activeTab === 'consumer' && (
                <div className="space-y-6 animate-fade-in text-slate-300">
                    <section className="space-y-4">
                        <h4 className="text-white font-black uppercase text-base flex items-center gap-2">
                            <Scale className="w-5 h-5 text-emerald-500" /> Estatuto del Consumidor (Ley 1480)
                        </h4>
                        <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800 text-xs leading-relaxed space-y-4">
                            <p><strong>Derecho al Retracto:</strong> En compras de suscripciones digitales (PRO), el usuario tiene 5 días hábiles para solicitar la devolución de su dinero a través de la plataforma de pagos de Google Play.</p>
                            <p><strong>Reversión del Pago:</strong> Aplica en casos de fraude o producto no solicitado, según el Artículo 51 de la Ley 1480.</p>
                            <p><strong>Soporte y Garantía:</strong> DatosFinca Viva garantiza la funcionalidad del software. En caso de errores técnicos, el canal de soporte es: lucas.tabares@gmail.com.</p> {/* Updated support email */}
                        </div>
                    </section>
                </div>
            )}

        </div>

        {/* Footer de Aceptación */}
        <div className="p-8 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-500" />
                <p className="text-[10px] text-slate-500 font-bold uppercase">Versión del Marco Legal: 2025.1.0-CO</p>
            </div>
            <button onClick={onClose} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-10 rounded-2xl text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-900/40 transition-all active:scale-95">
                ACEPTAR Y CONTINUAR
            </button>
        </div>

      </div>
    </div>
  );
};