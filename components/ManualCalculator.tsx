import React, { useState, useEffect, useMemo } from 'react';
import { COMMON_SIZES, COMMON_ABV } from '../types';

interface ManualCalculatorProps {
  onAddDrink: (name: string, volume: number, abv: number) => void;
}

const ManualCalculator: React.FC<ManualCalculatorProps> = ({ onAddDrink }) => {
  const [volume, setVolume] = useState<number>(425); // Default to Schooner
  const [abv, setAbv] = useState<number>(4.8); // Default to Full Strength
  const [stdDrinks, setStdDrinks] = useState<number>(0);

  useEffect(() => {
    // AUS Standard Drink Formula: Vol(L) * ABV * 0.789
    const calculated = (volume / 1000) * abv * 0.789;
    setStdDrinks(calculated);
  }, [volume, abv]);

  const generatedName = useMemo(() => {
    const sizeLabel = COMMON_SIZES.find(s => s.volume === volume)?.label;
    const abvLabel = COMMON_ABV.find(a => a.value === abv)?.label;
    
    // Smart naming logic
    if (sizeLabel && abvLabel) {
      // Handle special cases like "Bottle (Wine)" + "Red Wine" -> "Bottle of Red Wine"
      const cleanSize = sizeLabel.replace(/\s*\(.*?\)\s*/g, ''); 
      return `${cleanSize} of ${abvLabel}`;
    }
    
    if (sizeLabel) return `${sizeLabel} (${abv}%)`;
    if (abvLabel) return `${volume}ml ${abvLabel}`;
    
    return `Custom Drink (${volume}ml @ ${abv}%)`;
  }, [volume, abv]);

  const handleAdd = () => {
    onAddDrink(generatedName, volume, abv);
  };

  return (
    <div className="space-y-6">
      {/* Result Preview */}
      <div className="bg-slate-800 p-6 rounded-2xl text-center shadow-lg border border-slate-700 relative overflow-hidden group">
         <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Calculated Impact</h3>
        <div className="flex justify-center items-baseline gap-2">
             <span className="text-6xl font-black text-teal-400 tracking-tighter">
              {stdDrinks.toFixed(2)}
            </span>
            <span className="text-xl font-bold text-slate-500">SD</span>
        </div>
        <p className="text-slate-400 text-sm mt-2 font-medium text-indigo-300">{generatedName}</p>
      </div>

      {/* Volume Controls */}
      <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50">
        <div className="flex justify-between items-end mb-4">
             <label className="text-sm font-bold text-slate-300">Volume</label>
             <span className="text-teal-400 font-mono font-bold">{volume} ml</span>
        </div>
        
        <input
          type="range"
          min="30"
          max="1140" 
          step="5"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500 mb-6"
        />
        
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {COMMON_SIZES.map((size) => (
            <button
              key={size.label}
              onClick={() => setVolume(size.volume)}
              className={`text-xs font-medium py-2 px-1 rounded-lg transition-all border ${
                volume === size.volume
                  ? 'bg-teal-500/20 border-teal-500/50 text-teal-300 shadow-[0_0_10px_rgba(20,184,166,0.2)]'
                  : 'bg-slate-700/50 border-transparent text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>

      {/* ABV Controls */}
      <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50">
        <div className="flex justify-between items-end mb-4">
             <label className="text-sm font-bold text-slate-300">Alcohol Content</label>
             <span className="text-purple-400 font-mono font-bold">{abv}%</span>
        </div>

        <input
          type="range"
          min="0"
          max="60"
          step="0.1"
          value={abv}
          onChange={(e) => setAbv(Number(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500 mb-6"
        />
        
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {COMMON_ABV.map((item) => (
            <button
              key={item.label}
              onClick={() => setAbv(item.value)}
              className={`text-xs font-medium py-2 px-1 rounded-lg transition-all border ${
                abv === item.value
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                  : 'bg-slate-700/50 border-transparent text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleAdd}
        className="w-full py-4 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-teal-900/20 flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Drink
      </button>
    </div>
  );
};

export default ManualCalculator;