
import React from 'react';
import { X, LucideIcon, Loader2 } from 'lucide-react';

// --- BUTTON COMPONENT ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: LucideIcon;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  icon: Icon, 
  fullWidth = false,
  className = '',
  children,
  ...props 
}) => {
  const baseStyles = "font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest transition-all duration-300";
  
  const variants = {
    primary: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-900/20 border border-emerald-500/30",
    secondary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-900/20 border border-indigo-500/30",
    danger: "bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-900/20 border border-red-500/30",
    ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500",
    outline: "border-2 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-500 hover:text-emerald-500",
    glass: "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
  };

  const sizes = {
    sm: "px-4 py-2 text-[10px]",
    md: "px-6 py-3.5 text-xs",
    lg: "px-8 py-5 text-sm"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon && <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />}
      {children}
    </button>
  );
};

// --- CARD COMPONENT ---
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
}

export const Card: React.FC<CardProps> = ({ children, className = "", onClick, title, subtitle, icon: Icon }) => (
  <div 
    onClick={onClick}
    className={`bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl p-8 ${onClick ? 'cursor-pointer hover:border-emerald-500/50 hover:shadow-2xl transition-all duration-300' : ''} ${className}`}
  >
    {(title || Icon) && (
        <div className="flex items-center gap-4 mb-6">
            {Icon && <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-500"><Icon className="w-5 h-5" /></div>}
            <div>
                {title && <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{title}</h4>}
                {subtitle && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{subtitle}</p>}
            </div>
        </div>
    )}
    {children}
  </div>
);

// --- MODAL WRAPPER ---
export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; subtitle?: string; icon: LucideIcon; children: React.ReactNode; maxWidth?: string; }> = ({ 
  isOpen, onClose, title, subtitle, icon: Icon, children, maxWidth = "max-w-2xl" 
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className={`bg-white dark:bg-slate-900 w-full max-h-[90vh] rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-slide-up flex flex-col ${maxWidth}`}>
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-900/20"><Icon className="w-6 h-6 text-white" /></div>
            <div>
              <h3 className="text-slate-900 dark:text-white font-black text-xl leading-none uppercase tracking-tighter">{title}</h3>
              {subtitle && <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-all active:scale-90"><X className="w-6 h-6" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

// --- HEADER CARD ---
export const HeaderCard: React.FC<{ title: string; subtitle: string; valueLabel: string; value: string; gradientClass: string; icon: LucideIcon; onAction: () => void; actionLabel: string; actionIcon: LucideIcon; secondaryAction?: React.ReactNode; }> = ({
  title, subtitle, valueLabel, value, gradientClass, icon: Icon, onAction, actionLabel, actionIcon: ActionIcon, secondaryAction
}) => (
  <div className={`${gradientClass} rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden group`}>
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center relative z-10 gap-8">
      <div className="flex items-center gap-6">
        <div className="p-5 bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-2xl group-hover:scale-110 transition-transform duration-500">
          <Icon className="w-10 h-10 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter italic">{title}</h2>
          <p className="text-white/60 text-xs font-black uppercase tracking-[0.3em] mt-1">{subtitle}</p>
        </div>
      </div>
      <div className="text-left lg:text-right bg-black/20 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/10 min-w-[240px]">
        <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">{valueLabel}</p>
        <p className="text-4xl font-black font-mono tracking-tighter mt-1">{value}</p>
      </div>
    </div>
    <div className="flex flex-wrap gap-4 mt-10 relative z-10">
      <button onClick={onAction} className="flex-1 bg-white text-slate-900 font-black py-5 rounded-[2rem] text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-500 hover:text-white transition-all shadow-xl active:scale-95">
        <ActionIcon className="w-5 h-5" /> {actionLabel}
      </button>
      {secondaryAction}
    </div>
  </div>
);

// --- EMPTY STATE ---
export const EmptyState: React.FC<{ icon: LucideIcon; message: string; submessage?: string; }> = ({ icon: Icon, message, submessage }) => (
  <div className="text-center py-20 bg-slate-100 dark:bg-slate-900/30 rounded-[3rem] border border-dashed border-slate-300 dark:border-slate-800 animate-pulse">
    <Icon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700 mb-6" />
    <p className="text-slate-500 dark:text-slate-400 font-black uppercase text-sm tracking-widest">{message}</p>
    {submessage && <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-2 font-bold uppercase">{submessage}</p>}
  </div>
);
