import React, { useState } from 'react';
import { parseDrinkInput } from '../services/geminiService';

interface SmartInputProps {
  onAddDrink: (name: string, volume: number, abv: number) => void;
}

const SmartInput: React.FC<SmartInputProps> = ({ onAddDrink }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const drinks = await parseDrinkInput(input);
      if (drinks.length === 0) {
        setError("Could not identify any drinks. Try being more specific.");
      } else {
        drinks.forEach((d: any) => {
          onAddDrink(d.name, d.volumeMl, d.abv);
        });
        setInput('');
      }
    } catch (err) {
      setError("Failed to process request. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
       <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6 rounded-2xl border border-indigo-500/20">
         <h3 className="text-lg font-semibold text-indigo-300 mb-2">Ask AI</h3>
         <p className="text-sm text-slate-400 mb-4">
           Describe what you drank, and we'll estimate the standard drinks for you.
         </p>
         
         <form onSubmit={handleSubmit} className="relative">
           <textarea
             value={input}
             onChange={(e) => setInput(e.target.value)}
             placeholder="e.g., A pint of Guinness and a shot of tequila..."
             className="w-full bg-slate-800 text-white placeholder-slate-500 border border-slate-600 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none h-32"
           />
           
           <div className="mt-4 flex justify-end">
             <button
               type="submit"
               disabled={isLoading || !input.trim()}
               className={`
                 flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all
                 ${isLoading || !input.trim() 
                   ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                   : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30'}
               `}
             >
               {isLoading ? (
                 <>
                   <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   <span>Analyzing...</span>
                 </>
               ) : (
                 <>
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                   </svg>
                   <span>Calculate</span>
                 </>
               )}
             </button>
           </div>
         </form>

         {error && (
           <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center">
             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             {error}
           </div>
         )}
       </div>
       
       <div className="text-xs text-slate-500 text-center">
         AI estimates may vary. Always check official labels.
       </div>
    </div>
  );
};

export default SmartInput;
