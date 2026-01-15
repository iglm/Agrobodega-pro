
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { InventoryItem, Unit, Movement, Supplier, CostCenter, Personnel, Machine, Category } from '../types';
import { getBaseUnitType, convertToBase, formatBaseQuantity, formatCurrency, formatNumberInput, parseNumberInput } from '../services/inventoryService';
import { storageAdapter } from '../services/storageAdapter';
import { SecureImage } from './SecureImage';
import { X, TrendingUp, TrendingDown, DollarSign, FileText, AlertTriangle, Users, MapPin, Calculator, Camera, Plus, Save, Loader2, Info, RefreshCw } from 'lucide-react';

interface MovementModalProps {
  item: InventoryItem;
  type: 'IN' | 'OUT';
  suppliers: Supplier[];
  costCenters: CostCenter[];
  personnel: Personnel[];
  machines?: Machine[];
  onSave: (movement: Omit<Movement, 'id' | 'warehouseId' | 'date' | 'calculatedCost'>, newPrice?: number, newExpiration?: string) => void;
  onCancel: () => void;
  onAddSupplier: (name: string) => void;
  onAddCostCenter: (name: string) => void;
  onAddPersonnel: (name: string) => void;
}

export const MovementModal: React.FC<MovementModalProps> = ({ 
  item, type, suppliers, costCenters, personnel, machines = [], 
  onSave, onCancel, onAddSupplier, onAddCostCenter, onAddPersonnel 
}) => {
  // Estado Básico
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<Unit>(item.lastPurchaseUnit || (item.baseUnit === 'g' ? Unit.KILO : item.baseUnit === 'ml' ? Unit.LITRO : Unit.UNIDAD));
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  
  // Estado Entrada (Compra)
  const [price, setPrice] = useState(''); // Puede ser unitario o total dependiendo de isTotalPrice
  const [isTotalPrice, setIsTotalPrice] = useState(false); // UX: Toggle para evitar errores de cálculo mental
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceImage, setInvoiceImage] = useState<string | undefined>(undefined);
  const [expirationDate, setExpirationDate] = useState(item.expirationDate || '');
  const [isProcessingImg, setIsProcessingImg] = useState(false);

  // Estado Salida (Consumo)
  const [costCenterId, setCostCenterId] = useState('');
  const [personnelId, setPersonnelId] = useState('');
  const [activityType, setActivityType] = useState<'Aplicación' | 'Venta' | 'Pérdida' | 'Préstamo'>('Aplicación');

  // Estados de Creación Rápida
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  
  const [isCreatingLot, setIsCreatingLot] = useState(false);
  const [newLotName, setNewLotName] = useState('');

  const [isCreatingPerson, setIsCreatingPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- LÓGICA MATEMÁTICA DE COSTOS ---
  const calculation = useMemo(() => {
      const qtyVal = parseNumberInput(quantity);
      if (qtyVal <= 0) return { total: 0, unitCost: 0, breakdown: '' };

      if (type === 'IN') {
          const priceVal = parseNumberInput(price);
          
          if (isTotalPrice) {
              // Si el usuario ingresa el total, calculamos el unitario
              const calculatedUnit = priceVal / qtyVal;
              return { 
                  total: priceVal, 
                  unitCost: calculatedUnit, 
                  breakdown: `Ingresado Total: ${formatCurrency(priceVal)}` 
              };
          } else {
              // Si el usuario ingresa el unitario (default)
              return { 
                  total: priceVal * qtyVal, 
                  unitCost: priceVal, 
                  breakdown: `Compra: ${qtyVal} ${unit} a ${formatCurrency(priceVal)} c/u` 
              };
          }
      } else {
          // En salida, el costo se deriva del CPP (Costo Promedio Ponderado)
          const baseQtyPerUnit = convertToBase(1, unit); 
          const costPerSelectedUnit = item.averageCost * baseQtyPerUnit;
          const totalCost = costPerSelectedUnit * qtyVal;

          return { 
              total: totalCost, 
              unitCost: costPerSelectedUnit,
              breakdown: `1 ${unit} = ${formatCurrency(costPerSelectedUnit)} (CPP)`
          };
      }
  }, [quantity, unit, price, type, item.averageCost, isTotalPrice]);

  // Manejadores de Creación Rápida
  const handleCreateSupplier = (e: React.MouseEvent) => {
      e.preventDefault();
      if(newSupplierName.trim()) { onAddSupplier(newSupplierName); setIsCreatingSupplier(false); setNewSupplierName(''); }
  };
  const handleCreateLot = (e: React.MouseEvent) => {
      e.preventDefault();
      if(newLotName.trim()) { onAddCostCenter(newLotName); setIsCreatingLot(false); setNewLotName(''); }
  };
  const handleCreatePerson = (e: React.MouseEvent) => {
      e.preventDefault();
      if(newPersonName.trim()) { onAddPersonnel(newPersonName); setIsCreatingPerson(false); setNewPersonName(''); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setIsProcessingImg(true);
          try {
              const id = await storageAdapter.saveImage(e.target.files[0]);
              setInvoiceImage(id);
          } catch (err) {
              alert("Error al guardar imagen. Espacio insuficiente.");
          } finally {
              setIsProcessingImg(false);
          }
      }
  };

  const handleSubmit = () => {
      const qtyVal = parseNumberInput(quantity);
      if (qtyVal <= 0) return;

      const movementData: any = {
          itemId: item.id,
          itemName: item.name,
          type,
          quantity: qtyVal,
          unit,
          notes: notes.trim()
      };

      if (type === 'IN') {
          movementData.supplierId = supplierId;
          movementData.supplierName = suppliers.find(s => s.id === supplierId)?.name;
          movementData.invoiceNumber = invoiceNumber;
          movementData.invoiceImage = invoiceImage;
          
          // CRÍTICO: Asegurar que pasamos el precio UNITARIO al sistema
          const rawPrice = parseNumberInput(price);
          const finalUnitPrice = isTotalPrice ? (rawPrice / qtyVal) : rawPrice;
          
          onSave(movementData, finalUnitPrice, expirationDate || undefined);
      } else {
          movementData.costCenterId = costCenterId;
          movementData.costCenterName = costCenters.find(c => c.id === costCenterId)?.name;
          movementData.personnelId = personnelId;
          movementData.personnelName = personnel.find(p => p.id === personnelId)?.name;
          onSave(movementData);
      }
  };

  const availableUnits = Object.values(Unit).filter(u => getBaseUnitType(u) === item.baseUnit);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
      <div className={`w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[95vh] ${type === 'IN' ? 'bg-emerald-900/20 border-2 border-emerald-500/50' : 'bg-red-900/20 border-2 border-red-500/50'}`}>
        
        {/* Header */}
        <div className={`p-6 flex justify-between items-center ${type === 'IN' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                    {type === 'IN' ? <TrendingUp className="w-6 h-6 text-white" /> : <TrendingDown className="w-6 h-6 text-white" />}
                </div>
                <div>
                    <h3 className="text-white font-black text-xl uppercase tracking-tight">{type === 'IN' ? 'Entrada Bodega' : 'Salida Bodega'}</h3>
                    <p className="text-white/80 text-xs font-bold">{item.name}</p>
                </div>
            </div>
            <button onClick={onCancel} className="bg-black/20 hover:bg-black/40 p-2 rounded-full text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-900 p-6 space-y-6 custom-scrollbar">
            
            {/* CANTIDAD Y UNIDAD */}
            <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Cantidad</label>
                    <input type="text" inputMode="decimal" value={quantity} onChange={e => setQuantity(formatNumberInput(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white text-2xl font-black focus:border-emerald-500 outline-none" placeholder="0" autoFocus />
                </div>
                <div className="w-1/3 space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Unidad</label>
                    <select value={unit} onChange={e => setUnit(e.target.value as Unit)} className="w-full h-[66px] bg-slate-800 border border-slate-700 rounded-2xl px-2 text-white text-xs font-bold outline-none">
                        {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </div>
            </div>

            {/* SECCIÓN ESPECÍFICA: ENTRADA vs SALIDA */}
            {type === 'IN' ? (
                <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                        <div className="flex justify-between items-center ml-2 mb-1">
                            <label className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1">
                                <DollarSign className="w-3 h-3"/> 
                                {isTotalPrice ? "Precio TOTAL Factura" : `Precio Unitario (Por ${unit})`}
                            </label>
                            <button 
                                type="button" 
                                onClick={() => setIsTotalPrice(!isTotalPrice)}
                                className="text-[9px] font-bold text-indigo-400 hover:text-white uppercase flex items-center gap-1 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/30 transition-all active:scale-95"
                            >
                                <RefreshCw className="w-3 h-3" />
                                {isTotalPrice ? "Cambiar a Unitario" : "Ingresar Total"}
                            </button>
                        </div>
                        <input 
                            type="text" 
                            inputMode="decimal" 
                            value={price} 
                            onChange={e => setPrice(formatNumberInput(e.target.value))} 
                            className={`w-full bg-slate-800 border rounded-2xl p-4 text-emerald-400 text-xl font-mono font-black outline-none transition-all ${isTotalPrice ? 'border-indigo-500/50 focus:ring-2 focus:ring-indigo-500' : 'border-emerald-500/30 focus:ring-2 focus:ring-emerald-500'}`} 
                            placeholder="$ 0" 
                        />
                        {isTotalPrice && calculation.unitCost > 0 && (
                            <div className="bg-slate-800/80 p-3 rounded-xl border border-indigo-500/30 flex items-center justify-between animate-fade-in">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Costo Unitario Calculado:</span>
                                <span className="text-sm font-black text-white font-mono">{formatCurrency(calculation.unitCost)} / {unit}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><Users className="w-3 h-3"/> Proveedor</label>
                            <button onClick={() => setIsCreatingSupplier(!isCreatingSupplier)} className="text-[10px] text-indigo-400 font-bold uppercase">{isCreatingSupplier ? 'Cancelar' : '+ Nuevo'}</button>
                        </div>
                        {isCreatingSupplier ? (
                            <div className="flex gap-2">
                                <input type="text" value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} placeholder="Nombre Proveedor" className="flex-1 bg-slate-800 border border-indigo-500 rounded-xl p-3 text-white text-sm" />
                                <button onClick={handleCreateSupplier} disabled={!newSupplierName} className="bg-indigo-600 text-white p-3 rounded-xl"><Save className="w-4 h-4"/></button>
                            </div>
                        ) : (
                            <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm font-bold">
                                <option value="">Seleccionar Proveedor...</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-2">N° Factura</label>
                            <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Foto Factura</label>
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full bg-slate-800 border border-dashed border-slate-600 hover:border-emerald-500 text-slate-400 hover:text-emerald-500 rounded-xl p-2.5 flex items-center justify-center gap-2 transition-all">
                                {isProcessingImg ? <Loader2 className="w-4 h-4 animate-spin"/> : invoiceImage ? <span className="text-emerald-500 font-bold text-xs">¡Foto Cargada!</span> : <><Camera className="w-4 h-4"/> <span className="text-xs font-bold">Subir</span></>}
                            </button>
                            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 animate-fade-in">
                    {/* INFO MATEMÁTICA SOLICITADA */}
                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-indigo-400 border-b border-slate-700 pb-2 mb-1">
                            <Calculator className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Desglose de Costo (CPP)</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-400">
                            <span>Valor 1 {unit}:</span>
                            <span className="font-mono font-bold text-white">{formatCurrency(calculation.unitCost)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-400">
                            <span>Valor {item.baseUnit==='g'?'Gramo': item.baseUnit==='ml'?'Ml':'Unidad'} Base:</span>
                            <span className="font-mono font-bold text-white">{formatCurrency(item.averageCost, 2)}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-700 flex justify-between items-center">
                            <span className="text-[10px] font-black text-red-400 uppercase">Costo Total Salida</span>
                            <span className="text-xl font-mono font-black text-red-500">{formatCurrency(calculation.total)}</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><MapPin className="w-3 h-3"/> Lote Destino</label>
                            <button onClick={() => setIsCreatingLot(!isCreatingLot)} className="text-[10px] text-indigo-400 font-bold uppercase">{isCreatingLot ? 'Cancelar' : '+ Nuevo'}</button>
                        </div>
                        {isCreatingLot ? (
                            <div className="flex gap-2">
                                <input type="text" value={newLotName} onChange={e => setNewLotName(e.target.value)} placeholder="Nombre Lote" className="flex-1 bg-slate-800 border border-indigo-500 rounded-xl p-3 text-white text-sm" />
                                <button onClick={handleCreateLot} disabled={!newLotName} className="bg-indigo-600 text-white p-3 rounded-xl"><Save className="w-4 h-4"/></button>
                            </div>
                        ) : (
                            <select value={costCenterId} onChange={e => setCostCenterId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm font-bold">
                                <option value="">Seleccionar Lote...</option>
                                {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        )}
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><Users className="w-3 h-3"/> Responsable</label>
                            <button onClick={() => setIsCreatingPerson(!isCreatingPerson)} className="text-[10px] text-indigo-400 font-bold uppercase">{isCreatingPerson ? 'Cancelar' : '+ Nuevo'}</button>
                        </div>
                        {isCreatingPerson ? (
                            <div className="flex gap-2">
                                <input type="text" value={newPersonName} onChange={e => setNewPersonName(e.target.value)} placeholder="Nombre Persona" className="flex-1 bg-slate-800 border border-indigo-500 rounded-xl p-3 text-white text-sm" />
                                <button onClick={handleCreatePerson} disabled={!newPersonName} className="bg-indigo-600 text-white p-3 rounded-xl"><Save className="w-4 h-4"/></button>
                            </div>
                        ) : (
                            <select value={personnelId} onChange={e => setPersonnelId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm font-bold">
                                <option value="">Seleccionar Responsable...</option>
                                {personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        )}
                    </div>
                </div>
            )}

            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Notas / Observaciones</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm resize-none h-20" placeholder="Detalles adicionales..." />
            </div>

        </div>

        <div className="p-6 bg-slate-900 border-t border-slate-800">
            <button 
                onClick={handleSubmit} 
                disabled={!quantity || (type === 'IN' && !price) || (type === 'OUT' && (!costCenterId || !personnelId))}
                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${type === 'IN' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40' : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/40'}`}
            >
                {type === 'IN' ? 'Confirmar Entrada' : 'Confirmar Salida'}
            </button>
        </div>

      </div>
    </div>
  );
};
