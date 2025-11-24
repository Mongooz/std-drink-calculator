import React, { useState, useEffect, useMemo } from 'react';
import ManualCalculator from './components/ManualCalculator';
import SmartInput from './components/SmartInput';
import DrinkGraph from './components/DrinkGraph';
import { Drink, CalculationMode, Gender } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<CalculationMode>(CalculationMode.MANUAL);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [totalStdDrinks, setTotalStdDrinks] = useState(0);
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [firstHourBurn, setFirstHourBurn] = useState(2);
  const [subsequentHourBurn, setSubsequentHourBurn] = useState(1);
  const [weight, setWeight] = useState(80);
  const [gender, setGender] = useState<Gender>('male');

  // Edit Mode State
  const [editingDrinkId, setEditingDrinkId] = useState<string | null>(null);

  // Update totals when drinks change
  useEffect(() => {
    const total = drinks.reduce((sum, drink) => sum + drink.standardDrinks, 0);
    setTotalStdDrinks(total);
  }, [drinks]);

  // Update current time every minute for session duration calculation
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Calculate session duration based on the oldest drink
  const sessionInfo = useMemo(() => {
    if (drinks.length === 0) return null;
    
    // Find the earliest timestamp
    const startTime = Math.min(...drinks.map(d => d.timestamp));
    const diffMs = currentTime - startTime;
    
    // Avoid negative time if system clock drifts or for very fresh drinks
    const validDiff = Math.max(0, diffMs);
    
    const hours = Math.floor(validDiff / (1000 * 60 * 60));
    const mins = Math.floor((validDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, mins, startTime };
  }, [drinks, currentTime]);

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
    if (window.confirm("Remove this drink?")) {
      setDrinks(prev => prev.filter(d => d.id !== id));
    }
  };

  const updateDrinkTime = (id: string, newTimestamp: number) => {
    setDrinks(prev => prev.map(d => 
      d.id === id ? { ...d, timestamp: newTimestamp } : d
    ));
    setEditingDrinkId(null);
  };

  const clearSession = () => {
    if (window.confirm("Are you sure you want to clear your session?")) {
      setDrinks([]);
    }
  };

  // Helper to format date for input datetime-local
  const toLocalISOString = (timestamp: number) => {
    const date = new Date(timestamp);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-teal-500/30">
      <div className="max-w-md mx-auto min-h-screen flex flex-col bg-slate-900 shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <header className="pt-8 pb-4 px-6 bg-slate-900 sticky top-0 z-20 border-b border-slate-800">
           <div className="flex justify-between items-start mb-4">
             <div>
               <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-400">
                 Standard Drinks
               </h1>
               <div className="flex items-center gap-2">
                 <p className="text-xs text-slate-500 font-medium tracking-wide">CALCULATOR</p>
               </div>
             </div>
             <div className="text-right">
                <div className="flex flex-col items-end">
                  <div className={`text-3xl font-bold transition-colors leading-none ${totalStdDrinks > 4 ? 'text-red-400' : 'text-teal-400'}`}>
                    {totalStdDrinks.toFixed(2)}
                  </div>
                  <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mt-1">Total SD</div>
                  
                  {sessionInfo && (
                    <div className="mt-2 text-xs font-mono text-indigo-300 bg-indigo-900/30 px-2 py-1 rounded border border-indigo-500/30">
                      {sessionInfo.hours}h {sessionInfo.mins}m Elapsed
                    </div>
                  )}
                </div>
             </div>
           </div>

           {/* Tabs */}
          { !!process.env.API_KEY ?
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
          : null }
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {mode === CalculationMode.MANUAL ? (
            <ManualCalculator onAddDrink={addDrink} />
          ) : (
            <SmartInput onAddDrink={addDrink} />
          )}

          {/* Session List & Graph */}
          {drinks.length > 0 && (
            <div className="mt-10 pb-8">
              
              <div className="flex items-center gap-2 mb-4">
                <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${showSettings ? 'text-teal-400' : 'text-slate-500 hover:text-slate-300'}`}
                aria-label="Settings"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {showSettings ? 'Hide Settings' : 'BAC Settings'}
                </button>
              </div>


              {/* Settings Panel */}
              {showSettings && (
                <div className="bg-slate-800 p-4 rounded-xl mb-6 border border-slate-700 animate-in fade-in slide-in-from-top-2">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Profile & Metabolism
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                     <div>
                       <label className="block text-xs text-slate-400 mb-1">Gender</label>
                       <div className="flex bg-slate-700 rounded-lg p-1">
                          <button 
                            onClick={() => setGender('male')}
                            className={`flex-1 text-xs py-1.5 rounded-md transition-all ${gender === 'male' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                          >
                            Male
                          </button>
                          <button 
                            onClick={() => setGender('female')}
                            className={`flex-1 text-xs py-1.5 rounded-md transition-all ${gender === 'female' ? 'bg-pink-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                          >
                            Female
                          </button>
                       </div>
                     </div>
                     <div>
                        <label className="block text-xs text-slate-400 mb-1">Weight (kg)</label>
                        <input 
                           type="number" 
                           value={weight}
                           onChange={(e) => setWeight(Number(e.target.value))}
                           className="w-full bg-slate-700 border border-slate-600 rounded-lg py-1.5 px-3 text-white text-sm focus:ring-2 focus:ring-teal-500 outline-none placeholder-slate-500"
                           placeholder="80"
                        />
                     </div>
                  </div>

                  <div className="space-y-4 border-t border-slate-700 pt-4">
                    <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-xs text-slate-400">Burn Rate: 1st Hour</label>
                          <span className="text-xs font-mono text-teal-400">{firstHourBurn} SD</span>
                        </div>
                        <input 
                          type="range" min="0" max="4" step="0.5"
                          value={firstHourBurn}
                          onChange={(e) => setFirstHourBurn(Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-teal-500"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-xs text-slate-400">Burn Rate: After</label>
                          <span className="text-xs font-mono text-teal-400">{subsequentHourBurn} SD/hr</span>
                        </div>
                        <input 
                          type="range" min="0" max="3" step="0.1"
                          value={subsequentHourBurn}
                          onChange={(e) => setSubsequentHourBurn(Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-teal-500"
                        />
                    </div>
                  </div>
                </div>
              )}

              <DrinkGraph 
                drinks={drinks} 
                firstHourBurn={firstHourBurn}
                subsequentHourBurn={subsequentHourBurn}
                weight={weight}
                gender={gender}
              />

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
                  <div key={drink.id} className="group flex justify-between items-center bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl hover:bg-slate-800 transition-colors relative overflow-hidden">
                    <div className="relative z-10 w-full">
                      <div className="flex justify-between w-full">
                         <div className="font-medium text-slate-200">{drink.name}</div>
                         <div className="text-xl font-bold text-indigo-400">
                           {drink.standardDrinks.toFixed(1)} <span className="text-xs text-slate-600 font-normal">SD</span>
                         </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-2">
                        {editingDrinkId === drink.id ? (
                           <div className="flex items-center gap-2 animate-in fade-in">
                             <input 
                               type="datetime-local" 
                               defaultValue={toLocalISOString(drink.timestamp)}
                               className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white outline-none focus:border-teal-500"
                               onChange={(e) => {
                                 const ts = new Date(e.target.value).getTime();
                                 if (!isNaN(ts)) updateDrinkTime(drink.id, ts);
                               }}
                               onBlur={() => setEditingDrinkId(null)}
                               autoFocus
                             />
                             <button 
                               onClick={() => setEditingDrinkId(null)}
                               className="bg-teal-500/20 text-teal-400 p-1 rounded hover:bg-teal-500/30"
                             >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                             </button>
                           </div>
                        ) : (
                          <div className="text-xs text-slate-500 flex items-center gap-2">
                            <button 
                              onClick={() => setEditingDrinkId(drink.id)}
                              className="bg-slate-700/50 hover:bg-slate-700 px-1.5 py-0.5 rounded text-slate-300 font-mono flex items-center gap-1 transition-colors group/time"
                              title="Edit time"
                            >
                              {new Date(drink.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              <svg className="w-3 h-3 opacity-0 group-hover/time:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                            <span>{drink.volumeMl}ml</span>
                            <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                            <span>{drink.abv}%</span>
                          </div>
                        )}

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
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        <footer className="p-4 text-center text-xs text-slate-600 border-t border-slate-800 bg-slate-900/90 backdrop-blur">
          <p>
            This is a guide only. Alcohol affects everyone differently.
            <br />
            Config: {weight}kg {gender}, {firstHourBurn} SD 1st hr, then {subsequentHourBurn} SD/hr.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;