import { SEED_STOCKS } from "../constants";
import { StockData, Timeframe, Sector, MarketCap } from "../types";
import { calculatePivots, determineCPRState, determineRelationship, generateMockOHLC } from "../utils/calculations";

// State to track how many we've generated
let generatedCount = 0;

const getRandomEnum = <T>(anEnum: T): T[keyof T] => {
  const enumValues = Object.values(anEnum as object);
  const randomIndex = Math.floor(Math.random() * enumValues.length);
  return enumValues[randomIndex];
};

const generateStockName = (index: number) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let symbol = "";
  for (let i = 0; i < 4; i++) symbol += chars.charAt(Math.floor(Math.random() * chars.length));
  return {
    symbol: `${symbol}IND${index}`,
    name: `${symbol} Industries Ltd`
  };
};

// Helper to assign realistic MCAP based on index or random probability
const assignMarketCap = (index: number): MarketCap => {
  const rand = Math.random();
  if (index < 50) return MarketCap.LARGE_CAP; // First 50 always Large
  if (rand < 0.2) return MarketCap.LARGE_CAP;
  if (rand < 0.5) return MarketCap.MID_CAP;
  if (rand < 0.8) return MarketCap.SMALL_CAP;
  return MarketCap.MICRO_CAP;
};

// Helper for FNO status (Large/Mid caps more likely to be FNO)
const isFnOStock = (mcap: MarketCap): boolean => {
  if (mcap === MarketCap.LARGE_CAP) return Math.random() > 0.1; // 90% of Large Cap are FNO
  if (mcap === MarketCap.MID_CAP) return Math.random() > 0.4; // 60% of Mid Cap
  if (mcap === MarketCap.SMALL_CAP) return Math.random() > 0.8; // 20% of Small Cap
  return false; // Micro caps are not FNO
};

export const fetchMarketScannerData = async (batchSize: number = 250): Promise<StockData[]> => {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network latency

  const newStocks: StockData[] = [];
  
  for (let i = 0; i < batchSize; i++) {
    const globalIndex = generatedCount + i;
    
    // Use seed stocks for the first few, then generate random
    let stockMeta;
    if (globalIndex < SEED_STOCKS.length) {
      stockMeta = SEED_STOCKS[globalIndex];
    } else {
      stockMeta = {
        ...generateStockName(globalIndex),
        sector: getRandomEnum(Sector)
      };
    }

    const marketCap = assignMarketCap(globalIndex);
    const fno = isFnOStock(marketCap);
    const basePrice = 100 + Math.random() * 3000; 
    const timeframes: any = {};
    
    Object.values(Timeframe).forEach((tf) => {
      // Adjust volatility based on timeframe
      let volatility = 0.02;
      if (tf === Timeframe.WEEKLY) volatility = 0.04;
      if (tf === Timeframe.MONTHLY) volatility = 0.08;
      if (tf === Timeframe.QUARTERLY) volatility = 0.12;
      if (tf === Timeframe.YEARLY) volatility = 0.20;

      const prevOHLC = generateMockOHLC(basePrice, volatility);
      
      // Current is derived from Prev Close to ensure continuity
      const currentOHLC = generateMockOHLC(prevOHLC.close, volatility * 0.5); 
      
      const pivots = calculatePivots(prevOHLC);
      
      // Pre-previous for relationship
      const prePrevOHLC = generateMockOHLC(prevOHLC.open, volatility);
      const prevPivots = calculatePivots(prePrevOHLC);

      const cprState = determineCPRState(pivots.widthPercent);
      const relationship = determineRelationship(pivots, prevPivots);

      timeframes[tf] = {
        currentOHLC,
        previousOHLC: prevOHLC,
        pivots,
        prevPivots,
        cprState,
        relationship
      };
    });

    const currentPrice = timeframes[Timeframe.DAILY].currentOHLC.close;
    const prevClose = timeframes[Timeframe.DAILY].previousOHLC.close;
    const changePercent = ((currentPrice - prevClose) / prevClose) * 100;

    newStocks.push({
      symbol: stockMeta.symbol,
      name: stockMeta.name,
      sector: stockMeta.sector,
      marketCap,
      isFnO: fno,
      currentPrice,
      changePercent,
      timeframeData: timeframes
    });
  }

  generatedCount += batchSize;
  return newStocks;
};

export const resetDataGenerator = () => {
  generatedCount = 0;
};