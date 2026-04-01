import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface PropertyAnalysis {
  propertyDetails: {
    beds: number;
    baths: number;
    sqft: number;
    yearBuilt?: number;
    propertyType: string;
  };
  baselinePrice: number;
  demandScore: number;
  priceSensitivity: number; // 0-100, how much demand is affected by price changes
  localSearchTrends: {
    period: string;
    interest: number;
  }[];
  migrationPatterns: {
    origin: string;
    basePercentage: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    priceElasticity: number; // How much this specific origin's interest changes with price
  }[];
  globalInterest: {
    region: string;
    level: string;
  }[];
  marketSummary: string;
}

export async function analyzeProperty(
  address: string,
  userCondition: string
): Promise<PropertyAnalysis> {
  try {
    const prompt = `
      Analyze the real estate market for the property at: ${address}.
      The user has assessed the condition as: ${userCondition}.

      Tasks:
      1. Search public records and real estate listings to find the property's details: beds, baths, square footage, year built, and property type (e.g., Single Family, Condo).
      2. Determine a realistic "Baseline Market Price" for this property in its current "${userCondition}" condition.
      3. Analyze current buyer demand (0-100 score) at this baseline price.
      4. Identify migration patterns: where are people moving from to this area? (Chicago, Miami, NY, NJ, International).
      5. Estimate "Price Sensitivity": How much does the total buyer pool shrink if the price increases by 10%?
      6. For each migration origin, estimate how sensitive they are to price changes (priceElasticity).

      Return the data in the specified JSON format. Use Google Search for the most current public records and market trends.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            propertyDetails: {
              type: Type.OBJECT,
              properties: {
                beds: { type: Type.NUMBER },
                baths: { type: Type.NUMBER },
                sqft: { type: Type.NUMBER },
                yearBuilt: { type: Type.NUMBER },
                propertyType: { type: Type.STRING }
              },
              required: ["beds", "baths", "sqft", "propertyType"]
            },
            baselinePrice: { type: Type.NUMBER, description: "Estimated market value in USD" },
            demandScore: { type: Type.NUMBER, description: "Base demand score 0-100" },
            priceSensitivity: { type: Type.NUMBER, description: "0-100 score of how much demand drops as price rises" },
            localSearchTrends: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  period: { type: Type.STRING },
                  interest: { type: Type.NUMBER }
                }
              }
            },
            migrationPatterns: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  origin: { type: Type.STRING },
                  basePercentage: { type: Type.NUMBER },
                  trend: { type: Type.STRING, enum: ["increasing", "decreasing", "stable"] },
                  priceElasticity: { type: Type.NUMBER, description: "How much this origin's interest shifts with price (0.5 to 2.0)" }
                }
              }
            },
            globalInterest: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  region: { type: Type.STRING },
                  level: { type: Type.STRING }
                }
              }
            },
            marketSummary: { type: Type.STRING }
          },
          required: ["propertyDetails", "baselinePrice", "demandScore", "priceSensitivity", "localSearchTrends", "migrationPatterns", "globalInterest", "marketSummary"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response received from the analysis engine.");
    }

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Analysis Error:", error);
    throw new Error("The analysis engine encountered an issue. Please check the address and try again.");
  }
}
