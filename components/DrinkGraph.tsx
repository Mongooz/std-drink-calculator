import React, { useMemo } from 'react';
import { Drink, Gender } from '../types';

interface DrinkGraphProps {
  drinks: Drink[];
  firstHourBurn: number;
  subsequentHourBurn: number;
  weight: number;
  gender: Gender;
}

const DrinkGraph: React.FC<DrinkGraphProps> = ({ drinks, firstHourBurn, subsequentHourBurn, weight, gender }) => {
  const points = useMemo(() => {
    if (drinks.length === 0) return [];

    // Sort drinks by time
    const sortedDrinks = [...drinks].sort((a, b) => a.timestamp - b.timestamp);
    const startTime = sortedDrinks[0].timestamp;
    
    // Widmark Factor (r)
    // Approximate volume of distribution: Men ~0.68, Women ~0.55
    const r = gender === 'male' ? 0.68 : 0.55;

    // Helper: Convert Net Standard Drinks to BAC %
    // Formula: BAC = (Alcohol_g / (BodyWeight_g * r)) * 100
    // 1 SD = 10g of alcohol
    // BAC = (NetSD * 10) / (WeightKg * 1000 * r) * 100
    // Simplifies to: BAC = NetSD / (WeightKg * r)
    const toBAC = (netSD: number) => {
      const w = weight > 0 ? weight : 1; // Prevent div/0
      return netSD / (w * r);
    };
    
    // Simulation config
    const stepMs = 5 * 60 * 1000; // 5 min steps
    const stepBurnFirstHour = (firstHourBurn / 60) * 5; // burn per 5 mins
    const stepBurnSubsequent = (subsequentHourBurn / 60) * 5;

    let currentNetSD = 0;
    let currentTime = startTime;
    let timeSinceStart = 0;
    
    const dataPoints: { time: number; bac: number; label: string }[] = [];

    // Pre-calculate first drink impact for the very first point
    // We want the graph to "start" at the level of the first drink(s) consumed at T=0
    // rather than starting at 0 and ramping up.
    const initialDrinks = sortedDrinks.filter(d => Math.abs(d.timestamp - startTime) < 1000);
    initialDrinks.forEach(d => currentNetSD += d.standardDrinks);

    // Add Initial Point
    dataPoints.push({
      time: startTime,
      bac: toBAC(currentNetSD),
      label: new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    // Safety break (24 hours max)
    const maxSteps = (24 * 60) / 5; 
    let steps = 0;

    const lastDrinkTime = sortedDrinks[sortedDrinks.length - 1].timestamp;

    while (steps < maxSteps) {
      const nextTime = currentTime + stepMs;
      
      // 1. Process drinks in this interval (strictly > currentTime, <= nextTime)
      const drinksInInterval = sortedDrinks.filter(d => d.timestamp > currentTime && d.timestamp <= nextTime);
      for (const d of drinksInInterval) {
        currentNetSD += d.standardDrinks;
      }

      // 2. Metabolize based on time since start
      const burnAmount = (timeSinceStart < 60 * 60 * 1000) ? stepBurnFirstHour : stepBurnSubsequent;
      
      if (currentNetSD > 0) {
        currentNetSD -= burnAmount;
        if (currentNetSD < 0) currentNetSD = 0;
      }

      const currentBAC = toBAC(currentNetSD);

      dataPoints.push({
        time: nextTime,
        bac: currentBAC,
        label: new Date(nextTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      // Break if we are past the last drink AND BAC is effectively zero
      if (currentTime > lastDrinkTime && currentBAC <= 0.001) {
        break;
      }

      currentTime = nextTime;
      timeSinceStart += stepMs;
      steps++;
    }

    return dataPoints;
  }, [drinks, firstHourBurn, subsequentHourBurn, weight, gender]);

  // Analyze Curve for 0.05 crossings
  const soberTimeInfo = useMemo(() => {
     if (points.length === 0) return null;
     
     // Find the Peak Index
     let peakIndex = 0;
     for(let i=1; i<points.length; i++) {
        if(points[i].bac > points[peakIndex].bac) peakIndex = i;
     }
     
     const peakBAC = points[peakIndex].bac;

     // If we never reach 0.05, great
     if (peakBAC < 0.05) return { status: 'under', peak: peakBAC };

     // If we are currently (at end of graph) over 0.05
     // Find when we cross back down
     for (let i = peakIndex; i < points.length; i++) {
        if (points[i].bac <= 0.05) {
          return { status: 'over', peak: peakBAC, time: points[i].time, label: points[i].label };
        }
     }
     
     // If graph ends before we get sober (e.g. huge amount), return last point
     const lastP = points[points.length-1];
     return { status: 'over', peak: peakBAC, time: lastP.time, label: lastP.label, projected: true };
  }, [points]);


  if (points.length < 2) return null;

  // SVG Dimensions
  const width = 100; 
  const height = 50;
  const padding = 6;

  // Scales
  const maxBAC = Math.max(0.08, ...points.map(p => p.bac)); // Force at least 0.08 height so 0.05 isn't top
  const minTime = points[0].time;
  const maxTime = points[points.length - 1].time;
  const timeRange = maxTime - minTime || 1;

  const getX = (t: number) => ((t - minTime) / timeRange) * (width - 2 * padding) + padding;
  const getY = (bac: number) => height - padding - (bac / maxBAC) * (height - 2 * padding);

  // Generate Path
  const pathD = points.reduce((acc, p, i) => {
    const x = getX(p.time);
    const y = getY(p.bac);
    return i === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`;
  }, '');
  
  const areaPathD = `${pathD} L ${getX(points[points.length-1].time)},${height-padding} L ${getX(points[0].time)},${height-padding} Z`;

  // 0.05 Line Y-coordinate
  const y05 = getY(0.05);

  return (
    <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/50 mb-6 backdrop-blur-sm shadow-xl">
      <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Estimated BAC %
            </h3>
            {soberTimeInfo?.status === 'over' ? (
                 <div className="text-xs text-orange-400 mt-1 font-mono">
                    <span className="opacity-75">Below 0.05 at</span> <span className="font-bold text-lg">{soberTimeInfo.label}</span>
                 </div>
            ) : (
                <div className="text-xs text-teal-400 mt-1 font-mono font-bold">
                    Likely under 0.05 limit
                </div>
            )}
          </div>
          <div className="text-right">
             <div className={`text-2xl font-black leading-none ${soberTimeInfo?.peak && soberTimeInfo.peak > 0.05 ? 'text-orange-400' : 'text-teal-400'}`}>
                {soberTimeInfo?.peak?.toFixed(3) || '0.000'}
             </div>
             <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Peak BAC</span>
          </div>
      </div>
      
      <div className="relative w-full aspect-[2/1]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Grid lines */}
          <line x1={padding} y1={height-padding} x2={width-padding} y2={height-padding} stroke="#334155" strokeWidth="0.5" />
          <line x1={padding} y1={padding} x2={padding} y2={height-padding} stroke="#334155" strokeWidth="0.5" />
          
          {/* 0.05 Limit Line */}
          <line 
            x1={padding} y1={y05} x2={width-padding} y2={y05} 
            stroke="#f97316" strokeWidth="0.5" strokeDasharray="2,1" opacity="0.8"
          />
          <text x={width-padding+1} y={y05+1} fontSize="2.5" fill="#f97316" className="font-mono font-bold">0.05</text>

          {/* Area Fill */}
          <linearGradient id="gradBAC" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{stopColor: '#f97316', stopOpacity: 0.1}} />
            <stop offset="100%" style={{stopColor: '#2dd4bf', stopOpacity: 0.05}} />
          </linearGradient>
          <path d={areaPathD} fill="url(#gradBAC)" stroke="none" />

          {/* Main Curve */}
          <path d={pathD} fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

           {/* Current Time Marker */}
           {(() => {
              const now = Date.now();
              if (now >= minTime && now <= maxTime) {
                  const closest = points.reduce((prev, curr) => 
                    Math.abs(curr.time - now) < Math.abs(prev.time - now) ? curr : prev
                  );
                  return (
                    <g transform={`translate(${getX(now)}, ${getY(closest.bac)})`}>
                        <circle r="2" fill="#fff" stroke="#6366f1" strokeWidth="0.5" />
                        <text y="-3.5" fontSize="3" fill="#fff" textAnchor="middle" className="font-bold drop-shadow-md">NOW</text>
                    </g>
                  )
              }
              return null;
           })()}
           
           {/* Sober Time Marker */}
           {soberTimeInfo?.status === 'over' && soberTimeInfo.time && (
              <g transform={`translate(${getX(soberTimeInfo.time)}, ${y05})`}>
                 <circle r="1.5" fill="#f97316" />
              </g>
           )}

        </svg>
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-slate-500 font-mono">
        <span>{points[0].label}</span>
        <span>{points[points.length-1].label}</span>
      </div>
    </div>
  );
};

export default DrinkGraph;