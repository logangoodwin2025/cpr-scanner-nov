export enum Timeframe {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export enum Trend {
  BULLISH = 'BULLISH',
  BEARISH = 'BEARISH',
  NEUTRAL = 'NEUTRAL',
}

export enum CPRWidthState {
  NARROW = 'NARROW',
  AVERAGE = 'AVERAGE',
  WIDE = 'WIDE',
}

export enum PivotRelationship {
  HIGHER_VALUE = 'HIGHER_VALUE', // Bullish
  OVERLAPPING_HIGHER = 'OVERLAPPING_HIGHER', // Moderately Bullish
  LOWER_VALUE = 'LOWER_VALUE',   // Bearish
  OVERLAPPING_LOWER = 'OVERLAPPING_LOWER', // Moderately Bearish
  INSIDE_VALUE = 'INSIDE_VALUE', // Breakout Imminent
  OUTSIDE_VALUE = 'OUTSIDE_VALUE', // Sideways/Consolidation
  UNCHANGED_VALUE = 'UNCHANGED_VALUE', // Sideways/Breakout
  UNKNOWN = 'UNKNOWN'
}

export enum Sector {
  BANKING = 'BANKING',
  IT = 'IT',
  AUTO = 'AUTO',
  ENERGY = 'ENERGY',
  PHARMA = 'PHARMA',
  FMCG = 'FMCG',
  FINANCE = 'FINANCE',
  CONSUMER = 'CONSUMER',
  INFRA = 'INFRA',
  REALTY = 'REALTY',
  METAL = 'METAL',
  MEDIA = 'MEDIA',
  PSU_BANK = 'PSU_BANK',
  CHEMICALS = 'CHEMICALS',
  OTHER = 'OTHER'
}

export enum MarketCap {
  LARGE_CAP = 'Large Cap',
  MID_CAP = 'Mid Cap',
  SMALL_CAP = 'Small Cap',
  MICRO_CAP = 'Micro Cap'
}

export interface OHLC {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PivotPoints {
  pivot: number;
  bc: number; // Bottom Central
  tc: number; // Top Central
  r1: number;
  s1: number;
  r2: number;
  s2: number;
  width: number; // Absolute difference between TC and BC
  widthPercent: number; // Width as % of price (normalization)
}

export interface StockData {
  symbol: string;
  name: string;
  sector: Sector;
  marketCap: MarketCap;
  isFnO: boolean;
  currentPrice: number;
  changePercent: number;
  timeframeData: {
    [key in Timeframe]: {
      currentOHLC: OHLC;
      previousOHLC: OHLC;
      pivots: PivotPoints;
      prevPivots: PivotPoints;
      cprState: CPRWidthState;
      relationship: PivotRelationship;
    }
  };
}

export interface FilterCriteria {
  ncprTimeframes: Timeframe[]; // Section 1: Show if Narrow in ANY of these
  relationship: PivotRelationship | null; // Section 2: Filter active timeframe by this
  bullishConfluence: Timeframe[]; // Section 3a: Show if Bullish in ALL of these
  bearishConfluence: Timeframe[]; // Section 3b: Show if Bearish in ALL of these
  sectors: Sector[]; // Section 4
  marketCaps: MarketCap[]; // Section 5a
  fnoOnly: boolean; // Section 5b
}