import React, { useState, useEffect } from 'react';
import ManualCalculator from './components/ManualCalculator';
import SmartInput from './components/SmartInput';
import { Drink, CalculationMode } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<CalculationMode>(CalculationMode.MANUAL);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [totalStdDrinks, setTotalStdDrinks] = useState(0);

  useEffect(() => {
    const total = drinks.reduce((sum, drink) => sum + drink.standardDrinks, 0);
    setTotalStdDrinks(total);
  }, [drinks]);

  const addDrink = (name: string, volumeMl: number, abv: number) => {
    // AUS Standard Drink Formula: Vol(L) * ABV * 0.789
    const std = (volumeMl / 1000) * abv * 0.789;
    
    const newDrink: Drink = {
      id: Date.now().toString() + Math.random().toString(),
      name,
      volumeMl,
      abv,
      standardDrinks: std,
      timestamp: Date.now()
    };
    
    setDrinks(prev => [newDrink, ...prev]);
  };

  const removeDrink = (id: string) => {
    setDrinks(prev => prev.filter(d => d.id !== id));
  };

  const clearSession = () => {
    if (window.confirm("Are you sure you want to clear your session?")) {
      setDrinks([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-teal-500/30">
      <div className="max-w-md mx-auto min-h-screen flex flex-col bg-slate-900 shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <header className="pt-8 pb-4 px-6 bg-slate-900 sticky top-0 z-10 border-b border-slate-800">
           <div className="flex justify-between items-center mb-4">
             <div>
               <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-400">
                 Standard Drinks
               </h1>
               <p className="text-xs text-slate-500 font-medium tracking-wide">AUSTRALIAN CALCULATOR</p>
             </div>
             <div className="text-right">
                <div className={`text-3xl font-bold transition-colors ${totalStdDrinks > 4 ? 'text-red-400' : 'text-teal-400'}`}>
                  {totalStdDrinks.toFixed(2)}
                </div>
                <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Total SD</div>
             </div>
           </div>

           {/* Tabs */}
           <div className="grid grid-cols-2 gap-2 bg-slate-800/50 p-1 rounded-xl">
             <button
               onClick={() => setMode(CalculationMode.MANUAL)}
               className={`py-2 text-sm font-medium rounded-lg transition-all ${
                 mode === CalculationMode.MANUAL 
                   ? 'bg-slate-700 text-white shadow-sm' 
                   : 'text-slate-400 hover:text-slate-200'
               }`}
             >
               Calculator
             </button>
             <button
               onClick={() => setMode(CalculationMode.AI)}
               className={`py-2 text-sm font-medium rounded-lg transition-all ${
                 mode === CalculationMode.AI 
                   ? 'bg-slate-700 text-white shadow-sm' 
                   : 'text-slate-400 hover:text-slate-200'
               }`}
             >
               AI Recognition
             </button>
           </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {mode === CalculationMode.MANUAL ? (
            <ManualCalculator onAddDrink={addDrink} />
          ) : (
            <SmartInput onAddDrink={addDrink} />
          )}

          {/* Session List */}
          {drinks.length > 0 && (
            <div className="mt-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Current Session</h2>
                <button 
                  onClick={clearSession}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear All
                </button>
              </div>
              
              <div className="space-y-3">
                {drinks.map(drink => (
                  <div key={drink.id} className="group flex justify-between items-center bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl hover:bg-slate-800 transition-colors">
                    <div>
                      <div className="font-medium text-slate-200">{drink.name}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {drink.volumeMl}ml • {drink.abv}% ABV
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xl font-bold text-indigo-400">
                        {drink.standardDrinks.toFixed(1)} <span className="text-xs text-slate-600 font-normal">SD</span>
                      </div>
                      <button
                        onClick={() => removeDrink(drink.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
                        aria-label="Remove drink"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        <footer className="p-4 text-center text-xs text-slate-600 border-t border-slate-800">
          <p>This is a guide only. <br/>Alcohol affects everyone differently.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
