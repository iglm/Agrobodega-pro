
import React, { useState, useMemo, useEffect } from 'react';
import { CostCenter, LaborLog, Movement, HarvestLog, PlannedLabor, Activity } from '../types';
import { formatCurrency, formatNumberInput, parseNumberInput, convertToBase } from '../services/inventoryService';
import { generateFarmStructurePDF, generateFarmStructureExcel } from '../services/reportService';
import { 
  MapPin, Ruler, TreePine, Calendar, Activity as ActivityIcon, 
  History, Sprout, Scissors, Save, X, AlertTriangle, 
  TrendingUp, Droplets, Pickaxe, CheckCircle2, MoreHorizontal,
  ArrowRight, Leaf, Target, Plus, Trash2, Sun, Zap, ShieldCheck,
  FileText, FileSpreadsheet, Clock, AlertCircle, Flower2, AlignJustify
} from 'lucide-react';
import { HeaderCard, Modal, EmptyState } from './UIElements';

interface LotManagementViewProps {
  costCenters: CostCenter[];
  laborLogs: LaborLog[];
  movements: Movement[];
  harvests: HarvestLog[];
  plannedLabors: PlannedLabor[];
  onUpdateLot: (lot: CostCenter) => void;
  onAddPlannedLabor: (labor: any) => void; 
  activities: Activity[]; 
  onAddCostCenter: (name: string, budget: number, area?: number, stage?: 'Produccion' | 'Levante' | 'Infraestructura', plantCount?: number, cropType?: string, associatedCrop?: string, cropAgeMonths?: number, associatedCropDensity?: number, associatedCropAge?: number) => void;
  onDeleteCostCenter: (id: string) => void;
}

export const LotManagementView: React.FC<LotManagementViewProps> = ({
  costCenters,
  laborLogs,
  movements,
  harvests,
  plannedLabors,
  onUpdateLot,
  onAddPlannedLabor,
  activities,
  onAddCostCenter,
  onDeleteCostCenter
}) => {
  const [selectedLot, setSelectedLot] = useState<CostCenter | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showRenovateModal, setShowRenovateModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create Lot States (Mirrored from SettingsModal)
  const [loteName, setLoteName] = useState('');
  const [loteBudget, setLoteBudget] = useState('');
  const [loteArea, setLoteArea] = useState('');
  const [loteStage, setLoteStage] = useState<'Produccion' | 'Levante' | 'Infraestructura'>('Produccion');
  const [lotePlants, setLotePlants] = useState('');
  const [loteCrop, setLoteCrop] = useState('Café');
  const [loteCropAge, setLoteCropAge] = useState('');
  
  // ASSOCIATED CROP STATES (NEW)
  const [associatedCrop, setAssociatedCrop] = useState(''); // Selected value: 'Plátano', 'Banano', 'Otro', ''
  const [associatedCropName, setAssociatedCropName] = useState(''); // If 'Otro', manual name
  const [associatedCropAge, setAssociatedCropAge] = useState('');
  const [associatedCropDensity, setAssociatedCropDensity] = useState('');

  // Distancia de Siembra Main Crop
  const [distSurco, setDistSurco] = useState('');
  const [distPlanta, setDistPlanta] = useState('');

  // Edit States
  const [editName, setEditName] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editPlants, setEditPlants] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editCrop, setEditCrop] = useState('');

  const commonCrops = ['Café', 'Plátano', 'Banano', 'Otro'];

  // --- CROP SPECIFIC CONFIGURATION HELPER ---
  const getCropSpecs = (crop: string) => {
      const isMusaceae = crop === 'Plátano' || crop === 'Banano';
      
      if (isMusaceae) {
        return {
          label: 'Sitios / Plantas',
          densityLow: 1000,
          densityHigh: 3000, // Monocultivo alta densidad
          productionAge: 9, // Meses aprox para racimo/bellota
          densityUnit: 'Sitios/Ha'
        };
      }
      // Default (Coffee and others)
      return {
        label: 'Árboles',
        densityLow: 4000,
        densityHigh: 8000,
        productionAge: 18,
        densityUnit: 'Árb/Ha'
      };
  };

  const currentSpecs = getCropSpecs(loteCrop);

  // Density Calc for Creation
  const calculatedDensityPerHa = useMemo(() => {
      const s = parseFloat(distSurco);
      const p = parseFloat(distPlanta);
      if (s > 0 && p > 0) return Math.round(10000 / (s * p));
      return 0;
  }, [distSurco, distPlanta]);

  useEffect(() => {
      const a = parseFloat(loteArea);
      if (calculatedDensityPerHa > 0 && a > 0) {
          const plants = Math.round(calculatedDensityPerHa * a);
          setLotePlants(plants.toString());
      }
  }, [calculatedDensityPerHa, loteArea]);

  // --- LOGIC: AUTO STAGE SELECTION BASED ON CROP TYPE AND AGE ---
  useEffect(() => {
      const age = parseInt(loteCropAge) || 0;
      if (loteCropAge !== '') {
          if (age < currentSpecs.productionAge) {
              setLoteStage('Levante');
          } else {
              setLoteStage('Produccion');
          }
      }
  }, [loteCropAge, currentSpecs]);

  const displayDensity = calculatedDensityPerHa > 0 
      ? calculatedDensityPerHa 
      : (parseFloat(lotePlants) > 0 && parseFloat(loteArea) > 0 ? parseFloat(lotePlants) / parseFloat(loteArea) : 0);

  // --- MUSACEAE LOGIC (Applicable for Main or Associated) ---
  const getMusaceaeStage = (crop: string, ageStr: string) => {
      if (crop !== 'Plátano' && crop !== 'Banano') return null;
      const age = parseInt(ageStr) || 0;
      if (age <= 6) return { label: 'Vegetativo (Hojas)', color: 'text-blue-400', icon: Sprout };
      if (age <= 9) return { label: 'Diferenciación (Bellota)', color: 'text-purple-400', icon: Flower2 };
      return { label: 'Producción (Racimo)', color: 'text-emerald-400', icon: TreePine };
  };

  const mainCropMusaceaeStage = useMemo(() => getMusaceaeStage(loteCrop, loteCropAge), [loteCrop, loteCropAge]);
  const assocCropMusaceaeStage = useMemo(() => getMusaceaeStage(associatedCrop, associatedCropAge), [associatedCrop, associatedCropAge]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loteName.trim()) return;
    
    // Determine final associated crop name
    let finalAssociatedName = associatedCrop;
    if (associatedCrop === 'Otro') finalAssociatedName = associatedCropName;
    if (!associatedCrop) finalAssociatedName = '';

    onAddCostCenter(
        loteName, 
        loteBudget ? parseNumberInput(loteBudget) : 0,
        loteArea ? parseFloat(loteArea) : undefined,
        loteStage,
        lotePlants ? parseInt(lotePlants) : undefined,
        loteCrop,
        finalAssociatedName || undefined,
        loteCropAge ? parseInt(loteCropAge) : undefined,
        associatedCropDensity ? parseInt(associatedCropDensity) : undefined,
        associatedCropAge ? parseInt(associatedCropAge) : undefined
    );
    // Reset and close
    setLoteName(''); setLoteBudget(''); setLoteArea(''); setLotePlants(''); 
    setAssociatedCrop(''); setAssociatedCropName(''); setAssociatedCropAge(''); setAssociatedCropDensity('');
    setDistSurco(''); setDistPlanta(''); setLoteCropAge('');
    setShowCreateModal(false);
  };

  // --- DERIVED DATA LOGIC ---
  const lotHistory = useMemo(() => {
    if (!selectedLot) return [];
    
    const labor = laborLogs
        .filter(l => l.costCenterId === selectedLot.id)
        .map(l => ({ type: 'LABOR', date: l.date, title: l.activityName, value: l.value, icon: Pickaxe, color: 'text-amber-500' }));
    
    // ENHANCED INPUTS WITH DOSAGE CALCULATION
    const inputs = movements
        .filter(m => m.costCenterId === selectedLot.id && m.type === 'OUT')
        .map(m => {
            let details = `Aplicación ${m.itemName}`;
            const plants = selectedLot.plantCount || 0;
            
            if (plants > 0) {
                // Normalize quantity to base unit (grams or ml)
                const baseQty = convertToBase(m.quantity, m.unit);
                const dosePerPlant = baseQty / plants;
                
                // Determine unit string for display
                let doseUnit = 'g';
                if (m.unit.includes('L') || m.unit.includes('Gal') || m.unit.includes('ml')) {
                    doseUnit = 'ml';
                } else if (m.unit === 'Unidad') {
                    doseUnit = 'ud';
                }

                details += ` • Dosis: ${dosePerPlant.toFixed(1)} ${doseUnit}/planta`;
            }

            return { 
                type: 'INPUT', 
                date: m.date, 
                title: details, 
                value: m.calculatedCost, 
                icon: Droplets, 
                color: 'text-blue-500' 
            };
        });
    
    const sales = harvests
        .filter(h => h.costCenterId === selectedLot.id)
        .map(h => ({ type: 'HARVEST', date: h.date, title: `Cosecha ${h.quantity} ${h.unit}`, value: h.totalValue, icon: Target, color: 'text-emerald-500' }));

    return [...labor, ...inputs, ...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedLot, laborLogs, movements, harvests]);

  const lotMetrics = useMemo(() => {
      if (!selectedLot) return { yield: 0, cost: 0, unitCost: 0 };
      const totalCost = laborLogs.filter(l => l.costCenterId === selectedLot.id).reduce((a,b)=>a+b.value,0) + 
                        movements.filter(m => m.costCenterId === selectedLot.id && m.type === 'OUT').reduce((a,b)=>a+b.calculatedCost,0);
      const totalYield = harvests.filter(h => h.costCenterId === selectedLot.id).reduce((a,b)=>a+b.quantity,0);
      
      const unitCost = totalYield > 0 ? totalCost / totalYield : 0;

      return { yield: totalYield, cost: totalCost, unitCost };
  }, [selectedLot, laborLogs, movements, harvests]);

  const handleOpenLot = (lot: CostCenter) => {
      setSelectedLot(lot);
      setEditName(lot.name);
      setEditArea(lot.area.toString());
      setEditPlants(lot.plantCount?.toString() || '0');
      setEditAge(lot.cropAgeMonths?.toString() || '0');
      setEditCrop(lot.cropType);
      setIsEditing(false);
  };

  const handleSaveChanges = () => {
      if (!selectedLot) return;
      
      const newAge = parseInt(editAge) || 0;
      // Recalculate stage on edit based on crop type of the lot
      const specs = getCropSpecs(editCrop);
      let newStage = selectedLot.stage;
      
      if (newAge < specs.productionAge) newStage = 'Levante';
      else if (newAge >= specs.productionAge && selectedLot.stage !== 'Infraestructura') newStage = 'Produccion';

      const updatedLot: CostCenter = {
          ...selectedLot,
          name: editName,
          area: parseFloat(editArea),
          plantCount: parseInt(editPlants),
          cropAgeMonths: newAge,
          stage: newStage,
          cropType: editCrop,
      };
      onUpdateLot(updatedLot);
      setSelectedLot(updatedLot);
      setIsEditing(false);
  };

  const handleDelete = () => {
      if (!selectedLot) return;
      onDeleteCostCenter(selectedLot.id);
      setSelectedLot(null);
  };

  const handleRenovation = (type: 'ZOCA' | 'SIEMBRA') => {
      if (!selectedLot) return;
      const newLot: CostCenter = {
          ...selectedLot,
          stage: 'Levante', 
          cropAgeMonths: 0, 
          activationDate: undefined, 
          accumulatedCapex: 0, 
      };
      if (type === 'SIEMBRA') {
          newLot.plantCount = parseInt(editPlants); 
          newLot.cropType = editCrop;
      } 
      onUpdateLot(newLot);
      setSelectedLot(newLot);
      setShowRenovateModal(false);
      alert(`Lote renovado por ${type}. El estado ha cambiado a LEVANTE.`);
  };

  const currentDensity = (selectedLot?.plantCount || 0) / (selectedLot?.area || 1);
  const projectedDensity = (parseInt(editPlants) || 0) / (parseFloat(editArea) || 1);

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      <HeaderCard 
        title="Gestión Integral de Lotes"
        subtitle="Gemelo Digital de Campo"
        valueLabel="Área Total Finca"
        value={`${costCenters.reduce((a,b)=>a+b.area,0).toFixed(1)} Ha`}
        gradientClass="bg-gradient-to-r from-emerald-800 to-slate-900"
        icon={MapPin}
        onAction={() => setShowCreateModal(true)}
        actionLabel="Nuevo Lote"
        actionIcon={Plus}
        actionColorClass="bg-emerald-500 text-white hover:bg-emerald-400"
        secondaryAction={
            <div className="flex gap-2">
                <button onClick={() => generateFarmStructurePDF(costCenters)} className="p-3 bg-white/20 hover:bg-white/30 rounded-xl text-white backdrop-blur-md transition-all shadow-lg active:scale-95" title="Descargar Estructura (PDF)"><FileText className="w-5 h-5" /></button>
                <button onClick={() => generateFarmStructureExcel(costCenters)} className="p-3 bg-white/20 hover:bg-white/30 rounded-xl text-white backdrop-blur-md transition-all shadow-lg active:scale-95" title="Descargar Estructura (Excel)"><FileSpreadsheet className="w-5 h-5" /></button>
            </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button onClick={() => setShowCreateModal(true)} className="bg-slate-100 dark:bg-slate-900/50 p-5 rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-2 group hover:border-emerald-500 transition-all min-h-[140px]">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm group-hover:scale-110 transition-transform"><Plus className="w-6 h-6 text-emerald-500" /></div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-emerald-500">Crear Lote</p>
          </button>

          {costCenters.map(lot => {
              const density = (lot.plantCount || 0) / (lot.area || 1);
              const age = lot.cropAgeMonths || 0;
              const isLevante = lot.stage === 'Levante';
              const specs = getCropSpecs(lot.cropType);
              
              let needsRenovation = false;
              let renovationReason = '';
              // Logic Adjusted for crop type
              if (density > specs.densityHigh && age > 60) { needsRenovation = true; renovationReason = 'Cierre Calles (Alta Densidad)'; } 
              else if (age > (specs.productionAge + 72)) { needsRenovation = true; renovationReason = 'Cultivo Envejecido'; } // ~6-7 years productive

              return (
                  <div key={lot.id} onClick={() => handleOpenLot(lot)} className={`bg-white dark:bg-slate-800 p-5 rounded-[2rem] border transition-all cursor-pointer hover:shadow-xl active:scale-95 group relative overflow-hidden ${needsRenovation ? 'border-amber-500/50 dark:border-amber-500/50' : isLevante ? 'border-blue-500/30' : 'border-slate-200 dark:border-slate-700'}`}>
                      {needsRenovation && <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase flex items-center gap-1 z-10"><Clock className="w-3 h-3" /> Renovación Sugerida</div>}
                      <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md ${isLevante ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'}`}>{isLevante ? <Sprout className="w-5 h-5" /> : <TreePine className="w-5 h-5" />}</div>
                              <div>
                                  <h4 className="font-black text-slate-800 dark:text-white text-sm">{lot.name}</h4>
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${isLevante ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>{lot.stage}</span>
                              </div>
                          </div>
                          {!needsRenovation && <MoreHorizontal className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white" />}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                          <div><span className="block text-[8px]">{lot.cropType}</span><span className={`text-sm ${needsRenovation ? 'text-amber-500' : 'text-slate-800 dark:text-white'}`}>{age} Meses</span></div>
                          <div><span className="block text-[8px]">{specs.label}</span><span className="text-slate-800 dark:text-white text-sm">{lot.plantCount?.toLocaleString()}</span></div>
                      </div>
                      {needsRenovation && <div className="mt-2 text-[9px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg flex items-center gap-2"><AlertCircle className="w-3 h-3" /> {renovationReason}</div>}
                  </div>
              );
          })}
      </div>

      {/* CREATE MODAL */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Crear Nuevo Lote" icon={Plus} maxWidth="max-w-xl">
          <form onSubmit={handleCreateSubmit} className="space-y-4">
              
              <div className="bg-slate-950 p-5 rounded-[2rem] border border-slate-800 space-y-4 shadow-inner">
                  <h5 className="text-[10px] font-black text-indigo-400 uppercase flex items-center gap-2 tracking-widest"><Sun className="w-3 h-3"/> Arreglo Espacial (Principal)</h5>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Dist. Surco (m)</label>
                          <input type="number" step="0.01" value={distSurco} onChange={e => setDistSurco(e.target.value)} placeholder="Ej: 1.5" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Dist. Planta (m)</label>
                          <input type="number" step="0.01" value={distPlanta} onChange={e => setDistPlanta(e.target.value)} placeholder="Ej: 1.0" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none" />
                      </div>
                  </div>
                  {displayDensity > 0 && (
                      <div className={`p-4 rounded-2xl border flex items-start gap-4 transition-all ${displayDensity < currentSpecs.densityLow ? 'bg-red-950/20 border-red-500/30' : displayDensity > currentSpecs.densityHigh ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-emerald-950/20 border-emerald-500/30'}`}>
                          <div className={`p-2 rounded-xl ${displayDensity < currentSpecs.densityLow ? 'bg-red-600' : displayDensity > currentSpecs.densityHigh ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                              {displayDensity < currentSpecs.densityLow ? <AlertTriangle className="w-5 h-5 text-white" /> : displayDensity > currentSpecs.densityHigh ? <Zap className="w-5 h-5 text-white" /> : <ShieldCheck className="w-5 h-5 text-white" />}
                          </div>
                          <div>
                              <p className={`text-[10px] font-black uppercase ${displayDensity < currentSpecs.densityLow ? 'text-red-400' : displayDensity > currentSpecs.densityHigh ? 'text-indigo-400' : 'text-emerald-400'}`}>Densidad: {displayDensity.toLocaleString(undefined, {maximumFractionDigits: 0})} {currentSpecs.densityUnit}</p>
                              <p className="text-[9px] text-slate-400 leading-tight mt-1">{displayDensity < currentSpecs.densityLow ? 'Baja densidad. Desaprovechamiento de área.' : displayDensity > currentSpecs.densityHigh ? 'Alta densidad. Ciclo productivo acelerado.' : 'Densidad óptima para el cultivo.'}</p>
                          </div>
                      </div>
                  )}
              </div>

              <input type="text" value={loteName} onChange={e => setLoteName(e.target.value)} placeholder="Nombre del Lote (Ej: La Ladera)" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" required />
              <input type="text" inputMode="decimal" value={loteBudget} onChange={e => setLoteBudget(formatNumberInput(e.target.value))} placeholder="Presupuesto Anual ($)" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase ml-1">Área (Hectáreas)</label><input type="number" value={loteArea} onChange={e => setLoteArea(e.target.value)} placeholder="0.0" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" /></div>
                <div className="space-y-1"><label className="text-[9px] font-black text-indigo-400 uppercase ml-1">Población ({currentSpecs.label})</label><input type="number" value={lotePlants} onChange={e => setLotePlants(e.target.value)} className="w-full bg-slate-950 border border-indigo-500/30 rounded-xl p-3 text-sm text-indigo-400 font-bold" readOnly={calculatedDensityPerHa > 0} placeholder="Calculado..." /></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Cultivo Principal</label>
                    <select value={loteCrop} onChange={e => setLoteCrop(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white">
                        {commonCrops.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase ml-1">Edad Cultivo (Meses)</label><input type="number" value={loteCropAge} onChange={e => setLoteCropAge(e.target.value)} placeholder="Ej: 24" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" /></div>
              </div>
              
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-700"><div className="flex justify-between items-center"><span className="text-[10px] text-slate-400 font-black uppercase">Etapa Automática</span><span className={`text-xs font-black px-2 py-1 rounded-lg uppercase ${loteStage === 'Levante' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>{loteStage}</span></div><p className="text-[9px] text-slate-500 mt-1">{parseInt(loteCropAge) < currentSpecs.productionAge ? `Menor a ${currentSpecs.productionAge} meses: Etapa de Inversión.` : `Mayor a ${currentSpecs.productionAge} meses: Etapa Productiva.`}</p></div>
              
              {/* DISPLAY MAIN CROP PHYSIOLOGY IF MUSACEAE */}
              {mainCropMusaceaeStage && (
                  <div className="bg-indigo-950/20 p-3 rounded-xl border border-indigo-900/50 flex items-center gap-3 animate-slide-up">
                      <div className={`p-2 rounded-lg bg-slate-900 ${mainCropMusaceaeStage.color}`}><mainCropMusaceaeStage.icon className="w-4 h-4" /></div>
                      <div>
                          <p className={`text-[10px] font-black uppercase ${mainCropMusaceaeStage.color}`}>{mainCropMusaceaeStage.label}</p>
                          <p className="text-[9px] text-slate-500">Ciclo fenológico principal</p>
                      </div>
                  </div>
              )}

              {/* --- ASSOCIATED CROP SECTION --- */}
              <div className="space-y-2 border-t border-slate-800 pt-4">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-1 flex items-center gap-2"><Leaf className="w-3 h-3"/> Cultivo Asociado (Sombra/Intercalado)</label>
                  <select value={associatedCrop} onChange={e => setAssociatedCrop(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white">
                      <option value="">Ninguno</option>
                      <option value="Plátano">Plátano</option>
                      <option value="Banano">Banano</option>
                      <option value="Café">Café</option>
                      <option value="Otro">Otro (Maíz, Frijol, etc)</option>
                  </select>

                  {/* LOGIC FOR ASSOCIATED MUSACEAE */}
                  {assocCropMusaceaeStage && (
                      <div className="bg-emerald-950/20 p-4 rounded-2xl border border-emerald-900/50 space-y-3 animate-slide-up">
                          <h6 className="text-[10px] font-black text-emerald-500 uppercase">Fisiología Vegetal ({associatedCrop})</h6>
                          <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-500 uppercase">Edad (Meses)</label>
                                  <input type="number" value={associatedCropAge} onChange={e => setAssociatedCropAge(e.target.value)} placeholder="0" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold" />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-500 uppercase">Densidad (Sitios/Ha)</label>
                                  <input type="number" value={associatedCropDensity} onChange={e => setAssociatedCropDensity(e.target.value)} placeholder="Ej: 250" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold" />
                              </div>
                          </div>
                          <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/50 flex items-center gap-3">
                              <div className={`p-2 rounded-lg bg-slate-900 ${assocCropMusaceaeStage.color}`}><assocCropMusaceaeStage.icon className="w-4 h-4" /></div>
                              <div>
                                  <p className={`text-[10px] font-black uppercase ${assocCropMusaceaeStage.color}`}>{assocCropMusaceaeStage.label}</p>
                                  <p className="text-[9px] text-slate-500">Ciclo fenológico asociado</p>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* LOGIC FOR 'CAFÉ' ASSOCIATED OR 'OTRO' */}
                  {(associatedCrop === 'Otro' || associatedCrop === 'Café') && (
                      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3 animate-slide-up">
                          <h6 className="text-[10px] font-black text-slate-400 uppercase">Detalles Cultivo Asociado</h6>
                          {associatedCrop === 'Otro' && (
                              <input type="text" value={associatedCropName} onChange={e => setAssociatedCropName(e.target.value)} placeholder="Especifique Nombre (Ej: Maíz)" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold" />
                          )}
                          <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-500 uppercase">Edad (Meses)</label>
                                  <input type="number" value={associatedCropAge} onChange={e => setAssociatedCropAge(e.target.value)} placeholder="0" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold" />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black text-slate-500 uppercase">Densidad ({associatedCrop === 'Café' ? 'Árb' : 'Sit'}/Ha)</label>
                                  <input type="number" value={associatedCropDensity} onChange={e => setAssociatedCropDensity(e.target.value)} placeholder="0" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold" />
                              </div>
                          </div>
                      </div>
                  )}
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl text-xs uppercase shadow-xl transition-all active:scale-95">Integrar Lote al Mapa</button>
          </form>
      </Modal>

      {/* DETAIL MODAL (Existing) */}
      <Modal isOpen={!!selectedLot} onClose={() => setSelectedLot(null)} title={selectedLot?.name || 'Detalle Lote'} icon={MapPin} maxWidth="max-w-4xl">
          {selectedLot && (
              <div className="flex flex-col md:flex-row gap-6 h-full">
                  <div className="w-full md:w-1/3 space-y-6">
                      <div className="bg-slate-900 p-5 rounded-3xl border border-slate-700 relative overflow-hidden">
                          <div className="relative z-10 space-y-4">
                              <div className="flex justify-between items-center">
                                  <h4 className="text-white font-black text-sm uppercase flex items-center gap-2"><Ruler className="w-4 h-4 text-indigo-400"/> Estructura</h4>
                                  <div className="flex gap-2">
                                      <button onClick={() => isEditing ? handleSaveChanges() : setIsEditing(true)} className={`p-2 rounded-xl transition-all ${isEditing ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{isEditing ? <Save className="w-4 h-4" /> : <Pickaxe className="w-4 h-4" />}</button>
                                      <button onClick={handleDelete} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                              </div>
                              <div className="space-y-3">
                                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase">Nombre Lote</label><input disabled={!isEditing} value={editName} onChange={e=>setEditName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold disabled:opacity-50" /></div>
                                  <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase">Área (Ha)</label><input disabled={!isEditing} type="number" value={editArea} onChange={e=>setEditArea(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold disabled:opacity-50" /></div>
                                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase">Población</label><input disabled={!isEditing} type="number" value={editPlants} onChange={e=>setEditPlants(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold disabled:opacity-50" /></div>
                                  </div>
                                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase">Densidad (Calc)</label><div className={`w-full p-2 rounded-lg text-xs font-black border ${isEditing ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-950 border-slate-800 text-emerald-400'}`}>{isEditing ? projectedDensity.toFixed(0) : currentDensity.toFixed(0)}</div></div>
                                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase">Edad (Meses)</label><input disabled={!isEditing} type="number" value={editAge} onChange={e=>setEditAge(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold disabled:opacity-50" /></div>
                              </div>
                          </div>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800">
                          <h4 className="text-slate-500 font-black text-xs uppercase mb-3 flex items-center gap-2"><Scissors className="w-4 h-4"/> Ciclo de Vida</h4>
                          <button onClick={() => setShowRenovateModal(true)} className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"><Sprout className="w-4 h-4" /> Renovar Lote</button>
                      </div>
                  </div>
                  <div className="w-full md:w-2/3 flex flex-col gap-6">
                      <div className="grid grid-cols-3 gap-4">
                          <div className="bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-2xl"><p className="text-[10px] font-black text-emerald-600 uppercase">Producción Histórica</p><p className="text-xl font-mono font-black text-emerald-500">{formatNumberInput(lotMetrics.yield)} {selectedLot.cropType === 'Café' ? 'Kg' : 'Und'}</p></div>
                          <div className="bg-red-900/10 border border-red-500/20 p-4 rounded-2xl"><p className="text-[10px] font-black text-red-600 uppercase">Costo Acumulado</p><p className="text-xl font-mono font-black text-red-500">{formatCurrency(lotMetrics.cost)}</p></div>
                          <div className={`bg-blue-900/10 border border-blue-500/20 p-4 rounded-2xl ${lotMetrics.yield === 0 ? 'opacity-50' : ''}`}>
                              <p className="text-[10px] font-black text-blue-600 uppercase">Costo Unitario Real</p>
                              <p className="text-xl font-mono font-black text-blue-500">
                                  {lotMetrics.yield > 0 ? `${formatCurrency(lotMetrics.unitCost)}` : 'Sin Cosecha'} 
                                  {lotMetrics.yield > 0 && <span className="text-[10px] ml-1">/ {selectedLot.cropType === 'Café' ? 'Kg' : 'Ud'}</span>}
                              </p>
                          </div>
                      </div>
                      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col">
                          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
                              <h4 className="font-black text-slate-700 dark:text-white text-sm uppercase flex items-center gap-2"><History className="w-4 h-4 text-indigo-500" /> Bitácora de Campo</h4>
                              <span className="text-[9px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-full">{lotHistory.length} Eventos</span>
                          </div>
                          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 max-h-80">
                              {lotHistory.length === 0 ? (<EmptyState icon={Leaf} message="Sin registros en este lote" />) : (lotHistory.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                      <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-900 ${item.color}`}><item.icon className="w-4 h-4" /></div>
                                      <div className="flex-1"><p className="text-xs font-bold text-slate-800 dark:text-white">{item.title}</p><p className="text-[9px] text-slate-400 uppercase font-bold">{new Date(item.date).toLocaleDateString()}</p></div>
                                      <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">{formatCurrency(item.value)}</p>
                                  </div>
                              )))}
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                          <button className="py-3 rounded-xl border border-dashed border-slate-400 text-slate-500 hover:text-indigo-500 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-xs font-black uppercase flex items-center justify-center gap-2"><Calendar className="w-4 h-4" /> Programar Labor</button>
                          <button className="py-3 rounded-xl border border-dashed border-slate-400 text-slate-500 hover:text-emerald-500 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all text-xs font-black uppercase flex items-center justify-center gap-2"><Droplets className="w-4 h-4" /> Aplicar Insumo</button>
                      </div>
                  </div>
              </div>
          )}
      </Modal>

      {/* MODAL DE RENOVACIÓN */}
      <Modal isOpen={showRenovateModal} onClose={() => setShowRenovateModal(false)} title="Renovación de Lote" icon={Sprout}>
          <div className="space-y-6">
              <div className="bg-amber-100 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
                  <p className="font-bold flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4"/> Advertencia</p>
                  <p>Renovar el lote reiniciará su <strong>Edad a 0 meses</strong> y cambiará la etapa a <strong>Levante</strong>. El historial financiero se mantiene, pero se inicia un nuevo ciclo de inversión (CAPEX).</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => handleRenovation('ZOCA')} className="bg-slate-800 hover:bg-slate-700 p-5 rounded-2xl border border-slate-600 text-center group active:scale-95 transition-all"><Scissors className="w-8 h-8 text-amber-500 mx-auto mb-2 group-hover:scale-110 transition-transform" /><p className="text-white font-black uppercase text-sm">Por Zoca</p><p className="text-[9px] text-slate-400 mt-1">Mantiene densidad y variedad. Menor costo.</p></button>
                  <button onClick={() => handleRenovation('SIEMBRA')} className="bg-slate-800 hover:bg-slate-700 p-5 rounded-2xl border border-slate-600 text-center group active:scale-95 transition-all"><Sprout className="w-8 h-8 text-emerald-500 mx-auto mb-2 group-hover:scale-110 transition-transform" /><p className="text-white font-black uppercase text-sm">Siembra Nueva</p><p className="text-[9px] text-slate-400 mt-1">Permite cambiar densidad y variedad. Mayor inversión.</p></button>
              </div>
          </div>
      </Modal>
    </div>
  );
};
