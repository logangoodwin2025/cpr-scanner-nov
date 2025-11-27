import React from 'react';
import { PivotPoints } from '../types';

interface PivotVisualizerProps {
  pivots: PivotPoints;
  currentPrice: number;
  height?: number;
}

const PivotVisualizer: React.FC<PivotVisualizerProps> = ({ pivots, currentPrice, height = 60 }) => {
  const { tc, bc, pivot, r1, s1 } = pivots;
  
  // Determine range for visualization
  const maxVal = Math.max(tc, bc, pivot, currentPrice, r1) * 1.002;
  const minVal = Math.min(tc, bc, pivot, currentPrice, s1) * 0.998;
  const range = maxVal - minVal;

  const getY = (val: number) => {
    return ((maxVal - val) / range) * 100;
  };

  const tcY = getY(tc);
  const bcY = getY(bc);
  const pivotY = getY(pivot);
  const priceY = getY(currentPrice);

  // Determine CPR Color
  const isNarrow = pivots.widthPercent < 0.25;
  const cprColor = isNarrow ? '#8B5CF6' : '#3B82F6'; // Purple for narrow, Blue for normal

  return (
    <div className="relative w-full bg-gray-900/50 rounded border border-gray-800 overflow-hidden" style={{ height: `${height}px` }}>
      {/* R1 Label/Line */}
      <div className="absolute w-full border-t border-dashed border-red-900/50" style={{ top: `${getY(r1)}%` }}></div>

      {/* S1 Label/Line */}
      <div className="absolute w-full border-t border-dashed border-green-900/50" style={{ top: `${getY(s1)}%` }}></div>

      {/* CPR Zone */}
      <div 
        className="absolute w-full opacity-30"
        style={{
          top: `${Math.min(tcY, bcY)}%`,
          height: `${Math.abs(tcY - bcY)}%`,
          backgroundColor: cprColor
        }}
      />

      {/* Central Pivot Line */}
      <div className="absolute w-full border-t border-purple-400/40" style={{ top: `${pivotY}%` }}></div>

      {/* Current Price Marker */}
      <div 
        className="absolute right-0 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] z-10 transform -translate-y-1/2 translate-x-1/2 mr-4"
        style={{ top: `${priceY}%` }}
      ></div>
      <div 
        className="absolute right-0 text-[10px] font-mono text-white mr-6 transform -translate-y-1/2"
        style={{ top: `${priceY}%` }}
      >
        {currentPrice.toFixed(1)}
      </div>
    </div>
  );
};

export default PivotVisualizer;