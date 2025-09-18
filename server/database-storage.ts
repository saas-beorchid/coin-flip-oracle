import { 
  users, type User, type InsertUser,
  flipHistory, type FlipHistory, type InsertFlipHistory,
  coinSettings, type CoinSettings
} from "@shared/schema";
import { IStorage } from "./storage";
import { db } from "./lib/database";
import { desc, eq, count, sql, SQL } from "drizzle-orm";

/**
 * PostgreSQL implementation of the storage interface
 */
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Flip history operations
  async getAllFlipHistory(): Promise<FlipHistory[]> {
    // Return in reverse chronological order (newest first)
    return db.select().from(flipHistory).orderBy(desc(flipHistory.timestamp));
  }

  async addFlipToHistory(flip: InsertFlipHistory): Promise<FlipHistory> {
    // Fill in default values for optional fields
    const newFlip = {
      ...flip,
      headsLabel: flip.headsLabel || "HEADS",
      tailsLabel: flip.tailsLabel || "TAILS",
      coinStyle: flip.coinStyle || "default",
      context: flip.context || null,
      aiSuggestion: flip.aiSuggestion || null
    };
    
    const result = await db.insert(flipHistory).values(newFlip).returning();
    return result[0];
  }

  async clearFlipHistory(): Promise<void> {
    await db.delete(flipHistory);
  }

  async getFlipStats(): Promise<{ headsCount: number; tailsCount: number; totalCount: number }> {
    // Use a single SQL query to get all stats for better performance
    const statsQuery = await db.select({
      headsCount: sql<number>`SUM(CASE WHEN ${flipHistory.outcome} = 'heads' THEN 1 ELSE 0 END)`,
      tailsCount: sql<number>`SUM(CASE WHEN ${flipHistory.outcome} = 'tails' THEN 1 ELSE 0 END)`,
      totalCount: count()
    }).from(flipHistory);
    
    const stats = statsQuery[0];
    
    return {
      headsCount: stats.headsCount || 0,
      tailsCount: stats.tailsCount || 0,
      totalCount: stats.totalCount || 0
    };
  }

  // Coin settings operations
  async getCoinSettings(): Promise<CoinSettings | undefined> {
    const result = await db.select().from(coinSettings).limit(1);
    
    // Return the first settings object, or create default if none found
    if (result.length === 0) {
      return this.updateCoinSettings({
        headsLabel: "HEADS",
        tailsLabel: "TAILS",
        coinStyle: "default"
      });
    }
    
    return result[0];
  }

  async updateCoinSettings(settings: Partial<CoinSettings>): Promise<CoinSettings> {
    // Get current settings
    const current = await this.getCoinSettings();
    
    // If settings exists, update it - otherwise create new
    if (current) {
      // Prepare update data
      const updateData: Partial<CoinSettings> = {};
      if (settings.headsLabel !== undefined) updateData.headsLabel = settings.headsLabel;
      if (settings.tailsLabel !== undefined) updateData.tailsLabel = settings.tailsLabel;
      if (settings.coinStyle !== undefined) updateData.coinStyle = settings.coinStyle;
      
      // Only update if there's something to update
      if (Object.keys(updateData).length > 0) {
        const result = await db
          .update(coinSettings)
          .set(updateData)
          .where(eq(coinSettings.id, current.id))
          .returning();
        
        return result[0];
      }
      
      return current;
    } else {
      // Create new settings
      const newSettings = {
        headsLabel: settings.headsLabel || "HEADS",
        tailsLabel: settings.tailsLabel || "TAILS",
        coinStyle: settings.coinStyle || "default"
      };
      
      const result = await db
        .insert(coinSettings)
        .values(newSettings)
        .returning();
      
      return result[0];
    }
  }
  
  // Payment operations (using in-memory storage for simplicity in development)
  private paymentStatus = new Map<string, boolean>();
  
  async getPaymentStatus(userId: string): Promise<boolean> {
    return this.paymentStatus.get(userId) || false;
  }
  
  async setPaymentStatus(userId: string, hasPaid: boolean): Promise<void> {
    this.paymentStatus.set(userId, hasPaid);
  }
}