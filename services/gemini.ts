import { GoogleGenAI } from "@google/genai";
import { StockData, Timeframe } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeStockSetup = async (stock: StockData): Promise<string> => {
  const model = 'gemini-2.5-flash';
  
  // Prepare a prompt that encapsulates Pivot Boss methodology
  const prompt = `
    You are an expert trader utilizing the "Pivot Boss" methodology (Frank Ochoa).
    Analyze the following CPR (Central Pivot Range) data for ${stock.name} (${stock.symbol}).
    
    Current Price: ${stock.currentPrice}
    
    Daily CPR: Width=${stock.timeframeData.DAILY.pivots.widthPercent.toFixed(2)}%, State=${stock.timeframeData.DAILY.cprState}, Relationship=${stock.timeframeData.DAILY.relationship}
    Daily Pivot: ${stock.timeframeData.DAILY.pivots.pivot.toFixed(2)}
    
    Weekly CPR: Width=${stock.timeframeData.WEEKLY.pivots.widthPercent.toFixed(2)}%, State=${stock.timeframeData.WEEKLY.cprState}, Relationship=${stock.timeframeData.WEEKLY.relationship}
    
    Monthly CPR: Width=${stock.timeframeData.MONTHLY.pivots.widthPercent.toFixed(2)}%, State=${stock.timeframeData.MONTHLY.cprState}, Relationship=${stock.timeframeData.MONTHLY.relationship}

    Specific Task:
    1. Identify any "Confluence" (e.g., Daily Pivot overlapping with Weekly Pivot).
    2. Highlight if there is a "Narrow CPR" breakout potential.
    3. Interpret the Value Relationship (e.g., Inside Value usually means pending breakout, Higher Value means bullish trend).
    4. Provide a 2-sentence actionable summary for a day trader.

    Keep it concise, professional, and technical.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.2, // Low temp for analytical consistency
      }
    });
    
    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating analysis. Please check API Key.";
  }
};