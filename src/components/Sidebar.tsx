import { Filter, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SidebarProps {
  years: number[];
  selectedYears: number[];
  onYearsChange: (years: number[]) => void;
  months: string[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  units: string[];
  selectedUnits: string[];
  onUnitsChange: (units: string[]) => void;
  subUnits: string[];
  selectedSubUnits: string[];
  onSubUnitsChange: (subUnits: string[]) => void;
  specialties: string[];
  selectedSpecialties: string[];
  onSpecialtiesChange: (specialties: string[]) => void;
}

export function Sidebar({
  years, selectedYears, onYearsChange,
  months, selectedMonth, onMonthChange,
  units, selectedUnits, onUnitsChange,
  subUnits, selectedSubUnits, onSubUnitsChange,
  specialties, selectedSpecialties, onSpecialtiesChange
}: SidebarProps) {

  const removeSelection = (item: string | number, current: any[], onChange: (items: any[]) => void) => {
    onChange(current.filter(i => i !== item));
  }

  return (
    <div className="w-56 bg-sidebar border-r border-border h-screen overflow-y-auto p-3 flex flex-col gap-3 fixed left-0 top-0 z-20 scrollbar-thin scrollbar-thumb-border">
      <div className="flex items-center gap-2 mb-1">
        <Filter className="w-4 h-4 text-primary" />
        <h2 className="text-base font-bold text-white">Filtros</h2>
      </div>

      {/* Ano (Multiselect) */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-secondary">Ano</label>
        <div className="flex flex-wrap gap-1 mb-1">
          {selectedYears.map(y => (
            <span key={y} className="bg-primary text-black font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
              {y}
              <X className="w-3 h-3 cursor-pointer" onClick={() => removeSelection(y, selectedYears, onYearsChange)} />
            </span>
          ))}
        </div>
        <select 
          className="select-dark bg-card border border-border rounded p-1.5 text-xs text-white outline-none focus:border-primary w-full"
          onChange={(e) => {
              const val = Number(e.target.value);
              if (val && !selectedYears.includes(val)) {
                  onYearsChange([...selectedYears, val]);
              }
              e.target.value = "";
          }}
        >
          <option value="">Adicionar ano...</option>
          {years.filter(y => !selectedYears.includes(y)).map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {selectedYears.length === 0 && (
            <span className="text-[10px] text-secondary italic">Exibindo todos os anos</span>
        )}
      </div>

      {/* Mês */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-secondary">Mês</label>
        <select 
          className="select-dark bg-card border border-border rounded p-1.5 text-xs text-white outline-none focus:border-primary w-full"
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
        >
          <option value="">Todos os Meses</option>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Unidade */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-secondary">Unidade</label>
        <div className="flex flex-wrap gap-1 mb-1">
          {selectedUnits.map(u => (
            <span key={u} className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
              {u}
              <X className="w-3 h-3 cursor-pointer" onClick={() => removeSelection(u, selectedUnits, onUnitsChange)} />
            </span>
          ))}
        </div>
        <select 
            className="select-dark bg-card border border-border rounded p-1.5 text-xs text-white outline-none focus:border-primary w-full"
            onChange={(e) => {
                if (e.target.value && !selectedUnits.includes(e.target.value)) {
                    onUnitsChange([...selectedUnits, e.target.value]);
                }
                e.target.value = "";
            }}
        >
            <option value="">Adicionar filtro...</option>
            {units.filter(u => !selectedUnits.includes(u)).map(u => (
                <option key={u} value={u}>{u}</option>
            ))}
        </select>
      </div>

       {/* Sub Unidade */}
       <div className="flex flex-col gap-1">
        <label className="text-xs text-secondary">Sub Unidade</label>
        <div className="flex flex-wrap gap-1 mb-1">
          {selectedSubUnits.map(s => (
            <span key={s} className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
              {s}
              <X className="w-3 h-3 cursor-pointer" onClick={() => removeSelection(s, selectedSubUnits, onSubUnitsChange)} />
            </span>
          ))}
        </div>
        <select 
            className="select-dark bg-card border border-border rounded p-1.5 text-xs text-white outline-none focus:border-primary w-full"
            onChange={(e) => {
                if (e.target.value && !selectedSubUnits.includes(e.target.value)) {
                    onSubUnitsChange([...selectedSubUnits, e.target.value]);
                }
                e.target.value = "";
            }}
        >
            <option value="">Adicionar filtro...</option>
            {subUnits.filter(s => !selectedSubUnits.includes(s)).map(s => (
                <option key={s} value={s}>{s}</option>
            ))}
        </select>
      </div>

      {/* Especialidade */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-secondary">Especialidade</label>
        <select 
             className="select-dark bg-card border border-border rounded p-1.5 text-xs text-white outline-none focus:border-primary w-full"
             onChange={(e) => {
                 if (e.target.value && !selectedSpecialties.includes(e.target.value)) {
                     onSpecialtiesChange([...selectedSpecialties, e.target.value]);
                 }
                 e.target.value = ""; // reset
             }}
        >
             <option value="">Adicionar especialidade...</option>
             {specialties.filter(s => !selectedSpecialties.includes(s)).map(s => (
                 <option key={s} value={s}>{s}</option>
             ))}
        </select>
         <div className="flex flex-wrap gap-1 mt-1">
          {selectedSpecialties.map(s => (
            <span key={s} className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
              {s}
              <X className="w-3 h-3 cursor-pointer" onClick={() => removeSelection(s, selectedSpecialties, onSpecialtiesChange)} />
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}
