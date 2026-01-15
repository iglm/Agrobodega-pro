
import React from 'react';
import { X, LucideIcon, Info } from 'lucide-react';

// --- MODAL WRAPPER ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColorClass?: string;
  headerColorClass?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, onClose, title, subtitle, icon: Icon, 
  iconColorClass = "text-indigo-400", 
  headerColorClass = "bg-slate-900",
  children, 
  maxWidth = "max-w-md" 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className={`bg-slate-800 w-full h-full sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-2xl border-0 sm:border border-slate-700 shadow-2xl overflow-hidden animate-slide-up flex flex-col ${maxWidth}`}>
        <div className={`${headerColorClass} p-4 sm:p-5 border-b border-slate-700 flex justify-between items-center flex-shrink-0 pt-safe-top`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border border-white/10 hidden sm:block`}>
              <Icon className={`w-5 h-5 ${iconColorClass}`} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg leading-none flex items-center gap-2">
                <Icon className={`w-5 h-5 sm:hidden ${iconColorClass}`} />
                {title}
              </h3>
              {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar pb-20 sm:pb-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- HEADER CARD (BIG COLORFUL BANNER) ---
interface HeaderCardProps {
  title: string;
  subtitle: string;
  valueLabel: string;
  value: string;
  gradientClass: string;
  icon: LucideIcon;
  onAction: () => void;
  actionLabel: string;
  actionIcon: LucideIcon;
  actionColorClass?: string;
  secondaryAction?: React.ReactNode;
}

export const HeaderCard: React.FC<HeaderCardProps> = ({
  title, subtitle, valueLabel, value, gradientClass, icon: Icon,
  onAction, actionLabel, actionIcon: ActionIcon, actionColorClass = "text-slate-700",
  secondaryAction
}) => (
  <div className={`${gradientClass} rounded-[2rem] p-5 md:p-8 text-white shadow-xl relative overflow-hidden`}>
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-4 relative z-10 gap-4">
      <div>
        <h2 className="text-xl md:text-3xl font-bold flex items-center gap-2">
          <Icon className="w-6 h-6 md:w-8 md:h-8 text-white/80" />
          {title}
        </h2>
        <p className="text-white/70 text-sm mt-1">{subtitle}</p>
      </div>
      <div className="text-left md:text-right w-full md:w-auto bg-white/10 md:bg-transparent p-3 md:p-0 rounded-2xl border border-white/10 md:border-none">
        <p className="text-white/60 text-[10px] md:text-xs font-bold uppercase">{valueLabel}</p>
        <p className="text-2xl md:text-4xl font-bold font-mono mt-1">{value}</p>
      </div>
    </div>
    <div className="flex gap-2 relative z-10">
      <button 
        onClick={onAction}
        className={`flex-1 bg-white ${actionColorClass} font-bold py-3 md:py-4 rounded-xl text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-white/90 transition-colors shadow-lg active:scale-95`}
      >
        <ActionIcon className="w-4 h-4 md:w-5 md:h-5" />
        {actionLabel}
      </button>
      {secondaryAction}
    </div>
    {/* Decorative background icon */}
    <Icon className="absolute -right-4 -bottom-4 w-32 h-32 md:w-40 md:h-40 text-white/5 pointer-events-none" />
  </div>
);

// --- EMPTY STATE ---
interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  submessage?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, message, submessage }) => (
  <div className="text-center py-10 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
    <Icon className="w-12 h-12 mx-auto text-slate-300 mb-2" />
    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">{message}</p>
    {submessage && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{submessage}</p>}
  </div>
);

// --- INFO ROW FOR CARDS ---
export const InfoRow: React.FC<{ icon: LucideIcon; text: string; iconColor?: string }> = ({ icon: Icon, text, iconColor = "text-slate-400" }) => (
  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
    <Icon className={`w-3 h-3 ${iconColor}`} />
    {text}
  </div>
);
