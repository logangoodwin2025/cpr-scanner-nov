import React, { useState, useEffect, useMemo } from 'react';
import { fetchScannerData, resetScannerData } from './services/dhanMarketData';
import { StockData, FilterCriteria, Timeframe, CPRWidthState, PivotRelationship, Sector, MarketCap } from './types';
import AnalysisPanel from './components/AnalysisPanel';
import PivotVisualizer from './components/PivotVisualizer';
import { ICONS, SECTOR_ICONS } from './constants';
import { Info } from 'lucide-react';

const { Monitor, Layers, Activity, BarChart2, Zap, ArrowUp, ArrowDown, Database, Briefcase } = ICONS;

function App() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>(Timeframe.DAILY);
  const [totalLoaded, setTotalLoaded] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState<FilterCriteria>({
    ncprTimeframes: [],
    relationship: null,
    bullishConfluence: [],
    bearishConfluence: [],
    sectors: [],
    marketCaps: [],
    fnoOnly: false
  });

  const loadMoreData = async (reset: boolean = false) => {
    setLoading(true);
    try {
      if (reset) {
        resetScannerData();
        setStocks([]);
        setTotalLoaded(0);
      }
      const newStocks = await fetchScannerData(250);
      setStocks(prev => reset ? newStocks : [...prev, ...newStocks]);
      setTotalLoaded(prev => reset ? 250 : prev + 250);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Initial Data Load
  useEffect(() => {
    loadMoreData(true);
  }, []);

  // Complex Filtering Logic
  const filteredStocks = useMemo(() => {
    return stocks.filter(stock => {
      // 1. Sector Filter
      if (filters.sectors.length > 0 && !filters.sectors.includes(stock.sector)) return false;

      // 2. Market Cap Filter
      if (filters.marketCaps.length > 0 && !filters.marketCaps.includes(stock.marketCap)) return false;

      // 3. FnO Filter
      if (filters.fnoOnly && !stock.isFnO) return false;

      // 4. NCPR Scanner (OR Logic: if multiple TFs selected, show if Narrow in ANY)
      if (filters.ncprTimeframes.length > 0) {
        const hasNarrow = filters.ncprTimeframes.some(tf => 
          stock.timeframeData[tf].cprState === CPRWidthState.NARROW
        );
        if (!hasNarrow) return false;
      }

      // 5. Relationship Filter (Applies to Active Timeframe)
      if (filters.relationship) {
        if (stock.timeframeData[activeTimeframe].relationship !== filters.relationship) return false;
      }

      // 6. Confluences (AND Logic)
      // Bullish: Checks if relationship is HIGHER or OVERLAPPING_HIGHER for ALL selected TFs
      if (filters.bullishConfluence.length > 0) {
        const isBullish = filters.bullishConfluence.every(tf => {
          const rel = stock.timeframeData[tf].relationship;
          return rel === PivotRelationship.HIGHER_VALUE || rel === PivotRelationship.OVERLAPPING_HIGHER;
        });
        if (!isBullish) return false;
      }

      // Bearish: Checks if relationship is LOWER or OVERLAPPING_LOWER for ALL selected TFs
      if (filters.bearishConfluence.length > 0) {
        const isBearish = filters.bearishConfluence.every(tf => {
          const rel = stock.timeframeData[tf].relationship;
          return rel === PivotRelationship.LOWER_VALUE || rel === PivotRelationship.OVERLAPPING_LOWER;
        });
        if (!isBearish) return false;
      }

      return true;
    });
  }, [stocks, filters, activeTimeframe]);

  const toggleArrayFilter = (key: keyof FilterCriteria, value: any) => {
    setFilters(prev => {
      const arr = prev[key] as any[];
      if (arr.includes(value)) {
        return { ...prev, [key]: arr.filter(v => v !== value) };
      } else {
        return { ...prev, [key]: [...arr, value] };
      }
    });
  };

  const clearFilters = () => {
    setFilters({
      ncprTimeframes: [],
      relationship: null,
      bullishConfluence: [],
      bearishConfluence: [],
      sectors: [],
      marketCaps: [],
      fnoOnly: false
    });
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-200 overflow-hidden">
      
      {/* Sidebar Filters */}
      <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0 overflow-y-auto custom-scrollbar">
        <div className="p-5 border-b border-gray-800">
          <h1 className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
            <Monitor size={20} className="text-brand-500" />
            PivotBoss
          </h1>
          <div className="text-xs text-gray-500 mt-1 flex justify-between">
            <span>Advanced Scanner</span>
            <span className="text-gray-600">v1.1</span>
          </div>
        </div>

        <div className="p-4 space-y-8 pb-20">
          {/* Section 1: NCPR Scanner */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
                <Layers size={14} /> NCPR Scanner
              </h3>
              {filters.ncprTimeframes.length > 0 && <span className="text-[10px] bg-purple-900 text-purple-200 px-1.5 rounded">{filters.ncprTimeframes.length}</span>}
            </div>
            <div className="grid grid-cols-5 gap-1">
              {Object.values(Timeframe).map(tf => (
                <button
                  key={`ncpr-${tf}`}
                  onClick={() => toggleArrayFilter('ncprTimeframes', tf)}
                  className={`text-[10px] py-1.5 rounded border transition-colors ${
                    filters.ncprTimeframes.includes(tf)
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {tf.substring(0, 1)}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-500 mt-2 leading-tight">Scans for Narrow CPR in selected timeframes.</p>
          </section>

          {/* Section 2: Active TF Relation */}
          <section>
            <div className="flex items-center gap-2 mb-3 text-gray-300 text-sm font-semibold">
              <Activity size={14} /> 
              <span className="truncate">Rel. ({activeTimeframe.substring(0,1)})</span>
            </div>
            <div className="space-y-1">
              {[
                { label: 'Higher Value', val: PivotRelationship.HIGHER_VALUE, color: 'text-green-400' },
                { label: 'Overlapping Higher', val: PivotRelationship.OVERLAPPING_HIGHER, color: 'text-green-300' },
                { label: 'Lower Value', val: PivotRelationship.LOWER_VALUE, color: 'text-red-400' },
                { label: 'Overlapping Lower', val: PivotRelationship.OVERLAPPING_LOWER, color: 'text-red-300' },
                { label: 'Inside Value', val: PivotRelationship.INSIDE_VALUE, color: 'text-yellow-400' },
                { label: 'Outside Value', val: PivotRelationship.OUTSIDE_VALUE, color: 'text-blue-400' },
                { label: 'Unchanged', val: PivotRelationship.UNCHANGED_VALUE, color: 'text-gray-400' },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setFilters(prev => ({ ...prev, relationship: prev.relationship === opt.val ? null : opt.val }))}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded flex items-center justify-between transition-colors ${
                    filters.relationship === opt.val
                      ? 'bg-gray-800 border border-gray-600'
                      : 'hover:bg-gray-800/50 border border-transparent'
                  }`}
                >
                  <span className={opt.color}>{opt.label}</span>
                  {filters.relationship === opt.val && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </button>
              ))}
            </div>
          </section>

          {/* Section 3: Confluences */}
          <section>
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-3">
              <BarChart2 size={14} /> Confluences
            </h3>
            
            <div className="mb-4">
              <label className="text-[11px] text-green-400 uppercase font-bold mb-2 block flex items-center gap-1">
                <ArrowUp size={10} /> Bullish Alignment
              </label>
              <div className="flex flex-wrap gap-1">
                {Object.values(Timeframe).map(tf => (
                  <button
                    key={`bull-${tf}`}
                    onClick={() => toggleArrayFilter('bullishConfluence', tf)}
                    className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                      filters.bullishConfluence.includes(tf)
                        ? 'bg-green-900 border-green-500 text-green-100'
                        : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-green-900'
                    }`}
                  >
                    {tf.substring(0, 1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-red-400 uppercase font-bold mb-2 block flex items-center gap-1">
                <ArrowDown size={10} /> Bearish Alignment
              </label>
              <div className="flex flex-wrap gap-1">
                {Object.values(Timeframe).map(tf => (
                  <button
                    key={`bear-${tf}`}
                    onClick={() => toggleArrayFilter('bearishConfluence', tf)}
                    className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                      filters.bearishConfluence.includes(tf)
                        ? 'bg-red-900 border-red-500 text-red-100'
                        : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-red-900'
                    }`}
                  >
                    {tf.substring(0, 1)}
                  </button>
                ))}
              </div>
            </div>
          </section>

           {/* Section 5: Universe & Market Cap (Placed before Sectors for hierarchy) */}
           <section className="bg-gray-800/30 p-3 rounded-lg border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                <Database size={14} /> Universe & MCAP
              </h3>
              <div className="group relative">
                <Info size={14} className="text-gray-500 cursor-help" />
                <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-800 text-gray-300 text-[10px] rounded border border-gray-700 shadow-lg hidden group-hover:block z-50">
                  Limiting scan to approx 1000 highly liquid stocks for optimal performance. Use "Load Next 250" to expand universe.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {Object.values(MarketCap).map(cap => (
                <button
                  key={cap}
                  onClick={() => toggleArrayFilter('marketCaps', cap)}
                  className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
                    filters.marketCaps.includes(cap)
                      ? 'bg-blue-900/60 border-blue-500 text-blue-100'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-blue-900'
                  }`}
                >
                  {cap.replace(' Cap', '')}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer hover:text-white transition-colors">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${filters.fnoOnly ? 'bg-brand-600 border-brand-500' : 'border-gray-600 bg-gray-800'}`}>
                  {filters.fnoOnly && <div className="w-2 h-2 bg-white rounded-sm" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={filters.fnoOnly} 
                  onChange={(e) => setFilters(prev => ({ ...prev, fnoOnly: e.target.checked }))} 
                />
                F&O Stocks Only
              </label>
            </div>

            {/* Load More Button */}
            <div className="mt-4 pt-3 border-t border-gray-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-gray-500">Loaded: {totalLoaded}</span>
                {totalLoaded < 1000 && (
                   <span className="text-[10px] text-gray-500">Target: ~1000</span>
                )}
              </div>
              {totalLoaded < 1000 ? (
                <button 
                  onClick={() => loadMoreData(false)}
                  disabled={loading}
                  className="w-full py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Fetching...' : 'Load Next 250'}
                  {!loading && <span className="text-[10px] opacity-60">→</span>}
                </button>
              ) : (
                <div className="text-[10px] text-center text-green-500 bg-green-900/20 py-1 rounded border border-green-900/30">
                  Max Limit Reached
                </div>
              )}
            </div>
          </section>

          {/* Section 4: Sectors */}
          <section>
             <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-3">
              <Zap size={14} /> Sectors
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.values(Sector).map(sec => {
                const Icon = SECTOR_ICONS[sec] || Activity;
                return (
                  <button
                    key={sec}
                    onClick={() => toggleArrayFilter('sectors', sec)}
                    className={`flex items-center gap-2 px-2 py-1.5 text-[10px] rounded border transition-all overflow-hidden ${
                      filters.sectors.includes(sec)
                        ? 'bg-brand-900/40 border-brand-500 text-brand-200'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750'
                    }`}
                    title={sec.replace('_', ' ')}
                  >
                    <Icon size={12} className="flex-shrink-0" />
                    <span className="truncate">{sec.toLowerCase().replace('_', ' ')}</span>
                  </button>
                );
              })}
            </div>
          </section>
          
          <button 
            onClick={clearFilters}
            className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs rounded border border-gray-700 transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative" style={{ marginRight: selectedStock ? '480px' : '0' }}>
        
        {/* Top Header */}
        <header className="h-16 border-b border-gray-800 bg-gray-950 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-medium text-white">Market Watch</h2>
            <div className="h-6 w-px bg-gray-800 mx-2"></div>
            {/* Timeframe Selector - Controls Data Table View Only */}
            <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
              {Object.values(Timeframe).map(tf => (
                <button
                  key={tf}
                  onClick={() => setActiveTimeframe(tf)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    activeTimeframe === tf 
                      ? 'bg-gray-800 text-brand-500 shadow-sm border border-gray-700' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="text-xs text-gray-500 flex items-center gap-4">
               <span>Scanning: <span className="text-white font-mono">{totalLoaded}</span> stocks</span>
               <div className="h-4 w-px bg-gray-800"></div>
               <span>Matches: <span className="text-brand-400 font-bold font-mono">{filteredStocks.length}</span></span>
             </div>
          </div>
        </header>

        {/* Data Table */}
        <div className="flex-1 overflow-auto p-6 bg-gray-950">
          {stocks.length === 0 && loading ? (
             <div className="flex flex-col items-center justify-center h-64 text-gray-500">
               <Activity className="animate-spin mb-4 text-brand-500" size={32} />
               <p>Initializing Market Scanner...</p>
               <p className="text-xs text-gray-600 mt-2">Generating universe data</p>
             </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl min-h-[200px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-950/50 border-b border-gray-800 text-gray-500 text-[10px] uppercase font-bold tracking-wider sticky top-0 z-20">
                    <th className="p-4 w-48 bg-gray-900">Symbol</th>
                    <th className="p-4 w-32 text-right bg-gray-900">LTP</th>
                    <th className="p-4 w-48 bg-gray-900">{activeTimeframe} Relation</th>
                    <th className="p-4 w-40 bg-gray-900">CPR Width</th>
                    <th className="p-4 bg-gray-900">Pivot Structure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50 text-sm">
                  {filteredStocks.map(stock => {
                    const tfData = stock.timeframeData[activeTimeframe];
                    const isNarrow = tfData.cprState === CPRWidthState.NARROW;
                    
                    return (
                      <tr 
                        key={stock.symbol} 
                        onClick={() => setSelectedStock(stock)}
                        className={`hover:bg-gray-800/50 cursor-pointer transition-colors ${selectedStock?.symbol === stock.symbol ? 'bg-gray-800' : ''}`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{stock.symbol}</span>
                            {stock.isFnO && <span className="text-[9px] bg-yellow-900/30 text-yellow-500 px-1 rounded border border-yellow-900/50">FnO</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 rounded border border-gray-700 whitespace-nowrap">
                              {stock.sector.toLowerCase().replace('_', ' ')}
                            </span>
                            <span className="text-[9px] text-gray-600">{stock.marketCap}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-mono">
                          <div className="text-white">{stock.currentPrice.toFixed(2)}</div>
                          <div className={`${stock.changePercent >= 0 ? 'text-green-500' : 'text-red-500'} text-xs`}>
                            {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`
                            inline-flex items-center px-2.5 py-1 rounded text-[10px] font-medium border
                            ${tfData.relationship === PivotRelationship.HIGHER_VALUE ? 'bg-green-900/20 text-green-400 border-green-900/50' : ''}
                            ${tfData.relationship === PivotRelationship.OVERLAPPING_HIGHER ? 'bg-green-900/10 text-green-300 border-green-900/30' : ''}
                            ${tfData.relationship === PivotRelationship.LOWER_VALUE ? 'bg-red-900/20 text-red-400 border-red-900/50' : ''}
                            ${tfData.relationship === PivotRelationship.OVERLAPPING_LOWER ? 'bg-red-900/10 text-red-300 border-red-900/30' : ''}
                            ${tfData.relationship === PivotRelationship.INSIDE_VALUE ? 'bg-yellow-900/20 text-yellow-400 border-yellow-900/50' : ''}
                            ${tfData.relationship === PivotRelationship.OUTSIDE_VALUE ? 'bg-blue-900/20 text-blue-400 border-blue-900/50' : ''}
                            ${tfData.relationship === PivotRelationship.UNCHANGED_VALUE ? 'bg-gray-800 text-gray-400 border-gray-700' : ''}
                          `}>
                            {tfData.relationship.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1 bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${isNarrow ? 'bg-purple-500' : 'bg-blue-600'}`} 
                                style={{ width: `${Math.min(tfData.pivots.widthPercent * 100, 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-mono ${isNarrow ? 'text-purple-400 font-bold' : 'text-gray-500'}`}>
                              {tfData.pivots.widthPercent.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="w-32">
                            <PivotVisualizer pivots={tfData.pivots} currentPrice={stock.currentPrice} height={30} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {filteredStocks.length === 0 && (
                <div className="flex flex-col items-center justify-center h-96 text-gray-500 p-8">
                  <Layers size={48} className="mb-4 opacity-20" />
                  <p className="text-lg font-medium mb-2">No Stocks Match Filters</p>
                  <p className="text-sm text-gray-600 text-center max-w-md mb-6">
                    Try adjusting the NCPR scanner timeframes, removing specific relationship constraints, or <span className="text-gray-400 font-bold">Load More Data</span> to expand your search.
                  </p>
                  {totalLoaded < 1000 && (
                     <button 
                        onClick={() => loadMoreData(false)}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs rounded-lg font-medium transition-colors"
                      >
                        Load Next 250 Stocks
                      </button>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Bottom Loader trigger if user scrolls down - manual button for now as requested */}
          {filteredStocks.length > 0 && totalLoaded < 1000 && (
             <div className="mt-4 text-center">
               <button 
                 onClick={() => loadMoreData(false)}
                 disabled={loading}
                 className="text-xs text-gray-500 hover:text-white underline transition-colors"
               >
                 {loading ? 'Loading...' : `Scan next 250 stocks (${totalLoaded}/1000 loaded)`}
               </button>
             </div>
          )}
        </div>
      </div>

      {/* Slide-over Panel */}
      {selectedStock && (
        <AnalysisPanel 
          stock={selectedStock} 
          onClose={() => setSelectedStock(null)} 
        />
      )}
    </div>
  );
}

export default App;