import React, { useState } from 'react';
import { StockData, Timeframe, PivotRelationship, CPRWidthState } from '../types';
import PivotVisualizer from './PivotVisualizer';
import { analyzeStockSetup } from '../services/gemini';
import { Zap, X, RefreshCw } from 'lucide-react';

interface AnalysisPanelProps {
  stock: StockData | null;
  onClose: () => void;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ stock, onClose }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  if (!stock) return null;

  const handleRunAnalysis = async () => {
    setLoadingAi(true);
    const result = await analyzeStockSetup(stock);
    setAnalysis(result);
    setLoadingAi(false);
  };

  const getRelColor = (rel: PivotRelationship) => {
    switch(rel) {
      case PivotRelationship.INSIDE_VALUE: return 'text-yellow-400';
      case PivotRelationship.HIGHER_VALUE: 
      case PivotRelationship.OVERLAPPING_HIGHER: return 'text-green-400';
      case PivotRelationship.LOWER_VALUE: 
      case PivotRelationship.OVERLAPPING_LOWER: return 'text-red-400';
      case PivotRelationship.OUTSIDE_VALUE: return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-gray-900 border-l border-gray-800 shadow-2xl transform transition-transform duration-300 z-50 overflow-y-auto custom-scrollbar">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              {stock.symbol}
              <span className={`text-sm px-2 py-0.5 rounded ${stock.changePercent >= 0 ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
              </span>
            </h2>
            <p className="text-gray-400 text-sm">{stock.name} • <span className="text-brand-400">{stock.sector}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* AI Analysis Section */}
        <div className="mb-8 bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-brand-500 flex items-center gap-2">
              <Zap size={16} />
              AI TECHNICAL INSIGHT
            </h3>
            {!analysis && (
              <button 
                onClick={handleRunAnalysis}
                disabled={loadingAi}
                className="text-xs bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {loadingAi ? <RefreshCw size={12} className="animate-spin" /> : 'Analyze Setup'}
              </button>
            )}
          </div>
          
          {loadingAi && <div className="text-gray-400 text-sm animate-pulse">Analyzing Pivot relationships and volatility structure...</div>}
          
          {analysis && (
            <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
              {analysis}
            </div>
          )}
        </div>

        {/* Multi-Timeframe Breakdown */}
        <div className="space-y-4">
          {Object.values(Timeframe).map((tf) => {
            const data = stock.timeframeData[tf];
            const isNarrow = data.cprState === CPRWidthState.NARROW;
            const relColor = getRelColor(data.relationship);

            return (
              <div key={tf} className="bg-gray-950 rounded-lg border border-gray-800 p-4 hover:border-gray-700 transition-colors">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase">{tf}</h4>
                  <div className="flex gap-2">
                    {isNarrow && <span className="text-[10px] bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded border border-purple-800">NARROW</span>}
                    <span className={`text-[10px] px-2 py-0.5 rounded border border-gray-800 bg-gray-900 ${relColor}`}>
                      {data.relationship.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs mb-3 text-gray-500 font-mono">
                  <div>Pivot: <span className="text-white">{data.pivots.pivot.toFixed(2)}</span></div>
                  <div>Width: <span className="text-white">{data.pivots.widthPercent.toFixed(2)}%</span></div>
                </div>

                <PivotVisualizer pivots={data.pivots} currentPrice={stock.currentPrice} height={60} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;
