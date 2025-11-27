import { SEED_STOCKS } from "../constants";
import { StockData, Timeframe, Sector, MarketCap, OHLC, CPRWidthState, PivotRelationship } from "../types";
import { calculatePivots, determineCPRState, determineRelationship } from "../utils/calculations";
import { fetchMarketScannerData as fetchMockMarketScannerData, resetDataGenerator as resetMockDataGenerator } from "./marketData";

interface DhanCandle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  timestamp?: string;
}

interface DhanCandleResponse {
  candles?: DhanCandle[];
  data?: {
    candles?: DhanCandle[];
  };
}

const DHAN_API_BASE = "https://api.dhan.co";

const timeframeToResolution: Record<Timeframe, string> = {
  [Timeframe.DAILY]: "1D",
  [Timeframe.WEEKLY]: "1W",
  [Timeframe.MONTHLY]: "1M",
  [Timeframe.QUARTERLY]: "3M",
  [Timeframe.YEARLY]: "1Y",
};

let liveOffset = 0;

const isMockMode = (): boolean => String(import.meta.env.VITE_USE_MOCK_MARKET_DATA || "").toLowerCase() === "true";

const hasDhanCredentials = (): boolean => {
  const apiKey = import.meta.env.VITE_DHAN_API_KEY;
  const apiSecret = import.meta.env.VITE_DHAN_API_SECRET;
  return Boolean(apiKey && apiSecret);
};

const getAuthHeaders = () => {
  const apiKey = import.meta.env.VITE_DHAN_API_KEY;
  const apiSecret = import.meta.env.VITE_DHAN_API_SECRET;

  return {
    "Content-Type": "application/json",
    "X-Dhan-Client-Id": apiKey,
    "X-Dhan-Client-Secret": apiSecret,
  } as Record<string, string>;
};

const pickMetaForSymbol = (symbol: string) => {
  const seed = SEED_STOCKS.find(s => s.symbol === symbol);
  if (seed) return seed;
  return { symbol, name: symbol, sector: Sector.OTHER };
};

const inferMarketCap = (price: number): MarketCap => {
  if (price >= 2000) return MarketCap.LARGE_CAP;
  if (price >= 1000) return MarketCap.MID_CAP;
  if (price >= 200) return MarketCap.SMALL_CAP;
  return MarketCap.MICRO_CAP;
};

const mapCandleToOHLC = (candle: DhanCandle | undefined, fallbackPrice: number): OHLC => {
  const price = candle?.close ?? fallbackPrice;
  const open = candle?.open ?? price;
  const high = candle?.high ?? price;
  const low = candle?.low ?? price;
  return {
    open: Number(open.toFixed(2)),
    high: Number(high.toFixed(2)),
    low: Number(low.toFixed(2)),
    close: Number(price.toFixed(2)),
    volume: candle?.volume ?? 0,
  };
};

const buildTimeframeSnapshot = (candles: DhanCandle[], fallbackPrice: number) => {
  const currentOHLC = mapCandleToOHLC(candles[0], fallbackPrice);
  const previousOHLC = mapCandleToOHLC(candles[1] ?? candles[0], fallbackPrice);
  const prePreviousOHLC = mapCandleToOHLC(candles[2] ?? candles[1] ?? candles[0], fallbackPrice);

  const pivots = calculatePivots(previousOHLC);
  const prevPivots = calculatePivots(prePreviousOHLC);

  return {
    currentOHLC,
    previousOHLC,
    pivots,
    prevPivots,
    cprState: determineCPRState(pivots.widthPercent),
    relationship: determineRelationship(pivots, prevPivots),
  } as {
    currentOHLC: OHLC;
    previousOHLC: OHLC;
    pivots: ReturnType<typeof calculatePivots>;
    prevPivots: ReturnType<typeof calculatePivots>;
    cprState: CPRWidthState;
    relationship: PivotRelationship;
  };
};

const fetchCandlesForTimeframe = async (symbol: string, timeframe: Timeframe): Promise<DhanCandle[]> => {
  const resolution = timeframeToResolution[timeframe];
  const params = new URLSearchParams({ symbol, resolution, count: "3" });
  const response = await fetch(`${DHAN_API_BASE}/marketdata/candles?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Dhan candle fetch failed for ${symbol} (${timeframe})`);
  }

  const json: DhanCandleResponse = await response.json();
  return json.candles ?? json.data?.candles ?? [];
};

const buildLiveStock = async (symbol: string): Promise<StockData> => {
  const meta = pickMetaForSymbol(symbol);
  const timeframeData: Record<Timeframe, any> = {};

  const candleGroups = await Promise.all(
    Object.values(Timeframe).map(async tf => ({ tf, candles: await fetchCandlesForTimeframe(symbol, tf) }))
  );

  candleGroups.forEach(group => {
    const fallbackPrice = group.candles[0]?.close ?? group.candles[0]?.open ?? 0;
    timeframeData[group.tf] = buildTimeframeSnapshot(group.candles, fallbackPrice || 1);
  });

  const currentPrice = timeframeData[Timeframe.DAILY].currentOHLC.close;
  const prevClose = timeframeData[Timeframe.DAILY].previousOHLC.close;
  const changePercent = prevClose ? ((currentPrice - prevClose) / prevClose) * 100 : 0;
  const marketCap = inferMarketCap(currentPrice);
  const isFnO = marketCap === MarketCap.LARGE_CAP || marketCap === MarketCap.MID_CAP;

  return {
    symbol: meta.symbol,
    name: meta.name,
    sector: meta.sector,
    marketCap,
    isFnO,
    currentPrice,
    changePercent,
    timeframeData,
  };
};

const shouldUseLiveData = () => hasDhanCredentials() && !isMockMode();

export const fetchScannerData = async (batchSize: number = 250): Promise<StockData[]> => {
  if (!shouldUseLiveData()) {
    return fetchMockMarketScannerData(batchSize);
  }

  const symbolBatch = SEED_STOCKS.slice(liveOffset, liveOffset + batchSize);
  liveOffset += symbolBatch.length;

  const liveResults = await Promise.all(
    symbolBatch.map(async meta => {
      try {
        return await buildLiveStock(meta.symbol);
      } catch (err) {
        console.error(`Falling back to mock for ${meta.symbol}`, err);
        return undefined;
      }
    })
  );

  const stocks = liveResults.filter(Boolean) as StockData[];

  if (stocks.length < batchSize) {
    const remainder = batchSize - stocks.length;
    const filler = await fetchMockMarketScannerData(remainder);
    stocks.push(...filler);
  }

  return stocks;
};

export const resetScannerData = () => {
  liveOffset = 0;
  resetMockDataGenerator();
};
