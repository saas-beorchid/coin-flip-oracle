import OpenAI from "openai";

// Ensure OPENAI_API_KEY is defined
if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY environment variable is not defined");
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "",
  maxRetries: 3, // Retry failed requests up to 3 times
  timeout: 15000 // 15 second timeout to prevent long-running requests
});

// Simple in-memory cache for AI suggestions to reduce API calls
class SuggestionCache {
  private cache: Map<string, { suggestion: string; expiry: number }>;
  private readonly TTL: number = 3600000; // 1 hour cache TTL
  private readonly MAX_ENTRIES: number = 1000; // Prevent memory leaks
  
  constructor() {
    this.cache = new Map();
  }
  
  getKey(outcome: string, context: string, headsLabel: string, tailsLabel: string): string {
    // Create a unique key based on input parameters
    return `${outcome}:${context}:${headsLabel}:${tailsLabel}`;
  }
  
  get(outcome: string, context: string, headsLabel: string, tailsLabel: string): string | null {
    const key = this.getKey(outcome, context, headsLabel, tailsLabel);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.suggestion;
  }
  
  set(outcome: string, context: string, headsLabel: string, tailsLabel: string, suggestion: string): void {
    // Prevent cache from growing too large
    if (this.cache.size >= this.MAX_ENTRIES) {
      // Remove oldest entry (first entry in the map)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    const key = this.getKey(outcome, context, headsLabel, tailsLabel);
    const expiry = Date.now() + this.TTL;
    this.cache.set(key, { suggestion, expiry });
  }
}

const suggestionCache = new SuggestionCache();

/**
 * Gets AI suggestion based on coin flip outcome and decision context
 * Optimized for high traffic with caching and error handling
 */
export async function getAISuggestion(outcome: string, context: string, headsLabel: string = "HEADS", tailsLabel: string = "TAILS"): Promise<string> {
  try {
    // Normalize context to improve cache hits
    const normalizedContext = context.trim().toLowerCase();
    
    // Check cache first to reduce API calls
    const cachedSuggestion = suggestionCache.get(outcome, normalizedContext, headsLabel, tailsLabel);
    if (cachedSuggestion) {
      return cachedSuggestion;
    }
    
    // If similar context exists with different case, use that suggestion
    const similarContext = suggestionCache.get(outcome, normalizedContext, headsLabel.toUpperCase(), tailsLabel.toUpperCase());
    if (similarContext) {
      return similarContext;
    }
    
    const prompt = `
      You are a helpful AI assistant for a coin flip decision-making app.
      
      The user flipped a coin for the following decision: "${context}"
      
      The coin landed on: ${outcome === 'heads' ? headsLabel : tailsLabel}.
      
      Please provide a brief, helpful suggestion or insight based on this result. 
      Your response should be positive, playful, and around 2-3 sentences.
      
      Response in this exact format (JSON):
      {
        "suggestion": "Your helpful advice or suggestion here."
      }
    `;

    // Use a smaller model for faster responses
    const response = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        { role: "system", content: "You are a helpful assistant for a coin flip app." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 150,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    const result = JSON.parse(content);
    
    // Cache the result to reduce future API calls
    suggestionCache.set(outcome, normalizedContext, headsLabel, tailsLabel, result.suggestion);
    
    return result.suggestion;
  } catch (error) {
    console.error("Error getting AI suggestion:", error);
    
    // Log error details for monitoring and diagnostics
    if (error instanceof Error) {
      console.error(`Error type: ${error.name}, Message: ${error.message}`);
      console.error(`Stack trace: ${error.stack}`);
    }
    
    return "I couldn't generate a suggestion right now. Trust your intuition based on the coin flip result!";
  }
}
