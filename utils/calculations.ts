import { CPRWidthState, OHLC, PivotPoints, PivotRelationship } from "../types";
import { NARROW_CPR_THRESHOLD_PERCENT } from "../constants";

export const calculatePivots = (ohlc: OHLC): PivotPoints => {
  const pivot = (ohlc.high + ohlc.low + ohlc.close) / 3;
  const bc = (ohlc.high + ohlc.low) / 2;
  const tc = (pivot - bc) + pivot;

  // Standard pivots
  const r1 = (2 * pivot) - ohlc.low;
  const s1 = (2 * pivot) - ohlc.high;
  const r2 = pivot + (ohlc.high - ohlc.low);
  const s2 = pivot - (ohlc.high - ohlc.low);

  const absWidth = Math.abs(tc - bc);
  
  return {
    pivot,
    bc,
    tc,
    r1,
    s1,
    r2,
    s2,
    width: absWidth,
    widthPercent: (absWidth / ohlc.close) * 100
  };
};

export const determineCPRState = (widthPercent: number): CPRWidthState => {
  if (widthPercent <= NARROW_CPR_THRESHOLD_PERCENT) return CPRWidthState.NARROW;
  if (widthPercent > 0.75) return CPRWidthState.WIDE;
  return CPRWidthState.AVERAGE;
};

export const determineRelationship = (current: PivotPoints, previous: PivotPoints): PivotRelationship => {
  const currTop = Math.max(current.tc, current.bc);
  const currBot = Math.min(current.tc, current.bc);
  const prevTop = Math.max(previous.tc, previous.bc);
  const prevBot = Math.min(previous.tc, previous.bc);

  // Check for Unchanged (very similar levels, e.g., within 0.1%)
  const pivotChange = Math.abs((current.pivot - previous.pivot) / previous.pivot);
  if (pivotChange < 0.001) return PivotRelationship.UNCHANGED_VALUE;

  // Inside Value: Current completely inside Previous
  if (currTop <= prevTop && currBot >= prevBot) return PivotRelationship.INSIDE_VALUE;

  // Outside Value: Current completely engulfs Previous
  if (currTop >= prevTop && currBot <= prevBot) return PivotRelationship.OUTSIDE_VALUE;

  // Higher Value: Current Bottom > Previous Top
  if (currBot >= prevTop) return PivotRelationship.HIGHER_VALUE;

  // Lower Value: Current Top < Previous Bottom
  if (currTop <= prevBot) return PivotRelationship.LOWER_VALUE;

  // Overlapping Higher: Current Pivot > Previous Pivot, but ranges overlap
  if (current.pivot > previous.pivot) return PivotRelationship.OVERLAPPING_HIGHER;

  // Overlapping Lower: Current Pivot < Previous Pivot, but ranges overlap
  if (current.pivot < previous.pivot) return PivotRelationship.OVERLAPPING_LOWER;

  return PivotRelationship.UNKNOWN;
};

export const generateMockOHLC = (basePrice: number, volatility: number = 0.02): OHLC => {
  const open = basePrice * (1 + (Math.random() * volatility - volatility / 2));
  const close = basePrice * (1 + (Math.random() * volatility - volatility / 2));
  const high = Math.max(open, close) * (1 + Math.random() * (volatility / 2));
  const low = Math.min(open, close) * (1 - Math.random() * (volatility / 2));
  
  return {
    open: Number(open.toFixed(2)),
    high: Number(high.toFixed(2)),
    low: Number(low.toFixed(2)),
    close: Number(close.toFixed(2)),
    volume: Math.floor(Math.random() * 1000000)
  };
};
